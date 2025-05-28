import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';
import { Socio } from '../types';

export const useSocios = () => {
    const { token } = useAuthStore();

    // Consulta para obtener socios
    const { data: socios = [], isLoading: isLoadingSocios } = useQuery({
        queryKey: ['socios'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/socios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Error al obtener socios');
            return await response.json();
        },
    });

    // Función para buscar socios por nombre o número
    const buscarSocio = (termino: string): Socio[] => {
        if (!termino) return [];
        const terminoLower = termino.toLowerCase();
        return socios.filter(socio =>
            socio.nombre.toLowerCase().includes(terminoLower) ||
            socio.numero.toString().includes(termino)
        );
    };

    return {
        socios,
        isLoadingSocios,
        buscarSocio
    };
}; 