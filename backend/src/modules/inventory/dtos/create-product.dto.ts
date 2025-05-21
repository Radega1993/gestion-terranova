import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export enum ProductType {
    INGREDIENTE = 'ingrediente',
    BEBIDA = 'bebida',
    LIMPIEZA = 'limpieza',
    OTRO = 'otro',
}

export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    nombre: string;

    @IsNotEmpty()
    @IsEnum(ProductType)
    tipo: ProductType;

    @IsNotEmpty()
    @IsString()
    unidad_medida: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    stock_actual: number;

    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    precio_compra_unitario: number;

    @IsOptional()
    @IsBoolean()
    activo: boolean = true;
} 