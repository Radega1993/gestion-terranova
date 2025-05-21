import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '../types/user-roles.enum';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    apellidos?: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsEnum(UserRole)
    @IsOptional()
    rol?: UserRole;

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