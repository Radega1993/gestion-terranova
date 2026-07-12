import { IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class FiltrosStockAdditionsDto {
    @IsOptional()
    @IsMongoId()
    productoId?: string;

    @IsOptional()
    @IsMongoId()
    usuarioRegistroId?: string;

    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;
}
