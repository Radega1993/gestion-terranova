import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '../types/user-roles.enum';

export class CreateUserDto {
    @IsString()
    username: string;

    @IsString()
    password: string;

    @IsString()
    nombre: string;

    @IsString()
    @IsOptional()
    apellidos?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsEnum(UserRole)
    rol: UserRole;

    @IsString()
    @IsOptional()
    telefono?: string;

    @IsString()
    @IsOptional()
    direccion?: string;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
} 