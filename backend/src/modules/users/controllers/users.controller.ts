import { Controller, Get, Post, Body, Param, Put, Delete, UnauthorizedException, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from '../users.service';
import { User } from '../schemas/user.schema';
import { UserRole } from '../types/user-roles.enum';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthService } from '../../auth/services/auth.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
    private readonly logger = new Logger(UsersController.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService
    ) { }

    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        try {
            const user = await this.usersService.create(createUserDto);
            return { message: 'Usuario creado exitosamente', user };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error al crear el usuario');
        }
    }

    @Post('login')
    async login(@Body() loginUserDto: LoginUserDto) {
        try {
            return await this.usersService.login(loginUserDto);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException('Error al iniciar sesión');
        }
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async findAll() {
        this.logger.debug('Fetching all users');
        const users = await this.usersService.findAll();
        return users.map(user => ({
            _id: user._id,
            username: user.username,
            nombre: user.nombre,
            apellidos: user.apellido,
            role: user.role,
            activo: user.isActive,
            lastLogin: user.lastLogin
        }));
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }
} 