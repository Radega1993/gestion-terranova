import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';
import { ProductType } from './create-product.dto';

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsEnum(ProductType)
    tipo?: ProductType;

    @IsOptional()
    @IsString()
    unidad_medida?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    stock_actual?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    precio_compra_unitario?: number;

    @IsOptional()
    @IsBoolean()
    activo?: boolean;
} 