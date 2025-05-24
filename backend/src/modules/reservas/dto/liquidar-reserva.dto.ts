import { IsString, IsNumber, IsOptional } from 'class-validator';

export class LiquidarReservaDto {
    @IsString()
    metodoPago: string;

    @IsNumber()
    monto: number;

    @IsString()
    @IsOptional()
    observaciones?: string;
} 