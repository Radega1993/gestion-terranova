// Interfaces para los objetos anidados
export interface Nombre {
    nombre: string;
    primerApellido: string;
    segundoApellido?: string;
}

export interface Direccion {
    calle: string;
    numero: string;
    piso?: string;
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
    telefonos: string[];
    emails: string[];
}

export interface Asociado {
    nombre: string;
    fechaNacimiento?: string;
    foto?: string;
    fotografia?: string;
}

// Interfaz principal para el Socio
export interface Socio {
    _id?: string;
    socio: string; // Identificador único AET000
    nombre: Nombre;
    direccion: Direccion;
    banco?: Banco;
    contacto: Contacto;
    casa: number;
    totalSocios: number;
    numPersonas: number;
    adheridos: number;
    menor3Años: number;
    cuota: number;
    rgpd: boolean;
    dni?: string;
    notas?: string;
    fotografia?: string;
    foto?: string;
    asociados: Asociado[];
    especiales: Asociado[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    fechaBaja?: Date;
    motivoBaja?: string;
    observaciones?: string;
}

// Interfaz para crear un socio (algunos campos son opcionales)
export interface CreateSocioInput extends Omit<Socio, '_id' | 'createdAt' | 'updatedAt'> { } 