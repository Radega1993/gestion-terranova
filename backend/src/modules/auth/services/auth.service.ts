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

        try {
            const user = await this.usersService.findOneByUsername(username);

            if (user && await bcrypt.compare(password, user.password)) {
                if (!user.isActive) {
                    throw new UnauthorizedException('Usuario desactivado');
                }
                const { password, ...result } = user;
                return result;
            }

            this.logger.warn('Contraseña inválida o usuario no encontrado');
            return null;
        } catch (error) {
            this.logger.error(`Error al validar usuario: ${error.message}`);
            throw error;
        }
    }

    async login(user: any) {

        try {
            const payload = {
                sub: user._doc._id,
                username: user._doc.username,
                nombre: user._doc.nombre,
                role: user._doc.role,
                isActive: user._doc.isActive
            };

            // Si el usuario es TIENDA, token expira SIEMPRE en 24h
            const expiresIn = user._doc.role === 'TIENDA' ? '24h' : undefined;
            const signOptions = expiresIn ? { expiresIn } : {};
            
            const token = this.jwtService.sign(payload, signOptions);

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
            throw new UnauthorizedException('Error en el proceso de login');
        }
    }
} 