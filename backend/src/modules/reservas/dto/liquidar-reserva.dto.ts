import { IsArray, IsNumber, IsOptional, IsString, IsIn, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class SuplementoLiquidacionDto {
    @IsString()
    id: string;

    @IsNumber()
    @IsOptional()
    cantidad?: number;
}

class PagoDto {
    @IsNumber()
    monto: number;

    @IsString()
    @IsIn(['efectivo', 'tarjeta'])
    metodoPago: 'efectivo' | 'tarjeta';

    @IsDateString()
    fecha: string;
}

export class LiquidarReservaDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SuplementoLiquidacionDto)
    suplementos: SuplementoLiquidacionDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PagoDto)
    pagos: PagoDto[];

    @IsString()
    @IsOptional()
    observaciones?: string;
} 