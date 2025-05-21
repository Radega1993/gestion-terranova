import { IsString, IsDate, IsMongoId, IsArray, IsOptional, IsNumber, Min, IsEnum, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoReserva } from '../schemas/reserva.schema';

export class SuplementoDto {
    @IsMongoId()
    id: string;

    @IsString()
    nombre: string;

    @IsNumber()
    precio: number;

    @IsNumber()
    cantidad: number;

    @IsString()
    tipo: string;
}

export class CreateReservaDto {
    @IsMongoId()
    socio: string;

    @IsString()
    tipoInstalacion: string;

    @IsDate()
    @Type(() => Date)
    fecha: Date;

    @IsString()
    hora: string;

    @IsNumber()
    precio: number;

    @IsNumber()
    @IsOptional()
    montoAbonado?: number;

    @IsString()
    @IsOptional()
    metodoPago?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SuplementoDto)
    @IsOptional()
    suplementos?: SuplementoDto[];

    @IsString()
    @IsOptional()
    estado?: string;

    @IsString()
    @IsOptional()
    observaciones?: string;
} 