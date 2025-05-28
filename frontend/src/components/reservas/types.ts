export interface Servicio {
    _id: string;
    id: string;
    nombre: string;
    precio: number;
    color: string;
    colorConObservaciones: string;
    activo: boolean;
}

export interface Suplemento {
    _id: string;
    id: string;
    nombre: string;
    precio: number;
    tipo: 'fijo' | 'porHora';
    activo: boolean;
}

export interface Socio {
    _id: string;
    socio: string;
    nombre: {
        nombre: string;
        primerApellido: string;
        segundoApellido?: string;
    };
    contacto: {
        telefonos: string[];
        emails: string[];
    };
    active: boolean;
}

export interface Reserva {
    _id: string;
    fecha: string;
    tipoInstalacion: string;
    socio: {
        _id: string;
        nombre: {
            nombre: string;
            primerApellido: string;
            segundoApellido?: string;
        };
    };
    usuarioCreacion: {
        _id: string;
        username: string;
    };
    suplementos: {
        id: string;
        cantidad?: number;
        precio?: number;
    }[];
    precio: number;
    estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'LISTA_ESPERA';
    confirmadoPor?: {
        _id: string;
        username: string;
    };
    fechaConfirmacion?: string;
    motivoCancelacion?: string;
    observaciones?: string;
    montoAbonado?: number;
    metodoPago?: 'efectivo' | 'tarjeta' | '';
}

export interface FormData {
    fecha: string;
    servicio: string;
    socio: string;
    suplementos: { id: string; cantidad?: number }[];
    observaciones: string;
    montoAbonado: number;
    metodoPago: 'efectivo' | 'tarjeta' | '';
}

export interface LiquidacionData {
    suplementos: { id: string; cantidad?: number }[];
    montoAbonado: number;
    metodoPago: 'efectivo' | 'tarjeta' | '';
    observaciones: string;
}

export interface CancelacionData {
    motivo: 'CLIMA' | 'ANTICIPADA' | 'OTRO';
    observaciones?: string;
    montoDevuelto?: number;
    pendienteRevisionJunta?: boolean;
}

export interface SnackbarState {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
} 