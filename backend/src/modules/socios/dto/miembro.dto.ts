import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateMiembroDto {
    @IsString()
    nombre: string;

    @IsDateString()
    fechaNacimiento: string;

    @IsString()
    @IsOptional()
    telefono?: string;

    @IsString()
    @IsOptional()
    foto?: string;
}

export class UpdateMiembroDto extends CreateMiembroDto { } 