import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography,
    TextField,
    Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useReservas } from './hooks/useReservas';
import { useServicios } from './hooks/useServicios';
import { useSuplementos } from './hooks/useSuplementos';
import { Reserva } from './types';
import { LiquidacionInfo } from './liquidacion/LiquidacionInfo';
import { LiquidacionPayment } from './liquidacion/LiquidacionPayment';
import { LiquidacionSuplementos } from './liquidacion/LiquidacionSuplementos';
import { Servicio } from './types';

interface LiquidacionDialogProps {
    open: boolean;
    onClose: () => void;
    reserva: Reserva | null;
}

export const LiquidacionDialog: React.FC<LiquidacionDialogProps> = ({
    open,
    onClose,
    reserva
}) => {
    if (!reserva) return null;

    const { liquidarMutation } = useReservas();
    const { servicios } = useServicios();
    const { suplementos: suplementosList } = useSuplementos();

    const [liquidacionData, setLiquidacionData] = useState({
        suplementos: reserva.suplementos,
        montoAbonado: 0,
        metodoPago: '' as 'efectivo' | 'tarjeta' | '',
        observaciones: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const precioTotal = reserva.precio;
            const montoPendiente = precioTotal - (reserva.montoAbonado || 0);

            if (liquidacionData.montoAbonado !== montoPendiente) {
                alert(`Debe abonar el monto total pendiente (${montoPendiente.toFixed(2)}€)`);
                return;
            }

            if (!liquidacionData.metodoPago) {
                alert('Debe seleccionar un método de pago');
                return;
            }

            const datosLiquidacion = {
                id: reserva._id,
                datosLiquidacion: {
                    suplementos: liquidacionData.suplementos,
                    pagos: [
                        {
                            monto: reserva.montoAbonado || 0,
                            metodoPago: reserva.metodoPago || '',
                            fecha: reserva.fecha
                        },
                        {
                            monto: liquidacionData.montoAbonado,
                            metodoPago: liquidacionData.metodoPago,
                            fecha: new Date().toISOString()
                        }
                    ],
                    observaciones: liquidacionData.observaciones,
                    estado: 'COMPLETADA'
                }
            };

            liquidarMutation.mutate(datosLiquidacion);
            onClose();
        } catch (error) {
            console.error('Error preparing liquidacion data:', error);
            alert('Error al preparar los datos de liquidación');
        }
    };

    const handleSuplementoChange = (suplementoId: string, checked: boolean) => {
        setLiquidacionData(prev => {
            const newSuplementos = [...prev.suplementos];
            if (checked) {
                newSuplementos.push({ id: suplementoId, cantidad: 1 });
            } else {
                const index = newSuplementos.findIndex(s => s.id === suplementoId);
                if (index !== -1) {
                    newSuplementos.splice(index, 1);
                }
            }
            return { ...prev, suplementos: newSuplementos };
        });
    };

    const handleCantidadChange = (suplementoId: string, cantidad: number) => {
        setLiquidacionData(prev => ({
            ...prev,
            suplementos: prev.suplementos.map(s =>
                s.id === suplementoId ? { ...s, cantidad } : s
            )
        }));
    };

    const servicio = servicios.find((s: Servicio) => s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase());

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
                bgcolor: 'primary.main',
                color: 'white'
            }}>
                <Typography variant="h5" component="div">
                    Liquidar Reserva
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
                    <LiquidacionInfo
                        reserva={reserva}
                        servicio={servicio}
                    />

                    <LiquidacionPayment
                        reserva={reserva}
                        montoAbonado={liquidacionData.montoAbonado}
                        metodoPago={liquidacionData.metodoPago}
                        onMontoAbonadoChange={(monto) => setLiquidacionData(prev => ({ ...prev, montoAbonado: monto }))}
                        onMetodoPagoChange={(metodo) => setLiquidacionData(prev => ({ ...prev, metodoPago: metodo }))}
                    />

                    <LiquidacionSuplementos
                        suplementosList={suplementosList}
                        selectedSuplementos={liquidacionData.suplementos}
                        onSuplementoChange={handleSuplementoChange}
                        onCantidadChange={handleCantidadChange}
                    />

                    <Box sx={{ mt: 3 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Observaciones"
                            value={liquidacionData.observaciones}
                            onChange={(e) => setLiquidacionData(prev => ({ ...prev, observaciones: e.target.value }))}
                            sx={{
                                '& .MuiInputBase-input': {
                                    fontSize: '1.1rem',
                                    padding: '12px 14px'
                                },
                                '& .MuiInputLabel-root': {
                                    fontSize: '1.1rem'
                                }
                            }}
                        />
                    </Box>

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
                            sx={{
                                fontSize: '1.1rem',
                                px: 3,
                                py: 1
                            }}
                        >
                            Liquidar Reserva
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}; 