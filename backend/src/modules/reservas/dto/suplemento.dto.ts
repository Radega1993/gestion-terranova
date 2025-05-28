import { IsString, IsNumber, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { TipoSuplemento } from '../schemas/suplemento.schema';

export class CreateSuplementoDto {
    @IsString()
    id: string;

    @IsString()
    nombre: string;

    @IsNumber()
    precio: number;

    @IsEnum(TipoSuplemento)
    tipo: TipoSuplemento;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}

export class UpdateSuplementoDto {
    @IsString()
    @IsOptional()
    id?: string;

    @IsString()
    @IsOptional()
    nombre?: string;

    @IsNumber()
    @IsOptional()
    precio?: number;

    @IsEnum(TipoSuplemento)
    @IsOptional()
    tipo?: TipoSuplemento;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
} 