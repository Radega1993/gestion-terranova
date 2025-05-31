export interface Producto {
    _id: string;
    nombre: string;
    precio_compra_unitario: number;
    stock_actual: number;
    tipo: string;
    unidad_medida: string;
    activo: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface ProductoSeleccionado extends Producto {
    cantidad: number;
    subtotal: number;
} 