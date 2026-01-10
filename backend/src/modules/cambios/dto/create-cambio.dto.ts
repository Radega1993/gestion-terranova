import { IsString, IsNumber, IsNotEmpty, IsMongoId, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductoCambioDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsOptional()
    categoria?: string;

    @IsNumber()
    @Min(1)
    cantidad: number;

    @IsNumber()
    @Min(0)
    precioUnitario: number;

    @IsNumber()
    @Min(0)
    total: number;
}

export class CreateCambioDto {
    @IsMongoId()
    @IsNotEmpty()
    ventaId: string;

    @ValidateNested()
    @Type(() => ProductoCambioDto)
    @IsNotEmpty()
    productoOriginal: ProductoCambioDto;

    @ValidateNested()
    @Type(() => ProductoCambioDto)
    @IsNotEmpty()
    productoNuevo: ProductoCambioDto;

    @IsString()
    @IsOptional()
    motivo?: string;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsMongoId()
    @IsOptional()
    trabajadorId?: string;  // Solo si el usuario es TIENDA
}

