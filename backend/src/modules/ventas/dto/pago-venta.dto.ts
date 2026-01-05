import { IsNumber, IsEnum, Min, Max, IsString, IsOptional } from 'class-validator';

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

    @IsString()
    @IsOptional()
    trabajadorId?: string;  // Trabajador asignado (obligatorio si usuario es TIENDA)
} 