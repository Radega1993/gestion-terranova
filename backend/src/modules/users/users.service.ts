import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { UserRole } from './types/user-roles.enum';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>
    ) { }

    async findOneByUsername(username: string): Promise<User> {
        const user = await this.userModel.findOne({ username }).exec();
        if (!user) {
            throw new NotFoundException(`Usuario con username ${username} no encontrado`);
        }
        return user;
    }

    async findByEmail(email: string): Promise<User> {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user) {
            throw new NotFoundException(`Usuario con email ${email} no encontrado`);
        }
        return user;
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

    async create(createUserDto: any): Promise<User> {
        const { email, username } = createUserDto;

        // Verificar si el usuario ya existe
        const existingUser = await this.userModel.findOne({
            $or: [{ email }, { username }]
        });
        if (existingUser) {
            throw new ConflictException('El email o username ya está registrado');
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const newUser = new this.userModel({
            ...createUserDto,
            password: hashedPassword,
            rol: createUserDto.rol || UserRole.SOCIO
        });

        return newUser.save();
    }

    async update(id: string, updateUserDto: any): Promise<User> {
        if (updateUserDto.password) {
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        const updatedUser = await this.userModel
            .findByIdAndUpdate(id, updateUserDto, { new: true })
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
} 