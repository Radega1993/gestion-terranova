import { IsString, IsDate, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TipoInstalacion } from '../schemas/reserva.schema';

export class CreateReservaDto {
    @IsString()
    socio: string;

    @IsDate()
    @Type(() => Date)
    fechaInicio: Date;

    @IsDate()
    @Type(() => Date)
    fechaFin: Date;

    @IsEnum(TipoInstalacion)
    tipoInstalacion: TipoInstalacion;

    @IsNumber()
    precio: number;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ServicioReservaDto)
    servicios?: ServicioReservaDto[];

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => SuplementoReservaDto)
    suplementos?: SuplementoReservaDto[];
}

export class UpdateReservaDto {
    @IsString()
    @IsOptional()
    socio?: string;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    fechaInicio?: Date;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    fechaFin?: Date;

    @IsEnum(TipoInstalacion)
    @IsOptional()
    tipoInstalacion?: TipoInstalacion;

    @IsNumber()
    @IsOptional()
    precio?: number;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ServicioReservaDto)
    servicios?: ServicioReservaDto[];

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => SuplementoReservaDto)
    suplementos?: SuplementoReservaDto[];
}

export class ServicioReservaDto {
    @IsString()
    servicio: string;

    @IsNumber()
    cantidad: number;

    @IsNumber()
    precio: number;
}

export class SuplementoReservaDto {
    @IsString()
    suplemento: string;

    @IsNumber()
    cantidad: number;

    @IsNumber()
    precio: number;
} 