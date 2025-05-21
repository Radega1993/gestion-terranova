import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export enum MotivoCancelacion {
    CLIMA = 'CLIMA',
    ANTICIPADA = 'ANTICIPADA',
    OTRO = 'OTRO'
}

export class CancelarReservaDto {
    @IsEnum(MotivoCancelacion)
    motivo: MotivoCancelacion;

    @IsString()
    @IsOptional()
    observaciones?: string;

    @IsNumber()
    @IsOptional()
    montoDevuelto?: number;

    @IsBoolean()
    @IsOptional()
    pendienteRevisionJunta?: boolean;
} 