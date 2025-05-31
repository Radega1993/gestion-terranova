import { IsOptional, IsString } from 'class-validator';

export class RecaudacionesFiltrosDto {
    @IsOptional()
    @IsString()
    fechaInicio?: string;

    @IsOptional()
    @IsString()
    fechaFin?: string;

    @IsOptional()
    @IsString()
    codigoSocio?: string;

    @IsOptional()
    @IsString()
    usuario?: string;
} 