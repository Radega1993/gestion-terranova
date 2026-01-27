import { IsString, IsNotEmpty, IsEnum, IsOptional, IsMongoId } from 'class-validator';

export enum MetodoPagoCambio {
    EFECTIVO = 'EFECTIVO',
    TARJETA = 'TARJETA'
}

export class ProcesarPagoCambioDto {
    @IsEnum(MetodoPagoCambio)
    @IsNotEmpty()
    metodoPago: MetodoPagoCambio;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsMongoId()
    @IsOptional()
    trabajadorId?: string;  // Solo si el usuario es TIENDA
}





