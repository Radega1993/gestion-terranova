import { IsMongoId, IsNumber, Min, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStockAdditionDto {
    @IsMongoId()
    @IsNotEmpty()
    productoId: string;

    @Type(() => Number)
    @IsNumber()
    @Min(1)
    cantidad: number;

    @IsString()
    @IsOptional()
    observaciones?: string;
}
