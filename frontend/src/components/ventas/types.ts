export interface Producto {
    _id: string;
    nombre: string;
    tipo: string;
    unidad_medida: string;
    stock_actual: number;
    precio_compra_unitario: number;
    activo: boolean;
}

export interface ProductoSeleccionado extends Producto {
    unidades: number;
    precioUnitario: number;
    precioTotal: number;
}

export interface Cliente {
    _id: string;
    codigo: string;
    nombreCompleto: string;
    tipo: 'Socio' | 'Asociado';
}

export interface Venta {
    _id: string;
    codigoSocio: string;
    nombreSocio: string;
    esSocio: boolean;
    productos: {
        nombre: string;
        tipo: string;
        unidades: number;
        precioUnitario: number;
        precioTotal: number;
    }[];
    total: number;
    pagado: number;
    metodoPago: 'EFECTIVO' | 'TARJETA';
    observaciones?: string;
    estado: 'PENDIENTE' | 'PAGADO' | 'PAGADO_PARCIAL';
    usuario: string;
    createdAt: string;
    updatedAt: string;
} 