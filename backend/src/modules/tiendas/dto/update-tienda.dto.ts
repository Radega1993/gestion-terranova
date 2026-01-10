import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class UpdateTiendaDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    codigo?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsBoolean()
    @IsOptional()
    activa?: boolean;

    @IsMongoId()
    @IsOptional()
    usuarioAsignado?: string;
}







