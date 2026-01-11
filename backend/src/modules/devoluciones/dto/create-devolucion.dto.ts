import { IsString, IsNotEmpty, IsArray, IsNumber, IsEnum, IsOptional, IsMongoId, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MetodoDevolucion } from '../schemas/devolucion.schema';

class ProductoDevolucionDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsOptional()
    categoria?: string;

    @IsNumber()
    @Min(0.01)
    cantidad: number;

    @IsNumber()
    @Min(0)
    precioUnitario: number;

    @IsNumber()
    @Min(0)
    total: number;
}

export class CreateDevolucionDto {
    @IsMongoId()
    @IsNotEmpty()
    venta: string;

    @IsMongoId()
    @IsOptional()
    trabajador?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductoDevolucionDto)
    productos: ProductoDevolucionDto[];

    @IsNumber()
    @Min(0)
    totalDevolucion: number;

    @IsEnum(MetodoDevolucion)
    @IsNotEmpty()
    metodoDevolucion: MetodoDevolucion;

    @IsString()
    @IsNotEmpty()
    motivo: string;

    @IsString()
    @IsOptional()
    observaciones?: string;
}








