export enum UserRole {
    ADMINISTRADOR = 'ADMINISTRADOR',
    JUNTA = 'JUNTA',
    TRABAJADOR = 'TRABAJADOR',
    TIENDA = 'TIENDA'
}

export interface User {
    _id: string;
    username: string;
    role: UserRole;
    nombre: string;
    apellidos: string;
    activo: boolean;
    lastLogin?: Date;
}

export interface CreateUserDto {
    username: string;
    password: string;
    role: UserRole;
    nombre: string;
    apellidos: string;
}

export interface UpdateUserDto {
    username?: string;
    password?: string;
    role?: UserRole;
    nombre?: string;
    apellidos?: string;
    isActive?: boolean;
} 