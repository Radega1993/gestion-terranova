import { IsString, IsDate, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservaDto {
    @IsString()
    socio: string;

    @IsDate()
    @Type(() => Date)
    fecha: Date;

    @IsString()
    tipoInstalacion: string;

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
    fecha?: Date;


    @IsString()
    tipoInstalacion: string;

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