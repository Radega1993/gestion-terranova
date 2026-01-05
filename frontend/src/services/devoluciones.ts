import { api } from './api';

export interface ProductoDevolucion {
    nombre: string;
    categoria?: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
}

export interface Devolucion {
    _id: string;
    venta: string | {
        _id: string;
        codigoSocio: string;
        nombreSocio: string;
        total: number;
        productos?: Array<{
            nombre: string;
            categoria?: string;
            unidades: number;
            precioUnitario: number;
            precioTotal: number;
        }>;
    };
    usuario: string | {
        _id: string;
        username: string;
        nombre: string;
    };
    trabajador?: string | {
        _id: string;
        nombre: string;
        identificador: string;
    };
    productos: ProductoDevolucion[];
    totalDevolucion: number;
    metodoDevolucion: 'EFECTIVO' | 'TARJETA';
    motivo: string;
    observaciones?: string;
    estado: 'PENDIENTE' | 'PROCESADA' | 'CANCELADA';
    fechaProcesamiento?: Date;
    procesadoPor?: string | {
        _id: string;
        username: string;
        nombre: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateDevolucionDto {
    venta: string;
    trabajador?: string;
    productos: ProductoDevolucion[];
    totalDevolucion: number;
    metodoDevolucion: 'EFECTIVO' | 'TARJETA';
    motivo: string;
    observaciones?: string;
}

export interface DevolucionesFilters {
    fechaInicio?: string;
    fechaFin?: string;
    ventaId?: string;
    usuarioId?: string;
}

export const devolucionesService = {
    getAll: async (filters?: DevolucionesFilters): Promise<Devolucion[]> => {
        const params = new URLSearchParams();
        if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
        if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);
        if (filters?.ventaId) params.append('ventaId', filters.ventaId);
        if (filters?.usuarioId) params.append('usuarioId', filters.usuarioId);
        
        const queryString = params.toString();
        const url = queryString ? `/devoluciones?${queryString}` : '/devoluciones';
        const response = await api.get(url);
        return response.data;
    },
    
    getById: async (id: string): Promise<Devolucion> => {
        const response = await api.get(`/devoluciones/${id}`);
        return response.data;
    },
    
    create: async (data: CreateDevolucionDto): Promise<Devolucion> => {
        const response = await api.post('/devoluciones', data);
        return response.data;
    },
    
    update: async (id: string, data: Partial<CreateDevolucionDto>): Promise<Devolucion> => {
        const response = await api.put(`/devoluciones/${id}`, data);
        return response.data;
    },
    
    procesar: async (id: string): Promise<Devolucion> => {
        const response = await api.post(`/devoluciones/${id}/procesar`);
        return response.data;
    },
    
    cancelar: async (id: string): Promise<Devolucion> => {
        const response = await api.post(`/devoluciones/${id}/cancelar`);
        return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
        await api.delete(`/devoluciones/${id}`);
    }
};




