import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography,
    Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useReservas } from './hooks/useReservas';
import { useServicios } from './hooks/useServicios';
import { Reserva } from './types';
import { CancelacionForm } from './cancelacion/CancelacionForm';
import { CancelacionSummary } from './cancelacion/CancelacionSummary';
import Swal from 'sweetalert2';
import { isSameDay } from 'date-fns';

interface CancelacionDialogProps {
    open: boolean;
    onClose: () => void;
    reserva: Reserva | null;
}

export const CancelacionDialog: React.FC<CancelacionDialogProps> = ({
    open,
    onClose,
    reserva
}) => {
    if (!reserva) return null;

    const { cancelarMutation } = useReservas();
    const { servicios } = useServicios();

    const [cancelacionData, setCancelacionData] = useState({
        motivo: 'OTRO' as 'CLIMA' | 'ANTICIPADA' | 'OTRO',
        observaciones: '',
        montoDevuelto: 0,
        pendienteRevisionJunta: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (cancelacionData.motivo === 'CLIMA') {
                const fechaReserva = new Date(reserva.fecha);
                const fechaActual = new Date();
                if (!isSameDay(fechaReserva, fechaActual)) {
                    alert('Solo se puede cancelar por condiciones climáticas el mismo día de la reserva');
                    return;
                }
            } else if (cancelacionData.motivo === 'ANTICIPADA') {
                const fechaReserva = new Date(reserva.fecha);
                const fechaActual = new Date();
                const diasDiferencia = Math.ceil((fechaReserva.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));

                if (diasDiferencia < 9) {
                    if (!cancelacionData.observaciones) {
                        alert('Debe especificar el motivo de la cancelación para que la Junta pueda valorar la devolución');
                        return;
                    }

                    const result = await Swal.fire({
                        title: 'Cancelación con menos de 9 días',
                        text: 'Se puede anular, pero para devolución de dinero se valorará con Junta una vez conocidos los motivos. ¿Quieres seguir adelante?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Sí, continuar',
                        cancelButtonText: 'No, volver'
                    });

                    if (!result.isConfirmed) {
                        return;
                    }

                    setCancelacionData(prev => ({
                        ...prev,
                        montoDevuelto: 0,
                        observaciones: `[PENDIENTE REVISIÓN JUNTA] ${prev.observaciones}`,
                        pendienteRevisionJunta: true
                    }));
                } else {
                    if ((reserva.montoAbonado || 0) > 0) {
                        if (!cancelacionData.montoDevuelto) {
                            alert('Debe especificar el monto a devolver');
                            return;
                        }

                        if (cancelacionData.montoDevuelto > (reserva.montoAbonado || 0)) {
                            alert('El monto a devolver no puede ser mayor al monto abonado');
                            return;
                        }

                        const result = await Swal.fire({
                            title: 'Cancelación con más de 9 días',
                            text: `Se devolverá el dinero de la fianza (${cancelacionData.montoDevuelto}€). ¿Quieres continuar con la cancelación?`,
                            icon: 'info',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Sí, continuar',
                            cancelButtonText: 'No, volver'
                        });

                        if (!result.isConfirmed) {
                            return;
                        }
                    }
                }
            }

            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, cancelar reserva',
                cancelButtonText: 'No, volver'
            });

            if (result.isConfirmed) {
                cancelarMutation.mutate({
                    id: reserva._id,
                    datosCancelacion: cancelacionData
                });
                onClose();
            }
        } catch (error) {
            console.error('Error preparing cancelacion data:', error);
            alert('Error al preparar los datos de cancelación');
        }
    };

    const servicio = servicios.find(s => s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase());

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '60vh',
                    maxHeight: '80vh'
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                pb: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'error.main',
                color: 'white'
            }}>
                <Typography variant="h5" component="div">
                    Cancelar Reserva
                </Typography>
                <IconButton
                    onClick={onClose}
                    size="large"
                    sx={{ color: 'white' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 2, p: 3 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <CancelacionSummary
                        reserva={reserva}
                        servicio={servicio}
                        motivo={cancelacionData.motivo}
                        montoDevuelto={cancelacionData.montoDevuelto}
                    />

                    <CancelacionForm
                        reserva={reserva}
                        motivo={cancelacionData.motivo}
                        observaciones={cancelacionData.observaciones}
                        montoDevuelto={cancelacionData.montoDevuelto}
                        onMotivoChange={(motivo) => setCancelacionData(prev => ({ ...prev, motivo }))}
                        onObservacionesChange={(observaciones) => setCancelacionData(prev => ({ ...prev, observaciones }))}
                        onMontoDevueltoChange={(montoDevuelto) => setCancelacionData(prev => ({ ...prev, montoDevuelto }))}
                    />

                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        mt: 3,
                        pt: 2,
                        borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                    }}>
                        <Button
                            onClick={onClose}
                            variant="outlined"
                            sx={{
                                fontSize: '1.1rem',
                                px: 3,
                                py: 1
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="error"
                            sx={{
                                fontSize: '1.1rem',
                                px: 3,
                                py: 1
                            }}
                        >
                            Confirmar Cancelación
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}; 