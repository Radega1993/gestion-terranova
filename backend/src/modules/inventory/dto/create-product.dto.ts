import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    tipo: string;

    @IsString()
    @IsNotEmpty()
    unidad_medida: string;

    @IsNumber()
    @Min(0)
    stock_actual: number;

    @IsNumber()
    @Min(0)
    precio_compra_unitario: number;
} 