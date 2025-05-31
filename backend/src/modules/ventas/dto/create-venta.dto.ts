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

export class CreateVentaDto {
    @IsString()
    codigoSocio: string;

    @IsString()
    nombreSocio: string;

    @IsBoolean()
    esSocio: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductoVentaDto)
    productos: ProductoVentaDto[];

    @IsNumber()
    @Min(0)
    total: number;

    @IsNumber()
    @Min(0)
    pagado: number;

    @IsEnum(['PENDIENTE', 'PAGADO_PARCIAL', 'PAGADO'])
    @IsOptional()
    estado?: string;

    @IsEnum(MetodoPago)
    @IsOptional()
    metodoPago: MetodoPago;

    @IsString()
    @ValidateIf((o) => o.pagado < o.total)
    @IsOptional()
    observaciones: string;
} 