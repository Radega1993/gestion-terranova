import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    IconButton,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Cancel as CancelIcon,
    Print as PrintIcon,
} from '@mui/icons-material';
import { format, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../../stores/authStore';

interface Servicio {
    id: string;
    nombre: string;
    precio: number;
    color: string;
    colorConObservaciones: string;
    activo: boolean;
}

interface Suplemento {
    _id?: string;
    id: string;
    nombre: string;
    precio: number;
    tipo: 'fijo' | 'porHora';
    activo: boolean;
}

interface Socio {
    _id: string;
    socio: string;
    nombre: {
        nombre: string;
        primerApellido: string;
        segundoApellido?: string;
    };
    contacto: {
        telefonos: string[];
        emails: string[];
    };
    active: boolean;
}

interface Reserva {
    _id: string;
    fecha: string;
    tipoInstalacion: string;
    socio: {
        _id: string;
        nombre: {
            nombre: string;
            primerApellido: string;
            segundoApellido?: string;
        };
    };
    usuarioCreacion: {
        _id: string;
        username: string;
    };
    suplementos: {
        id: string;
        cantidad?: number;
        precio?: number;
    }[];
    precio: number;
    estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'LISTA_ESPERA';
    confirmadoPor?: {
        _id: string;
        username: string;
    };
    fechaConfirmacion?: string;
    motivoCancelacion?: string;
    observaciones?: string;
    montoAbonado?: number;
    metodoPago?: 'efectivo' | 'tarjeta' | '';
}

interface ReservaCardProps {
    reserva: Reserva;
    servicios: Servicio[];
    suplementosList: Suplemento[];
    onEdit: (reserva: Reserva) => void;
    onDelete: (id: string) => void;
    onCancel: (reserva: Reserva) => void;
    onPrint: (reserva: Reserva) => void;
    onLiquidar: (reserva: Reserva) => void;
    onPrintLiquidacion: (reserva: Reserva, liquidacionData: any) => void;
}

export const ReservaCard: React.FC<ReservaCardProps> = ({
    reserva,
    servicios,
    suplementosList,
    onEdit,
    onDelete,
    onCancel,
    onPrint,
    onLiquidar,
    onPrintLiquidacion,
}) => {
    const { user } = useAuthStore();

    const getReservaColor = (reserva: Reserva) => {
        if (reserva.estado === 'CANCELADA') {
            return '#9e9e9e';
        }
        if (reserva.estado === 'COMPLETADA' && reserva.montoAbonado === reserva.precio) {
            return '#2e7d32';
        }
        if (reserva.estado === 'LISTA_ESPERA') {
            return '#ff9800';
        }
        if (reserva.observaciones) {
            return '#f57c00';
        }
        switch (reserva.tipoInstalacion.toUpperCase()) {
            case 'SALON':
                return '#1976d2';
            case 'PISCINA':
                return '#2196f3';
            case 'BBQ':
                return '#4caf50';
            default:
                return '#757575';
        }
    };

    return (
        <Card sx={{
            borderLeft: 4,
            borderColor: getReservaColor(reserva)
        }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                        {servicios.find(s => s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase())?.nombre}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {isSameDay(new Date(), parseISO(reserva.fecha)) &&
                            reserva.estado !== 'COMPLETADA' && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => onLiquidar(reserva)}
                                >
                                    Liquidar
                                </Button>
                            )}
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => onEdit(reserva)}
                        >
                            Editar
                        </Button>
                        {(user?.role === 'ADMINISTRADOR' || user?.role === 'JUNTA') && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => onDelete(reserva._id)}
                            >
                                Eliminar
                            </Button>
                        )}
                        {reserva.estado !== 'COMPLETADA' && reserva.estado !== 'CANCELADA' && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={() => onCancel(reserva)}
                            >
                                Cancelar
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={() => onPrint(reserva)}
                        >
                            Imprimir Reserva
                        </Button>
                        {reserva.estado === 'COMPLETADA' && (
                            <Button
                                variant="outlined"
                                color="success"
                                startIcon={<PrintIcon />}
                                onClick={() => onPrintLiquidacion(reserva, {
                                    montoAbonado: reserva.montoAbonado,
                                    metodoPago: reserva.metodoPago,
                                    suplementos: reserva.suplementos,
                                    observaciones: reserva.observaciones
                                })}
                            >
                                Imprimir Liquidación
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
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
                                {servicios.find(s => s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase())?.nombre}
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Fecha y Hora
                            </Typography>
                            <Typography variant="body1">
                                {format(parseISO(reserva.fecha), 'PPP', { locale: es })}
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Estado
                            </Typography>
                            <Chip
                                label={reserva.estado}
                                color={
                                    reserva.estado === 'COMPLETADA' ? 'success' :
                                        reserva.estado === 'CANCELADA' ? 'error' :
                                            reserva.estado === 'LISTA_ESPERA' ? 'warning' :
                                                'primary'
                                }
                                size="small"
                            />
                        </Box>
                    </Box>
                    <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Precio Total
                            </Typography>
                            <Typography variant="body1">
                                {reserva.precio.toFixed(2)}€
                            </Typography>
                        </Box>
                        {reserva.montoAbonado !== undefined && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Monto Abonado
                                </Typography>
                                <Typography variant="body1">
                                    {reserva.montoAbonado.toFixed(2)}€
                                </Typography>
                            </Box>
                        )}
                        {reserva.montoAbonado !== undefined && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Restante a Abonar
                                </Typography>
                                <Typography variant="body1" color="error.main" fontWeight="bold">
                                    {(reserva.precio - (reserva.montoAbonado || 0)).toFixed(2)}€
                                </Typography>
                            </Box>
                        )}
                        {reserva.metodoPago && (
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Método de Pago
                                </Typography>
                                <Typography variant="body1">
                                    {reserva.metodoPago.charAt(0).toUpperCase() + reserva.metodoPago.slice(1)}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    {reserva.suplementos && reserva.suplementos.length > 0 && (
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Suplementos
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {reserva.suplementos.reduce((acc: any[], sup) => {
                                    const existingIndex = acc.findIndex(item => item.id === sup.id);
                                    if (existingIndex === -1) {
                                        acc.push({ ...sup, cantidad: sup.cantidad || 1 });
                                    } else {
                                        acc[existingIndex].cantidad = (acc[existingIndex].cantidad || 1) + (sup.cantidad || 1);
                                    }
                                    return acc;
                                }, []).map((sup, index) => {
                                    const suplemento = suplementosList.find(s => s.id === sup.id);
                                    return suplemento ? (
                                        <Chip
                                            key={index}
                                            label={`${suplemento.nombre}${sup.cantidad > 1 ? ` (${sup.cantidad})` : ''}`}
                                            size="small"
                                        />
                                    ) : null;
                                })}
                            </Box>
                        </Box>
                    )}
                    {reserva.observaciones && (
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                Observaciones
                            </Typography>
                            <Typography variant="body2">
                                {reserva.observaciones}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}; 