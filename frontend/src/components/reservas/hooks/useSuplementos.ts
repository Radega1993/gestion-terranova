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
            const response = await fetch(`${API_BASE_URL}/servicios/suplementos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(suplementos)
            });
            if (!response.ok) throw new Error('Error al guardar suplementos');
            return await response.json();
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