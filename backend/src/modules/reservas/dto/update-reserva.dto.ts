import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoReserva } from '../schemas/reserva.schema';
import { PartialType } from '@nestjs/mapped-types';
import { CreateReservaDto, SuplementoDto } from './create-reserva.dto';

export class UpdateReservaDto extends PartialType(CreateReservaDto) {
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    fecha?: Date;

    @IsOptional()
    @IsString()
    tipoInstalacion?: string;

    @IsOptional()
    @IsString()
    socio?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    numPersonas?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    precio?: number;

    @IsOptional()
    @IsEnum(EstadoReserva)
    estado?: EstadoReserva;

    @IsOptional()
    @IsString()
    confirmadoPor?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    fechaConfirmacion?: Date;

    @IsOptional()
    @IsString()
    motivoCancelacion?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SuplementoDto)
    suplementos?: SuplementoDto[];

    @IsOptional()
    @IsString()
    metodoPago?: string;

    @IsOptional()
    @IsString()
    referenciaPago?: string;
} 