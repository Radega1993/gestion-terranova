import { IsString, IsOptional } from 'class-validator';

export class CancelarReservaDto {
    @IsString()
    motivo: string;

    @IsString()
    @IsOptional()
    observaciones?: string;
} 