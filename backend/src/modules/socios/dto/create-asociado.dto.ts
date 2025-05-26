import { IsString, IsOptional, IsDate } from 'class-validator';

export class CreateAsociadoDto {
    @IsString()
    nombre: string;

    @IsOptional()
    @IsDate()
    fechaNacimiento?: Date;

    @IsOptional()
    @IsString()
    telefono?: string;

    @IsOptional()
    @IsString()
    foto?: string;
} 