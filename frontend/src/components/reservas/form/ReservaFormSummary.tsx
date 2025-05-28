import React from 'react';
import {
    Box,
    Typography,
} from '@mui/material';
import { Servicio, Suplemento } from '../types';

interface ReservaFormSummaryProps {
    servicio: Servicio | undefined;
    suplementos: { id: string; cantidad?: number }[];
    suplementosList: Suplemento[];
    precioTotal: number;
}

export const ReservaFormSummary: React.FC<ReservaFormSummaryProps> = ({
    servicio,
    suplementos,
    suplementosList,
    precioTotal,
}) => {
    const suplementosPrecios = new Map();

    // Calcular precios de suplementos sin duplicados
    suplementos.forEach(sup => {
        const suplemento = suplementosList.find(s => s.id === sup.id);
        if (suplemento) {
            const cantidad = sup.cantidad || 1;
            const precio = suplemento.tipo === 'fijo' ? suplemento.precio : suplemento.precio * cantidad;
            suplementosPrecios.set(sup.id, {
                nombre: suplemento.nombre,
                precio: precio,
                cantidad: cantidad,
                tipo: suplemento.tipo
            });
        }
    });

    return (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Resumen del Precio</Typography>
            {servicio && (
                <Typography sx={{ mb: 1 }}>
                    Servicio: {servicio.precio}€
                </Typography>
            )}
            {Array.from(suplementosPrecios.values()).map(({ nombre, precio, cantidad, tipo }, index) => (
                <Typography key={index} sx={{ mb: 1 }}>
                    {nombre}{tipo === 'porHora' && cantidad > 1 ? ` (${cantidad})` : ''}: {precio}€
                </Typography>
            ))}
            <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
                Total: {precioTotal}€
            </Typography>
        </Box>
    );
}; 