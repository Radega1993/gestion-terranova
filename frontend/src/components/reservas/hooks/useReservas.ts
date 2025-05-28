import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';
import { Reserva } from '../types';

export const useReservas = () => {
    const queryClient = useQueryClient();
    const { token } = useAuthStore();
    const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);

    // Consulta para obtener reservas
    const { data: reservas = [], isLoading: isLoadingReservas } = useQuery({
        queryKey: ['reservas'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/reservas`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Error al obtener reservas');
            return await response.json();
        },
    });

    // Mutación para crear/actualizar reserva
    const reservaMutation = useMutation({
        mutationFn: async (reservaData: any) => {
            const url = selectedReserva
                ? `${API_BASE_URL}/reservas/${selectedReserva._id}`
                : `${API_BASE_URL}/reservas`;

            const response = await fetch(url, {
                method: selectedReserva ? 'PATCH' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservaData)
            });

            if (!response.ok) throw new Error('Error al guardar la reserva');
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
        },
    });

    // Mutación para eliminar reserva
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/reservas/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            if (!response.ok) throw new Error('Error al eliminar la reserva');
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
        }
    });

    // Mutación para liquidar reserva
    const liquidarMutation = useMutation({
        mutationFn: async ({ id, datosLiquidacion }: { id: string, datosLiquidacion: any }) => {
            const response = await fetch(`${API_BASE_URL}/reservas/${id}/liquidar`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosLiquidacion)
            });
            if (!response.ok) throw new Error('Error al liquidar la reserva');
            return await response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reservas'] });
        }
    });

    // Mutación para cancelar reserva
    const cancelarMutation = useMutation({
        mutationFn: async ({ id, datosCancelacion }: { id: string, datosCancelacion: any }) => {
            const response = await fetch(`${API_BASE_URL}/reservas/${id}/cancelar`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosCancelacion)
            });
            if (!response.ok) throw new Error('Error al cancelar la reserva');
            return await response.json();
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