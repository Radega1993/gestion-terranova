import { Controller, Get, Post, Body, Param, Put, Delete, UnauthorizedException, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from '../services/users.service';
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

    @Post('login')
    async login(@Body() loginUserDto: LoginUserDto) {
        this.logger.debug('=== INICIO DE LOGIN ===');
        this.logger.debug(`Intento de login para usuario: ${loginUserDto.username}`);
        this.logger.debug('Datos recibidos:', JSON.stringify(loginUserDto, null, 2));

        try {
            const user = await this.authService.validateUser(loginUserDto.username, loginUserDto.password);
            this.logger.debug('Resultado de validación:', user ? 'Usuario válido' : 'Usuario inválido');

            if (!user) {
                this.logger.warn('Credenciales inválidas');
                throw new UnauthorizedException('Credenciales inválidas');
            }

            const result = await this.authService.login(user);
            this.logger.debug('Login exitoso, token generado');
            this.logger.debug('=== FIN DE LOGIN ===');

            return {
                ...result,
                rol: user.rol,
                username: user.username
            };
        } catch (error) {
            this.logger.error('Error en login:', error);
            this.logger.debug('=== FIN DE LOGIN CON ERROR ===');
            throw error;
        }
    }

    @Post('register')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async register(@Body() createUserDto: CreateUserDto) {
        try {
            this.logger.debug(`Datos recibidos para crear usuario: ${JSON.stringify({
                ...createUserDto,
                password: createUserDto.password ? '***' : undefined
            })}`);

            // Validaciones básicas
            if (!createUserDto.nombre || !createUserDto.username || !createUserDto.password) {
                throw new BadRequestException('Nombre, username y contraseña son campos obligatorios');
            }

            // Validar que el rol sea válido
            if (!Object.values(UserRole).includes(createUserDto.rol)) {
                throw new BadRequestException('Rol no válido');
            }

            // Limpiamos campos vacíos para evitar problemas con índices únicos
            const cleanedData = { ...createUserDto };
            Object.keys(cleanedData).forEach(key => {
                if (cleanedData[key] === '' || cleanedData[key] === null || cleanedData[key] === undefined) {
                    delete cleanedData[key];
                }
            });

            // Creamos el usuario con los datos limpios
            const newUser = await this.usersService.create(cleanedData);

            // Versión segura sin contraseña para los logs
            const safeUser = { ...newUser.toObject(), password: undefined };
            this.logger.debug(`Usuario creado exitosamente: ${JSON.stringify(safeUser)}`);

            return safeUser;
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`);
            if (error.code === 11000) {
                // Error de clave duplicada (probablemente username)
                throw new BadRequestException(
                    `El usuario ya existe. ${Object.keys(error.keyPattern || {}).join(', ')} debe ser único.`
                );
            }
            throw error;
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
            apellidos: user.apellidos,
            email: user.email,
            rol: user.rol,
            activo: user.activo,
            telefono: user.telefono,
            direccion: user.direccion,
            lastLogin: user.lastLogin
        }));
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async findOne(@Param('id') id: string) {
        this.logger.debug(`Fetching user with ID: ${id}`);
        return this.usersService.findOne(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        this.logger.debug(`Updating user with ID: ${id}`);
        return this.usersService.update(id, updateUserDto);
    }

    @Put(':id/password')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async updatePassword(@Param('id') id: string, @Body() updatePasswordDto: UpdatePasswordDto) {
        this.logger.debug(`Updating password for user with ID: ${id}`);
        return this.usersService.updatePassword(id, updatePasswordDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async remove(@Param('id') id: string) {
        this.logger.debug(`Removing user with ID: ${id}`);
        return this.usersService.remove(id);
    }

    @Put(':id/toggle-active')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMINISTRADOR)
    async toggleActive(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);
        return this.usersService.update(id, { activo: !user.activo });
    }
} 