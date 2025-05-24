import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
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

        this.logger.debug(`Required roles: ${requiredRoles}`);

        if (!requiredRoles) {
            this.logger.debug('No roles required, access granted');
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        this.logger.debug(`User from request: ${JSON.stringify(user)}`);

        if (!user || !user.role) {
            this.logger.warn(`No role found for user: ${JSON.stringify(user)}`);
            return false;
        }

        const hasRole = requiredRoles.includes(user.role);
        this.logger.debug(`User role: ${user.role}, Has required role: ${hasRole}`);

        return hasRole;
    }
} 