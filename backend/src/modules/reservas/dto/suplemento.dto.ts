import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum TipoSuplemento {
    FIJO = 'FIJO',
    HORARIO = 'HORARIO'
}

export class CreateSuplementoDto {
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

export class UpdateSuplementoDto {
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