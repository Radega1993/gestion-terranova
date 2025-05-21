import { Injectable, UnauthorizedException, Inject, forwardRef, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/services/users.service';
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

            if (user && await bcrypt.compare(password, user.password)) {
                this.logger.debug('Contraseña válida');
                const { password, ...result } = user.toObject();
                this.logger.debug('=== FIN DE VALIDACIÓN EXITOSA ===');
                return result;
            }

            this.logger.warn('Contraseña inválida o usuario no encontrado');
            this.logger.debug('=== FIN DE VALIDACIÓN FALLIDA ===');
            return null;
        } catch (error) {
            this.logger.error('Error en validateUser:', error);
            this.logger.debug('=== FIN DE VALIDACIÓN CON ERROR ===');
            return null;
        }
    }

    async login(user: any) {
        this.logger.debug('=== INICIO DE GENERACIÓN DE TOKEN ===');
        this.logger.debug(`Generando token para usuario: ${user.username}`);

        try {
            const payload = {
                username: user.username,
                sub: user._id,
                rol: user.rol
            };
            this.logger.debug('Payload generado:', JSON.stringify(payload, null, 2));

            const token = this.jwtService.sign(payload);
            this.logger.debug('Token generado exitosamente');
            this.logger.debug('=== FIN DE GENERACIÓN DE TOKEN ===');

            return {
                access_token: token,
                user: {
                    _id: user._id,
                    username: user.username,
                    nombre: user.nombre,
                    apellidos: user.apellidos,
                    rol: user.rol
                }
            };
        } catch (error) {
            this.logger.error('Error en login:', error);
            this.logger.debug('=== FIN DE GENERACIÓN DE TOKEN CON ERROR ===');
            throw new UnauthorizedException('Error en el proceso de login');
        }
    }
} 