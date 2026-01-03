import { api } from './api';

export interface Trabajador {
    _id: string;
    nombre: string;
    identificador: string;
    activo: boolean;
    tienda: string | {
        _id: string;
        nombre: string;
        codigo: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTrabajadorDto {
    nombre: string;
    identificador: string;
    tienda: string;
    activo?: boolean;
}

export const trabajadoresService = {
    getAll: async (): Promise<Trabajador[]> => {
        const response = await api.get('/trabajadores');
        return response.data;
    },
    
    getByTienda: async (tiendaId: string): Promise<Trabajador[]> => {
        const response = await api.get(`/trabajadores/tienda/${tiendaId}`);
        return response.data;
    },
    
    getMisTrabajadores: async (): Promise<Trabajador[]> => {
        const response = await api.get('/trabajadores/mi-tienda');
        return response.data;
    },
    
    getById: async (id: string): Promise<Trabajador> => {
        const response = await api.get(`/trabajadores/${id}`);
        return response.data;
    },
    
    create: async (data: CreateTrabajadorDto): Promise<Trabajador> => {
        const response = await api.post('/trabajadores', data);
        return response.data;
    },
    
    update: async (id: string, data: Partial<CreateTrabajadorDto>): Promise<Trabajador> => {
        const response = await api.put(`/trabajadores/${id}`, data);
        return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
        await api.delete(`/trabajadores/${id}`);
    },
    
    toggleActive: async (id: string): Promise<Trabajador> => {
        const response = await api.put(`/trabajadores/${id}/toggle-active`);
        return response.data;
    }
};

