import { Controller, Post, Body, UseGuards, Get, Request, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoginUserDto } from '../../users/dto/login-user.dto';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() loginDto: LoginUserDto) {
        this.logger.debug(`Attempting login for user: ${loginDto.username}`);

        const user = await this.authService.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            this.logger.warn(`Login failed for user: ${loginDto.username}`);
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const result = await this.authService.login(user);
        this.logger.debug(`Login successful for user: ${loginDto.username}`);
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req) {
        this.logger.debug(`Getting profile for user: ${req.user.username}`);
        return req.user;
    }
} 