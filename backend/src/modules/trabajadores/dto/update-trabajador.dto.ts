import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTrabajadorDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    identificador?: string;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}




