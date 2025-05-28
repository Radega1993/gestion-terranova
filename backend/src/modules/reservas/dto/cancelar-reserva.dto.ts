import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CancelarReservaDto {
    @IsString()
    motivo: string;

    @IsNumber()
    @IsOptional()
    montoDevuelto?: number;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsBoolean()
    @IsOptional()
    pendienteRevisionJunta?: boolean;
} 