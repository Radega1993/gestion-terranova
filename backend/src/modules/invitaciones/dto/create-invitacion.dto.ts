import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateInvitacionDto {
    @IsString()
    codigoSocio: string;

    @IsDateString()
    fechaUso: string;

    @IsString()
    nombreInvitado: string;

    @IsString()
    @IsOptional()
    observaciones?: string;
} 