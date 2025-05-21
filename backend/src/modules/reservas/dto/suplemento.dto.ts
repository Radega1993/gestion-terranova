import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export enum TipoSuplemento {
    FIJO = 'FIJO',
    HORARIO = 'HORARIO'
}

export class CreateSuplementoDto {
    @IsString()
    nombre: string;

    @IsNumber()
    precio: number;

    @IsEnum(TipoSuplemento)
    tipo: TipoSuplemento;

    @IsNumber()
    @IsOptional()
    cantidad?: number;
}

export class UpdateSuplementoDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsNumber()
    @IsOptional()
    precio?: number;

    @IsEnum(TipoSuplemento)
    @IsOptional()
    tipo?: TipoSuplemento;

    @IsNumber()
    @IsOptional()
    cantidad?: number;
} 