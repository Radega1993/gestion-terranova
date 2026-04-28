import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    ForbiddenException,
    Logger
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../types/user-roles.enum';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RolesGuard implements CanActivate {
    private readonly logger = new Logger(RolesGuard.name);

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);


        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader) {
            this.logger.warn('No authorization header provided');
            throw new UnauthorizedException('No se proporcionó el token de autenticación');
        }

        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

            if (!decoded || !decoded.role) {
                this.logger.warn('Invalid token: no role found');
                throw new UnauthorizedException('Token inválido o sin rol');
            }

            const userRole = decoded.role as UserRole;
            const hasRequiredRole = requiredRoles.includes(userRole);


            if (!hasRequiredRole) {
                this.logger.warn(
                    `Access denied - ${request.method} ${request.url} - User role ${userRole} does not have required roles: ${requiredRoles.join(', ')}`
                );
                throw new ForbiddenException('No tiene los permisos necesarios');
            }

            return true;
        } catch (error) {
            if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
                throw error;
            }
            this.logger.error(`Error verifying token: ${error.message}`);
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }
} 