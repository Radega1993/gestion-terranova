export interface Product {
    _id: string;
    nombre: string;
    tipo: string;
    unidad_medida: string;
    stock_actual: number;
    precio_compra_unitario: number;
    activo: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateProductDto {
    nombre: string;
    tipo: string;
    unidad_medida: string;
    stock_actual: number;
    precio_compra_unitario: number;
}

export interface UpdateProductDto {
    nombre?: string;
    tipo?: string;
    unidad_medida?: string;
    stock_actual?: number;
    precio_compra_unitario?: number;
    activo?: boolean;
}

export interface FormData {
    nombre: string;
    tipo: string;
    unidad_medida: string;
    stock_actual: number;
    precio_compra_unitario: number;
} 