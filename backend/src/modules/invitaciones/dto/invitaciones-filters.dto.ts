import { IsOptional, IsString, IsDateString } from 'class-validator';

export class InvitacionesFiltersDto {
    @IsOptional()
    @IsDateString()
    fechaInicio?: string;

    @IsOptional()
    @IsDateString()
    fechaFin?: string;

    @IsOptional()
    @IsString()
    codigoSocio?: string;

    @IsOptional()
    @IsString()
    ejercicio?: string;
} 