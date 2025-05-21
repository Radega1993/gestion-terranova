// Interfaces para los objetos anidados
export interface Nombre {
    nombre: string;
    primerApellido: string;
    segundoApellido?: string;
}

export interface Direccion {
    calle: string;
    numero: string;
    piso: string;
    poblacion: string;
    cp: string;
    provincia: string;
}

export interface Banco {
    iban?: string;
    entidad?: string;
    oficina?: string;
    dc?: string;
    cuenta?: string;
}

export interface Contacto {
    telefonos?: string[];
    emails?: string[];
}

export interface Asociado {
    nombre: string;
    fechaNacimiento?: string;
    codigoSocio?: string;
    fotografia?: string;
}

// Interfaz principal para el Socio
export interface Socio {
    _id: string;
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    direccion: string;
    fechaAlta: string;
    isActive: boolean;
}

// Interfaz para crear un socio (algunos campos son opcionales)
export interface CreateSocioInput {
    socio?: string;
    rgpd: boolean;
    casa: number;
    totalSocios?: number;
    numPersonas?: number;
    adheridos?: number;
    menor3Años?: number;
    cuota: number;
    dni?: string;
    nombre: Nombre;
    direccion: Direccion;
    banco?: Banco;
    contacto?: Contacto;
    asociados?: Asociado[];
    especiales?: Asociado[];
    notas?: string;
    fotografia?: string;
} 