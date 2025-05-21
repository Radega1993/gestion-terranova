export enum ProductType {
    BEBIDA = 'BEBIDA',
    COMIDA = 'COMIDA',
    SNACK = 'SNACK',
    OTRO = 'OTRO'
}

export interface Product {
    _id: string;
    nombre: string;
    tipo: ProductType;
    unidad_medida: string;
    stock_actual: number;
    precio_compra_unitario: number;
    activo: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProductDto {
    nombre: string;
    tipo: ProductType;
    unidad_medida: string;
    stock_actual: number;
    precio_compra_unitario: number;
}

export interface UpdateProductDto {
    nombre?: string;
    tipo?: ProductType;
    unidad_medida?: string;
    stock_actual?: number;
    precio_compra_unitario?: number;
} 