import { Injectable, UnauthorizedException, Inject, forwardRef, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { UserDocument } from '../../users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @Inject(forwardRef(() => UsersService))
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(username: string, password: string): Promise<any> {
        this.logger.debug('=== INICIO DE VALIDACIÓN DE USUARIO ===');
        this.logger.debug(`Validando usuario: ${username}`);

        try {
            const user = await this.usersService.findOneByUsername(username);
            this.logger.debug('Usuario encontrado en base de datos');
            this.logger.debug(`Datos del usuario: ${JSON.stringify(user, null, 2)}`);

            if (user && await bcrypt.compare(password, user.password)) {
                if (!user.isActive) {
                    throw new UnauthorizedException('Usuario desactivado');
                }
                this.logger.debug('Contraseña válida');
                const { password, ...result } = user;
                this.logger.debug(`Resultado de validación: ${JSON.stringify(result, null, 2)}`);
                this.logger.debug('=== FIN DE VALIDACIÓN EXITOSA ===');
                return result;
            }

            this.logger.warn('Contraseña inválida o usuario no encontrado');
            this.logger.debug('=== FIN DE VALIDACIÓN FALLIDA ===');
            return null;
        } catch (error) {
            this.logger.error(`Error al validar usuario: ${error.message}`);
            this.logger.debug('=== FIN DE VALIDACIÓN CON ERROR ===');
            throw error;
        }
    }

    async login(user: any) {
        this.logger.debug('=== INICIO DE GENERACIÓN DE TOKEN ===');
        this.logger.debug(`Generando token para usuario: ${user.username}`);
        this.logger.debug(`Datos del usuario: ${JSON.stringify(user, null, 2)}`);

        try {
            const payload = {
                sub: user._doc._id,
                username: user._doc.username,
                nombre: user._doc.nombre,
                role: user._doc.role,
                isActive: user._doc.isActive
            };
            this.logger.debug('Payload generado:', JSON.stringify(payload, null, 2));

            // Si el usuario es TIENDA, token expira SIEMPRE en 24h
            const expiresIn = user._doc.role === 'TIENDA' ? '24h' : undefined;
            const signOptions = expiresIn ? { expiresIn } : {};
            
            const token = this.jwtService.sign(payload, signOptions);
            this.logger.debug('Token generado exitosamente');
            this.logger.debug('Token decodificado:', JSON.stringify(this.jwtService.decode(token), null, 2));
            this.logger.debug('=== FIN DE GENERACIÓN DE TOKEN ===');

            return {
                access_token: token,
                user: {
                    _id: user._doc._id,
                    username: user._doc.username,
                    nombre: user._doc.nombre,
                    role: user._doc.role,
                    isActive: user._doc.isActive
                }
            };
        } catch (error) {
            this.logger.error('Error en login:', error);
            this.logger.debug('=== FIN DE GENERACIÓN DE TOKEN CON ERROR ===');
            throw new UnauthorizedException('Error en el proceso de login');
        }
    }
} 