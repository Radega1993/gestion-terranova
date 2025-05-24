import { IsString, IsEnum, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { UserRole } from '../types/user-roles.enum';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @IsString()
    @IsOptional()
    nombre?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
} 