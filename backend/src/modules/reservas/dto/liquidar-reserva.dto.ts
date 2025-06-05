import { IsEnum, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoPago, EstadoReserva } from '../schemas/reserva.schema';

class PagoDto {
    @IsNumber()
    monto: number;

    @IsEnum(MetodoPago)
    metodoPago: MetodoPago;

    @IsString()
    fecha: string;
}

class SuplementoDto {
    @IsString()
    id: string;

    @IsNumber()
    @IsOptional()
    cantidad?: number;
}

export class LiquidarReservaDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SuplementoDto)
    suplementos: SuplementoDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PagoDto)
    pagos: PagoDto[];

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsEnum(EstadoReserva)
    estado: EstadoReserva;
} 