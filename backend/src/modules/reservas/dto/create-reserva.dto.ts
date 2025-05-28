import { IsDate, IsMongoId, IsNumber, IsOptional, IsString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago } from '../schemas/reserva.schema';

class SuplementoDto {
    @IsString()
    id: string;

    @IsNumber()
    @IsOptional()
    cantidad?: number;
}

export class CreateReservaDto {
    @IsDate()
    @Type(() => Date)
    fecha: Date;

    @IsString()
    tipoInstalacion: string;

    @IsMongoId()
    socio: string;

    @IsMongoId()
    usuarioCreacion: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SuplementoDto)
    suplementos: SuplementoDto[];

    @IsNumber()
    precio: number;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsNumber()
    @IsOptional()
    montoAbonado?: number;

    @IsEnum(MetodoPago)
    @IsOptional()
    metodoPago?: MetodoPago;
} 