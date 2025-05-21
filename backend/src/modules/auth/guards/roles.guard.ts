import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/types/user-roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    private readonly logger = new Logger(RolesGuard.name);

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            this.logger.debug('No roles required, access granted');
            return true;
        }

        this.logger.debug(`Required roles: ${requiredRoles.join(', ')}`);

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            this.logger.warn('No user found in request');
            throw new UnauthorizedException('Usuario no autenticado');
        }

        if (!user.roles || !Array.isArray(user.roles)) {
            this.logger.warn(`Invalid roles format: ${JSON.stringify(user.roles)}`);
            throw new UnauthorizedException('Formato de roles inválido');
        }

        const hasRole = requiredRoles.some((role) => user.roles.includes(role));

        this.logger.debug(`User roles: ${user.roles.join(', ')}, Has required role: ${hasRole}`);

        if (!hasRole) {
            this.logger.warn(`Access denied - User roles [${user.roles.join(', ')}] do not include any of required roles: [${requiredRoles.join(', ')}]`);
            throw new UnauthorizedException('No tiene los permisos necesarios');
        }

        return hasRole;
    }
} 