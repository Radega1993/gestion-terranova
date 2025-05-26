import { IsString, IsEnum, IsOptional, IsBoolean, MinLength, ValidateIf } from 'class-validator';
import { UserRole } from '../types/user-roles.enum';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsOptional()
    @ValidateIf((o) => o.password !== undefined)
    @MinLength(4)
    password?: string;

    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    apellidos?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
} 