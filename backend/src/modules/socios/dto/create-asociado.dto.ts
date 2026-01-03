import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateAsociadoDto {
    @IsString()
    nombre: string;

    @IsOptional()
    @IsString()
    codigo?: string;

    @IsOptional()
    @IsDateString()
    fechaNacimiento?: string;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsString()
    foto?: string;
} 