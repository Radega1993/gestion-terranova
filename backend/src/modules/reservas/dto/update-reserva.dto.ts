import { IsDate, IsMongoId, IsEnum, IsNumber, IsOptional, IsString, Min, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoReserva, MetodoPago } from '../schemas/reserva.schema';
import { TipoSuplemento } from '../schemas/suplemento.schema';
import { PartialType } from '@nestjs/mapped-types';
import { CreateReservaDto } from './create-reserva.dto';

class SuplementoDto {
    @IsString()
    id: string;

    @IsOptional()
    @IsNumber()
    cantidad?: number;
}

export class UpdateReservaDto extends PartialType(CreateReservaDto) {
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    fecha?: Date;

    @IsOptional()
    @IsString()
    tipoInstalacion?: string;

    @IsOptional()
    @IsMongoId()
    socio?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SuplementoDto)
    suplementos?: SuplementoDto[];

    @IsOptional()
    @IsNumber()
    precio?: number;

    @IsOptional()
    @IsEnum(EstadoReserva)
    estado?: EstadoReserva;

    @IsOptional()
    @IsMongoId()
    confirmadoPor?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    fechaConfirmacion?: Date;

    @IsOptional()
    @IsString()
    motivoCancelacion?: string;

    @IsOptional()
    @IsString()
    observaciones?: string;

    @IsOptional()
    @IsNumber()
    montoAbonado?: number;

    @IsOptional()
    @IsNumber()
    montoDevuelto?: number;

    @IsOptional()
    @IsEnum(MetodoPago)
    metodoPago?: MetodoPago;

    @IsOptional()
    @IsBoolean()
    pendienteRevisionJunta?: boolean;
} 