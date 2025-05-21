import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';
import { UserRole } from '../types/user-roles.enum';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private configService: ConfigService
    ) { }

    async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    async login(loginUserDto: LoginUserDto) {
        this.logger.debug(`Buscando usuario con username: ${loginUserDto.username}`);
        const user = await this.userModel.findOne({ username: loginUserDto.username }).exec();

        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isPasswordValid = await this.validatePassword(loginUserDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!user.activo) {
            throw new UnauthorizedException('User is inactive');
        }

        const payload = {
            sub: user._id,
            username: user.username,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
            isActive: user.activo
        };

        const token = jwt.sign(payload, this.configService.get<string>('JWT_SECRET'), {
            expiresIn: '24h'
        });

        // Actualizar lastLogin
        await this.userModel.findByIdAndUpdate(user._id, {
            lastLogin: new Date(),
            updatedAt: new Date()
        }).exec();

        return { token, user };
    }

    async findAll(): Promise<User[]> {
        this.logger.debug('Buscando todos los usuarios');
        return this.userModel.find().select('-password').exec();
    }

    async findOne(id: string): Promise<User> {
        this.logger.debug(`Buscando usuario con ID: ${id}`);
        const user = await this.userModel.findById(id).select('-password').exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async findOneByUsername(username: string): Promise<User> {
        const user = await this.userModel.findOne({ username }).exec();
        if (!user) {
            throw new NotFoundException(`Usuario con username ${username} no encontrado`);
        }
        return user;
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        this.logger.debug(`Creando nuevo usuario con datos: ${JSON.stringify(createUserDto)}`);

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const createdUser = new this.userModel({
            ...createUserDto,
            password: hashedPassword,
            rol: createUserDto.rol || UserRole.SOCIO,
            activo: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        const savedUser = await createdUser.save();

        // No loguear la contraseña
        const userLog = { ...savedUser.toObject(), password: '[PROTECTED]' };
        this.logger.debug(`Usuario creado: ${JSON.stringify(userLog)}`);

        return savedUser;
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        this.logger.debug(`Actualizando usuario con ID: ${id}`);

        const updatedUser = await this.userModel
            .findByIdAndUpdate(id, { ...updateUserDto, updatedAt: new Date() }, { new: true })
            .select('-password')
            .exec();

        if (!updatedUser) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // No loguear datos sensibles
        const userLog = updatedUser ? { ...updatedUser.toObject() } : null;
        this.logger.debug(`Usuario actualizado: ${JSON.stringify(userLog)}`);

        return updatedUser;
    }

    async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<User> {
        this.logger.debug(`Actualizando contraseña del usuario con ID: ${id}`);

        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        const isPasswordValid = await this.validatePassword(updatePasswordDto.currentPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);
        const updatedUser = await this.userModel
            .findByIdAndUpdate(
                id,
                { password: hashedPassword, updatedAt: new Date() },
                { new: true }
            )
            .select('-password')
            .exec();

        return updatedUser;
    }

    async remove(id: string): Promise<void> {
        this.logger.debug(`Eliminando usuario con ID: ${id}`);
        const result = await this.userModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }

    async ensureAdminExists(): Promise<void> {
        this.logger.debug('Verificando existencia de usuario administrador');
        const admin = await this.userModel.findOne({ rol: UserRole.ADMINISTRADOR }).exec();

        if (!admin) {
            this.logger.debug('Creando usuario administrador por defecto');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const adminUser = new this.userModel({
                nombre: 'Administrador',
                username: 'admin',
                password: hashedPassword,
                rol: UserRole.ADMINISTRADOR,
                activo: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await adminUser.save();
            this.logger.debug('Usuario administrador creado');
        }
    }
} 