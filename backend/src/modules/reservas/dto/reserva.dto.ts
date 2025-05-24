import { IsString, IsDate, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservaDto {
    @IsString()
    socio: string;

    @IsDate()
    @Type(() => Date)
    fechaInicio: Date;

    @IsDate()
    @Type(() => Date)
    fechaFin: Date;

    @IsString()
    instalacion: string;

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

    @IsString()
    @IsOptional()
    instalacion?: string;

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