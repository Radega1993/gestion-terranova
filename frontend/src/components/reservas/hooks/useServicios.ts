import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';
import { Servicio } from '../types';

export const useServicios = () => {
    const queryClient = useQueryClient();
    const { token } = useAuthStore();

    // Consulta para obtener servicios
    const { data: servicios = [], isLoading: isLoadingServicios } = useQuery({
        queryKey: ['servicios'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/servicios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Error al obtener servicios');
            return await response.json();
        },
    });

    // Mutación para guardar servicios
    const saveServiciosMutation = useMutation({
        mutationFn: async (servicios: Servicio[]) => {
            const results = await Promise.all(
                servicios.map(async (servicio) => {
                    if (servicio._id) {
                        // Si tiene ID, actualizar
                        const response = await fetch(`${API_BASE_URL}/servicios/${servicio._id}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(servicio)
                        });
                        if (!response.ok) throw new Error('Error al actualizar servicio');
                        return await response.json();
                    } else {
                        // Si no tiene ID, crear nuevo
                        const response = await fetch(`${API_BASE_URL}/servicios`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(servicio)
                        });
                        if (!response.ok) throw new Error('Error al crear servicio');
                        return await response.json();
                    }
                })
            );
            return results;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['servicios'] });
        }
    });

    // Mutación para eliminar servicio
    const deleteServicioMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) throw new Error('Error al eliminar el servicio');
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['servicios'] });
        }
    });

    return {
        servicios,
        isLoadingServicios,
        saveServiciosMutation,
        deleteServicioMutation
    };
}; 