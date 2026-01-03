import { IsString, IsOptional, IsBoolean, IsMongoId, MinLength } from 'class-validator';

export class CreateTiendaDto {
    @IsString()
    nombre: string;

    @IsString()
    codigo: string;  // Código único de la tienda

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsBoolean()
    @IsOptional()
    activa?: boolean;

    @IsMongoId()
    @IsOptional()
    usuarioAsignado?: string;  // ID del usuario TIENDA existente a asignar

    // Opción para crear usuario automáticamente
    @IsBoolean()
    @IsOptional()
    crearUsuario?: boolean;  // Si true, crear usuario automáticamente

    @IsString()
    @IsOptional()
    username?: string;  // Username para el nuevo usuario

    @IsString()
    @IsOptional()
    @MinLength(4)
    password?: string;  // Password para el nuevo usuario

    @IsString()
    @IsOptional()
    nombreUsuario?: string;  // Nombre del usuario TIENDA
}

