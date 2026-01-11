import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, IsEnum, ValidateNested, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

class ProductoVentaDto {
    @IsString()
    nombre: string;

    @IsString()
    @IsOptional()
    categoria?: string;

    @IsNumber()
    @Min(1)
    unidades: number;

    @IsNumber()
    @Min(0)
    precioUnitario: number;

    @IsNumber()
    @Min(0)
    precioTotal: number;
}

export enum MetodoPago {
    EFECTIVO = 'EFECTIVO',
    TARJETA = 'TARJETA',
    TRANSFERENCIA = 'TRANSFERENCIA'
}

export class UpdateVentaDto {
    @IsString()
    @IsOptional()
    codigoSocio?: string;

    @IsString()
    @IsOptional()
    nombreSocio?: string;

    @IsBoolean()
    @IsOptional()
    esSocio?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductoVentaDto)
    @IsOptional()
    productos?: ProductoVentaDto[];

    @IsNumber()
    @Min(0)
    @IsOptional()
    total?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    pagado?: number;

    @IsEnum(['PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO'])
    @IsOptional()
    estado?: string;

    @IsEnum(MetodoPago)
    @IsOptional()
    metodoPago?: MetodoPago;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsString()
    @IsOptional()
    usuarioId?: string;  // Usuario que realizó la venta

    @IsString()
    @IsOptional()
    trabajadorId?: string;  // Trabajador asignado
}

