import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class UpdateInvitacionesDto {
    @IsNumber()
    @Min(0)
    invitacionesDisponibles: number;

    @IsString()
    @IsOptional()
    observaciones?: string;
} 