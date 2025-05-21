export enum UserRole {
    ADMINISTRADOR = 'ADMINISTRADOR',
    JUNTA = 'JUNTA',
    TRABAJADOR = 'TRABAJADOR'
}

export interface User {
    _id: string;
    username: string;
    role: UserRole;
    nombre: string;
    isActive: boolean;
}

export interface CreateUserDto {
    username: string;
    password: string;
    role: UserRole;
    nombre: string;
}

export interface UpdateUserDto {
    username?: string;
    password?: string;
    role?: UserRole;
    nombre?: string;
    isActive?: boolean;
} 