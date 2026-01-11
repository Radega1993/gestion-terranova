import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, BadRequestException, Logger } from '@nestjs/common';
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

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async findAll() {
        const users = await this.usersService.findAll();
        return users.map(user => ({
            _id: user._id,
            username: user.username,
            nombre: user.nombre,
            apellidos: user.apellidos,
            role: user.role,
            activo: user.isActive,
            lastLogin: user.lastLogin
        }));
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR)
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        try {
            const updatedUser = await this.usersService.update(id, updateUserDto);
            return { message: 'Usuario actualizado exitosamente', user: updatedUser };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Error al actualizar el usuario');
        }
    }

    @Put(':id/toggle-active')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async toggleActive(@Param('id') id: string) {
        try {
            const updatedUser = await this.usersService.toggleActive(id);
            return {
                message: `Usuario ${updatedUser.isActive ? 'activado' : 'desactivado'} exitosamente`,
                user: {
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    nombre: updatedUser.nombre,
                    apellidos: updatedUser.apellidos,
                    role: updatedUser.role,
                    activo: updatedUser.isActive,
                    lastLogin: updatedUser.lastLogin
                }
            };
        } catch (error) {
            this.logger.error(`Error al cambiar estado del usuario: ${error.message}`);
            throw error;
        }
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async remove(@Param('id') id: string) {
        try {
            await this.usersService.remove(id);
            return { message: 'Usuario eliminado exitosamente' };
        } catch (error) {
            this.logger.error(`Error al eliminar usuario: ${error.message}`);
            throw error;
        }
    }
} 