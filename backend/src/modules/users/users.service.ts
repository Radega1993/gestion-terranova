import { Injectable, NotFoundException, ConflictException, UnauthorizedException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { UserRole } from './types/user-roles.enum';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
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

    async create(createUserDto: CreateUserDto): Promise<User> {
        this.logger.debug(`Creando usuario: ${createUserDto.username}`);

        // Verificar si el usuario ya existe
        const existingUser = await this.userModel.findOne({
            username: createUserDto.username
        }).exec();

        if (existingUser) {
            throw new ConflictException('El usuario ya existe');
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        // Crear el nuevo usuario
        const newUser = new this.userModel({
            ...createUserDto,
            password: hashedPassword,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return newUser.save();
    }

    async findAll(): Promise<User[]> {
        return this.userModel.find().exec();
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
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

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        const updatedUser = await this.userModel
            .findByIdAndUpdate(id, { ...updateUserDto, updatedAt: new Date() }, { new: true })
            .exec();

        if (!updatedUser) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        return updatedUser;
    }

    async remove(id: string): Promise<void> {
        const result = await this.userModel.deleteOne({ _id: id }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
    }

    async toggleActive(id: string): Promise<User> {
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }

        // No permitir desactivar el último administrador
        if (user.role === UserRole.ADMINISTRADOR && user.isActive) {
            const adminCount = await this.userModel.countDocuments({
                role: UserRole.ADMINISTRADOR,
                isActive: true
            }).exec();

            if (adminCount <= 1) {
                throw new BadRequestException('No se puede desactivar el último administrador');
            }
        }

        user.isActive = !user.isActive;
        return user.save();
    }
} 