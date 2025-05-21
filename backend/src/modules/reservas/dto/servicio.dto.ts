import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateServicioDto {
    @IsString()
    id: string;

    @IsString()
    nombre: string;

    @IsNumber()
    @Min(0)
    precio: number;

    @IsString()
    color: string;

    @IsString()
    colorConObservaciones: string;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;

    @IsString()
    @IsOptional()
    descripcion?: string;
}

export class UpdateServicioDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    precio?: number;

    @IsString()
    @IsOptional()
    color?: string;

    @IsString()
    @IsOptional()
    colorConObservaciones?: string;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;

    @IsString()
    @IsOptional()
    descripcion?: string;
} 