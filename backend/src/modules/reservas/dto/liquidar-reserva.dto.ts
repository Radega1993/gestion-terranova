import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MetodoPago } from '../schemas/reserva.schema';

export class LiquidarReservaDto {
    @IsNumber()
    montoAbonado: number;

    @IsEnum(MetodoPago)
    metodoPago: MetodoPago;

    @IsString()
    @IsOptional()
    observaciones?: string;
} 