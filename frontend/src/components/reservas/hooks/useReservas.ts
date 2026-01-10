import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';
import { Reserva } from '../types';
import { authenticatedFetchJson, authenticatedFetch } from '../../../utils/apiHelper';

export const useReservas = () => {
    const queryClient = useQueryClient();
    const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

    // Consulta para obtener reservas
    const { data: reservas = [], isLoading: isLoadingReservas } = useQuery({
        queryKey: ['reservas'],
        queryFn: async () => {
            return await authenticatedFetchJson<Reserva[]>(`${API_BASE_URL}/reservas`);
        },
    });

    // Mutación para crear/actualizar reserva
    const reservaMutation = useMutation({
        mutationFn: async (reservaData: any) => {
            const url = selectedReserva
                ? `${API_BASE_URL}/reservas/${selectedReserva._id}`
                : `${API_BASE_URL}/reservas`;

            return await authenticatedFetchJson<Reserva>(url, {
                method: selectedReserva ? 'PATCH' : 'POST',
                body: JSON.stringify(reservaData)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
        },
    });

    // Mutación para eliminar reserva
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await authenticatedFetchJson(`${API_BASE_URL}/reservas/${id}`, {
                method: 'DELETE'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
        }
    });

    // Mutación para liquidar reserva
    const liquidarMutation = useMutation({
        mutationFn: async ({ id, datosLiquidacion }: { id: string, datosLiquidacion: any }) => {
            return await authenticatedFetchJson<Reserva>(`${API_BASE_URL}/reservas/${id}/liquidar`, {
                method: 'PATCH',
                body: JSON.stringify(datosLiquidacion)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
        }
    });

    // Mutación para cancelar reserva
    const cancelarMutation = useMutation({
        mutationFn: async ({ id, datosCancelacion }: { id: string, datosCancelacion: any }) => {
            return await authenticatedFetchJson<Reserva>(`${API_BASE_URL}/reservas/${id}/cancelar`, {
                method: 'POST',
                body: JSON.stringify(datosCancelacion)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
        }
    });

    return {
        reservas,
        isLoadingReservas,
        selectedReserva,
        setSelectedReserva,
        reservaMutation,
        deleteMutation,
        liquidarMutation,
        cancelarMutation
    };
}; 