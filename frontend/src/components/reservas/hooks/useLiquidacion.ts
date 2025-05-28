import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';
import { Reserva } from '../types';

export const useLiquidacion = () => {
    const { token } = useAuthStore();
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    // Mutación para generar PDF de liquidación
    const generarPdfMutation = useMutation({
        mutationFn: async (reserva: Reserva) => {
            const response = await fetch(`${API_BASE_URL}/reservas/${reserva._id}/liquidacion-pdf`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Error al generar PDF de liquidación');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            return url;
        }
    });

    // Función para limpiar el PDF
    const limpiarPdf = () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
    };

    return {
        pdfUrl,
        generarPdfMutation,
        limpiarPdf
    };
}; 