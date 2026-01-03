import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CreateTrabajadorDto {
    @IsString()
    nombre: string;

    @IsString()
    identificador: string;  // Código único del trabajador

    @IsMongoId()
    tienda: string;  // ID de la tienda a la que pertenece

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}

