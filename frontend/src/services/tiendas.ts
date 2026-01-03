import { api } from './api';

export interface Tienda {
    _id: string;
    nombre: string;
    codigo: string;
    descripcion?: string;
    activa: boolean;
    usuarioAsignado?: string | {
        _id: string;
        username: string;
        nombre: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTiendaDto {
    nombre: string;
    codigo: string;
    descripcion?: string;
    activa?: boolean;
    usuarioAsignado?: string;
    // Opción para crear usuario automáticamente
    crearUsuario?: boolean;
    username?: string;
    password?: string;
    nombreUsuario?: string;
}

export const tiendasService = {
    getAll: async (): Promise<Tienda[]> => {
        const response = await api.get('/tiendas');
        return response.data;
    },
    
    getActivas: async (): Promise<Tienda[]> => {
        const response = await api.get('/tiendas/activas');
        return response.data;
    },
    
    getMiTienda: async (): Promise<Tienda> => {
        const response = await api.get('/tiendas/mi-tienda');
        return response.data;
    },
    
    getById: async (id: string): Promise<Tienda> => {
        const response = await api.get(`/tiendas/${id}`);
        return response.data;
    },
    
    create: async (data: CreateTiendaDto): Promise<Tienda> => {
        const response = await api.post('/tiendas', data);
        return response.data;
    },
    
    update: async (id: string, data: Partial<CreateTiendaDto>): Promise<Tienda> => {
        const response = await api.put(`/tiendas/${id}`, data);
        return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
        await api.delete(`/tiendas/${id}`);
    },
    
    toggleActive: async (id: string): Promise<Tienda> => {
        const response = await api.put(`/tiendas/${id}/toggle-active`);
        return response.data;
    }
};

