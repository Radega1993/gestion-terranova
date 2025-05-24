import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET'),
        });
    }

    async validate(payload: any) {
        this.logger.debug(`Validating JWT payload: ${JSON.stringify(payload)}`);

        const user = await this.usersService.findOne(payload.sub);
        if (!user) {
            this.logger.warn(`User not found for payload: ${JSON.stringify(payload)}`);
            return null;
        }

        // Mantener el role como string, no convertirlo a array
        return {
            _id: user._id,
            username: user.username,
            role: user.role,
            isActive: user.isActive
        };
    }
} 