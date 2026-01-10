import { IsOptional, IsDateString, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class FiltrosCambiosDto {
    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;

    @IsOptional()
    @IsMongoId()
    ventaId?: string;

    @IsOptional()
    @IsMongoId()
    usuarioId?: string;
}

