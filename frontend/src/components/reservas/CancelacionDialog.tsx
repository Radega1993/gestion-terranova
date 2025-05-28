import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    IconButton,
    Grid,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Reserva, CancelacionData } from './types';
import Swal from 'sweetalert2';
import { isSameDay } from 'date-fns';

interface CancelacionDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CancelacionData) => void;
    cancelacionData: CancelacionData;
    setCancelacionData: (data: CancelacionData) => void;
    selectedReservaCancelacion: Reserva | null;
}

export const CancelacionDialog: React.FC<CancelacionDialogProps> = ({
    open,
    onClose,
    onSubmit,
    cancelacionData,
    setCancelacionData,
    selectedReservaCancelacion
}) => {
    const handleSubmit = async () => {
        if (!selectedReservaCancelacion) return;

        try {
            if (cancelacionData.motivo === 'CLIMA') {
                const fechaReserva = new Date(selectedReservaCancelacion.fecha);
                const fechaActual = new Date();
                if (!isSameDay(fechaReserva, fechaActual)) {
                    alert('Solo se puede cancelar por condiciones climáticas el mismo día de la reserva');
                    return;
                }
            } else if (cancelacionData.motivo === 'ANTICIPADA') {
                const fechaReserva = new Date(selectedReservaCancelacion.fecha);
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

                    const newData: CancelacionData = {
                        ...cancelacionData,
                        montoDevuelto: 0,
                        observaciones: `[PENDIENTE REVISIÓN JUNTA] ${cancelacionData.observaciones}`,
                        pendienteRevisionJunta: true
                    };
                    setCancelacionData(newData);
                } else {
                    if ((selectedReservaCancelacion.montoAbonado || 0) > 0) {
                        if (!cancelacionData.montoDevuelto) {
                            alert('Debe especificar el monto a devolver');
                            return;
                        }

                        if (cancelacionData.montoDevuelto > (selectedReservaCancelacion.montoAbonado || 0)) {
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
                onSubmit(cancelacionData);
            }
        } catch (error) {
            console.error('Error preparing cancelacion data:', error);
            alert('Error al preparar los datos de cancelación');
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
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
                {selectedReservaCancelacion && (
                    <Box component="form">
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Información de la Reserva
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1">
                                        Socio: {selectedReservaCancelacion.socio.nombre.nombre} {selectedReservaCancelacion.socio.nombre.primerApellido}
                                    </Typography>
                                    <Typography variant="subtitle1">
                                        Servicio: {selectedReservaCancelacion.tipoInstalacion}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Información de Cancelación
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Motivo de Cancelación</InputLabel>
                                            <Select
                                                value={cancelacionData.motivo}
                                                label="Motivo de Cancelación"
                                                onChange={(e) => setCancelacionData({
                                                    ...cancelacionData,
                                                    motivo: e.target.value as 'CLIMA' | 'ANTICIPADA' | 'OTRO'
                                                })}
                                            >
                                                <MenuItem value="CLIMA">Condiciones Climáticas</MenuItem>
                                                <MenuItem value="ANTICIPADA">Cancelación Anticipada</MenuItem>
                                                <MenuItem value="OTRO">Otro</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    {cancelacionData.motivo === 'ANTICIPADA' && (selectedReservaCancelacion.montoAbonado || 0) > 0 && (
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Monto a Devolver"
                                                value={cancelacionData.montoDevuelto}
                                                onChange={(e) => setCancelacionData({
                                                    ...cancelacionData,
                                                    montoDevuelto: parseFloat(e.target.value) || 0
                                                })}
                                                InputProps={{
                                                    startAdornment: '€'
                                                }}
                                            />
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Observaciones"
                                    value={cancelacionData.observaciones}
                                    onChange={(e) => setCancelacionData({
                                        ...cancelacionData,
                                        observaciones: e.target.value
                                    })}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <Button onClick={onClose} color="inherit">
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="error"
                >
                    Confirmar Cancelación
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 