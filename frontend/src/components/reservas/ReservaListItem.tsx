import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    IconButton,
    Grid,
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Print as PrintIcon
} from '@mui/icons-material';
import { Reserva } from './types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReservaListItemProps {
    reserva: Reserva;
    onEdit: (reserva: Reserva) => void;
    onDelete: (reserva: Reserva) => void;
    onPrint: (reserva: Reserva) => void;
}

const getEstadoColor = (estado: string) => {
    switch (estado) {
        case 'PENDIENTE':
            return 'warning';
        case 'CONFIRMADA':
            return 'success';
        case 'CANCELADA':
            return 'error';
        case 'COMPLETADA':
            return 'info';
        case 'LISTA_ESPERA':
            return 'secondary';
        default:
            return 'default';
    }
};

export const ReservaListItem: React.FC<ReservaListItemProps> = ({
    reserva,
    onEdit,
    onDelete,
    onPrint
}) => {
    const socioNombre = `${reserva.socio.nombre.nombre} ${reserva.socio.nombre.primerApellido} ${reserva.socio.nombre.segundoApellido || ''}`.trim();
    const fecha = new Date(reserva.fecha);
    const horaInicio = format(fecha, 'HH:mm', { locale: es });
    const horaFin = format(new Date(fecha.getTime() + reserva.duracion * 60000), 'HH:mm', { locale: es });

    return (
        <Card sx={{ mb: 2, position: 'relative' }}>
            <CardContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h6" gutterBottom>
                            {socioNombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {format(fecha, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {horaInicio} - {horaFin} ({reserva.duracion} min)
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1 }}>
                            <Chip
                                label={reserva.estado}
                                color={getEstadoColor(reserva.estado)}
                                size="small"
                            />
                            {reserva.confirmacion && (
                                <Chip
                                    label={`Pagado: ${reserva.confirmacion.montoAbonado}€`}
                                    color="success"
                                    size="small"
                                />
                            )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Servicio: {reserva.tipoInstalacion}
                        </Typography>
                        {reserva.suplementos && reserva.suplementos.length > 0 && (
                            <Typography variant="body2" color="text.secondary">
                                Suplementos: {reserva.suplementos.map(s => `${s.nombre} (${s.cantidad})`).join(', ')}
                            </Typography>
                        )}
                    </Grid>
                </Grid>
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                    <Tooltip title="Editar">
                        <IconButton
                            size="small"
                            onClick={() => onEdit(reserva)}
                            sx={{ mr: 1 }}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancelar">
                        <IconButton
                            size="small"
                            onClick={() => onDelete(reserva)}
                            sx={{ mr: 1 }}
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Imprimir">
                        <IconButton
                            size="small"
                            onClick={() => onPrint(reserva)}
                        >
                            <PrintIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </CardContent>
        </Card>
    );
}; 