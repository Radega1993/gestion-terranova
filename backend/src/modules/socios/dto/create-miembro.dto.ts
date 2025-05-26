import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMiembroDto {
    @IsString()
    nombre: string;

    @IsOptional()
    @IsDateString()
    fechaNacimiento?: Date;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsString()
    foto?: string;
} 