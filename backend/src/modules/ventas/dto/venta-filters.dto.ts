import { IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class VentaFiltersDto {
    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;

    @IsOptional()
    @IsString()
    codigoCliente?: string;

    @IsOptional()
    @IsString()
    estado?: string;
} 