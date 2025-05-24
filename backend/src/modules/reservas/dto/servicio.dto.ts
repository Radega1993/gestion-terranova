import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateServicioDto {
    @IsString()
    nombre: string;

    @IsString()
    descripcion: string;

    @IsNumber()
    precio: number;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}

export class UpdateServicioDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsNumber()
    @IsOptional()
    precio?: number;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
} 