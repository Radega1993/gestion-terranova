import { IsString, IsNumber, IsNotEmpty, Min, IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class CreateProductoRetiradoDto {
    @IsMongoId()
    @IsNotEmpty()
    productoId: string;

    @IsNumber()
    @Min(1)
    cantidad: number;

    @IsString()
    @IsNotEmpty()
    motivo: string;

    @IsDateString()
    @IsOptional()
    fechaRetiro?: string;

    @IsString()
    @IsOptional()
    observaciones?: string;
}

