import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reserva } from '../types';
import { Servicio } from '../types';

interface CancelacionSummaryProps {
    reserva: Reserva;
    servicio: Servicio | undefined;
    motivo: 'CLIMA' | 'ANTICIPADA' | 'OTRO';
    montoDevuelto: number;
}

export const CancelacionSummary: React.FC<CancelacionSummaryProps> = ({
    reserva,
    servicio,
    motivo,
    montoDevuelto
}) => {
    const getMotivoText = (motivo: 'CLIMA' | 'ANTICIPADA' | 'OTRO') => {
        switch (motivo) {
            case 'CLIMA':
                return 'Por condiciones climáticas';
            case 'ANTICIPADA':
                return 'Cancelación anticipada';
            case 'OTRO':
                return 'Otro motivo';
            default:
                return '';
        }
    };

    return (
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                Resumen de la Cancelación
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Socio
                        </Typography>
                        <Typography variant="body1">
                            {reserva.socio.nombre.nombre} {reserva.socio.nombre.primerApellido} {reserva.socio.nombre.segundoApellido || ''}
                        </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Servicio
                        </Typography>
                        <Typography variant="body1">
                            {servicio?.nombre}
                        </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Fecha de la Reserva
                        </Typography>
                        <Typography variant="body1">
                            {format(parseISO(reserva.fecha), 'PPP', { locale: es })}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Motivo de Cancelación
                        </Typography>
                        <Chip
                            label={getMotivoText(motivo)}
                            color={
                                motivo === 'CLIMA' ? 'warning' :
                                    motivo === 'ANTICIPADA' ? 'error' :
                                        'default'
                            }
                        />
                    </Box>
                    {reserva.montoAbonado && (
                        <>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Monto Abonado
                                </Typography>
                                <Typography variant="body1">
                                    {reserva.montoAbonado.toFixed(2)}€
                                </Typography>
                            </Box>
                            {montoDevuelto > 0 && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Monto a Devolver
                                    </Typography>
                                    <Typography variant="body1" color="success.main" fontWeight="bold">
                                        {montoDevuelto.toFixed(2)}€
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                </Grid>
            </Grid>
        </Paper>
    );
}; 