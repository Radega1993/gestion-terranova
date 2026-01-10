import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // Si hay un error o el usuario no está autenticado
        if (err || !user) {
            // Si el token ha expirado, info contendrá el error de expiración
            if (info?.name === 'TokenExpiredError' || info?.message?.includes('expired')) {
                throw new UnauthorizedException({
                    message: 'Token expirado',
                    code: 'TOKEN_EXPIRED',
                    expiredAt: info.expiredAt
                });
            }
            // Si el token es inválido
            if (info?.name === 'JsonWebTokenError' || info?.name === 'TokenExpiredError') {
                throw new UnauthorizedException({
                    message: 'Token inválido o expirado',
                    code: 'TOKEN_INVALID'
                });
            }
            throw err || new UnauthorizedException('No autorizado');
        }
        return user;
    }
} 