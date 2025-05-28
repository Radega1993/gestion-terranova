import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateServicioDto {
    @IsString()
    id: string;

    @IsString()
    nombre: string;

    @IsNumber()
    precio: number;

    @IsString()
    color: string;

    @IsString()
    colorConObservaciones: string;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}

export class UpdateServicioDto {
    @IsString()
    @IsOptional()
    id?: string;

    @IsString()
    @IsOptional()
    nombre?: string;

    @IsNumber()
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
} 