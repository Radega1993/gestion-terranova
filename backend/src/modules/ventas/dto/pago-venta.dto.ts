import { IsNumber, IsEnum, Min, Max, IsString } from 'class-validator';

export enum MetodoPago {
    EFECTIVO = 'EFECTIVO',
    TARJETA = 'TARJETA'
}

export class PagoVentaDto {
    @IsNumber()
    @Min(0)
    pagado: number;

    @IsEnum(MetodoPago)
    metodoPago: MetodoPago;

    @IsString()
    observaciones: string;
} 