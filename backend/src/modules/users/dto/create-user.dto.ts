import { IsString, IsNotEmpty, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '../types/user-roles.enum';

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    apellido: string;

    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;
} 