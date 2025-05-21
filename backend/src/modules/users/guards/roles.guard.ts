import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
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

        this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);

        if (!requiredRoles) {
            this.logger.debug('No roles required, access granted');
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

            this.logger.debug(`Token decoded: ${JSON.stringify({
                sub: decoded.sub,
                username: decoded.username,
                role: decoded.role
            })}`);

            if (!decoded || !decoded.role) {
                this.logger.warn('Invalid token: no role found');
                throw new UnauthorizedException('Token inválido o sin rol');
            }

            const userRole = decoded.role as UserRole;
            const hasRequiredRole = requiredRoles.includes(userRole);

            this.logger.debug(`User role: ${userRole}, Has required role: ${hasRequiredRole}`);

            if (!hasRequiredRole) {
                this.logger.warn(`Access denied - User role ${userRole} does not have required roles: ${requiredRoles.join(', ')}`);
                throw new UnauthorizedException('No tiene los permisos necesarios');
            }

            return true;
        } catch (error) {
            this.logger.error(`Error verifying token: ${error.message}`);
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }
} 