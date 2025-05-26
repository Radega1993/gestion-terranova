// Interfaces para los objetos anidados
export interface Nombre {
    nombre: string;
    primerApellido: string;
    segundoApellido?: string;
    apellidos?: string;
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
    telefonos?: string[];
    email?: string;
}

export interface Asociado {
    _id?: string;
    codigo: string;
    nombre: string;
    fechaNacimiento: Date;
    telefono?: string;
    foto?: string;
    parentesco: string;
    socio?: string;
}

// Interfaz principal para el Socio
export interface Socio {
    _id?: string;
    nombre: {
        nombre: string;
        primerApellido: string;
        segundoApellido?: string;
    };
    socio: string;
    fechaNacimiento: Date;
    direccion: {
        calle: string;
        numero: string;
        piso?: string;
        poblacion: string;
        cp: string;
        provincia: string;
    };
    contacto?: {
        telefonos: string[];
        email: string[];
    };
    banco?: {
        iban: string;
        entidad: string;
        oficina: string;
        dc: string;
        cuenta: string;
    };
    foto?: string;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    asociados?: Asociado[];
}

export interface SocioWithId extends Omit<Socio, 'createdAt'> {
    _id: string;
    createdAt: string;
    active: boolean;
}

// Interfaz para crear un socio (algunos campos son opcionales)
export interface CreateSocioInput extends Omit<Socio, '_id' | 'createdAt' | 'updatedAt'> {
    active: boolean;
} 