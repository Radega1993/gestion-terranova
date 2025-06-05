import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';
import { Suplemento } from '../types';

export const useSuplementos = () => {
    const queryClient = useQueryClient();
    const { token } = useAuthStore();

    // Consulta para obtener suplementos
    const { data: suplementos = [], isLoading: isLoadingSuplementos } = useQuery({
        queryKey: ['suplementos'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/servicios/suplementos`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Error al obtener suplementos');
            return await response.json();
        },
    });

    // Mutación para guardar suplementos
    const saveSuplementosMutation = useMutation({
        mutationFn: async (suplementos: Suplemento[]) => {
            const results = await Promise.all(
                suplementos.map(async (suplemento) => {
                    try {
                        // Asegurarnos de que el suplemento tenga un id válido
                        if (!suplemento.id) {
                            suplemento.id = `suplemento-${suplemento.nombre.toLowerCase().replace(/\s+/g, '-')}`;
                        }

                        const suplementoData = {
                            id: suplemento.id,
                            nombre: suplemento.nombre,
                            precio: suplemento.precio,
                            tipo: suplemento.tipo,
                            activo: suplemento.activo
                        };

                        if (suplemento._id) {
                            // Si tiene ID, actualizar
                            const response = await fetch(`${API_BASE_URL}/servicios/suplementos/${suplemento._id}`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(suplementoData)
                            });
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.message || 'Error al actualizar suplemento');
                            }
                            return await response.json();
                        } else {
                            // Si no tiene ID, crear nuevo
                            const response = await fetch(`${API_BASE_URL}/servicios/suplementos`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(suplementoData)
                            });
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.message || 'Error al crear suplemento');
                            }
                            return await response.json();
                        }
                    } catch (error) {
                        console.error('Error en operación de suplemento:', error);
                        throw error;
                    }
                })
            );
            return results;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suplementos'] });
        }
    });

    // Mutación para eliminar suplemento
    const deleteSuplementoMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/servicios/suplementos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) throw new Error('Error al eliminar el suplemento');
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suplementos'] });
        }
    });

    return {
        suplementos,
        isLoadingSuplementos,
        saveSuplementosMutation,
        deleteSuplementoMutation
    };
}; 