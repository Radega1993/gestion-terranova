import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
} from '@mui/material';
import { Reserva, Servicio } from '../types';

interface LiquidacionInfoProps {
    reserva: Reserva;
    servicio: Servicio | undefined;
}

export const LiquidacionInfo: React.FC<LiquidacionInfoProps> = ({
    reserva,
    servicio,
}) => {
    return (
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                Información de la Reserva
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Socio
                    </Typography>
                    <Typography variant="body1">
                        {reserva.socio.nombre.nombre} {reserva.socio.nombre.primerApellido}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Servicio
                    </Typography>
                    <Typography variant="body1">
                        {servicio?.nombre}
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Precio Total
                    </Typography>
                    <Typography variant="body1">
                        {reserva.precio.toFixed(2)}€
                    </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Monto Pendiente
                    </Typography>
                    <Typography variant="body1" color="error.main" fontWeight="bold">
                        {(reserva.precio - (reserva.montoAbonado || 0)).toFixed(2)}€
                    </Typography>
                </Grid>
            </Grid>
        </Paper>
    );
}; 