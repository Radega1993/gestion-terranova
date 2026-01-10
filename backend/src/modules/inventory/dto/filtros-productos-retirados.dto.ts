import { IsOptional, IsString, IsDateString, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltrosProductosRetiradosDto {
    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;

    @IsOptional()
    @IsMongoId()
    productoId?: string;

    @IsOptional()
    @IsString()
    motivo?: string;

    @IsOptional()
    @IsMongoId()
    usuarioRegistroId?: string;
}

