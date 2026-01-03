import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Reserva } from '../types';

interface LiquidacionPaymentProps {
    reserva: Reserva;
    montoAbonado: number;
    metodoPago: 'efectivo' | 'tarjeta' | '';
    fianza: number;
    onMontoAbonadoChange: (monto: number) => void;
    onMetodoPagoChange: (metodo: 'efectivo' | 'tarjeta' | '') => void;
    onFianzaChange: (fianza: number) => void;
}

export const LiquidacionPayment: React.FC<LiquidacionPaymentProps> = ({
    reserva,
    montoAbonado,
    metodoPago,
    fianza,
    onMontoAbonadoChange,
    onMetodoPagoChange,
    onFianzaChange,
}) => {
    const montoPendiente = reserva.precio - (reserva.montoAbonado || 0);

    return (
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                Información del Pago
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        type="number"
                        label="Monto a Abonar"
                        value={montoAbonado}
                        onChange={(e) => {
                            const nuevoMonto = parseFloat(e.target.value) || 0;
                            if (nuevoMonto <= montoPendiente) {
                                onMontoAbonadoChange(nuevoMonto);
                            }
                        }}
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem' }}>€</Typography>,
                            endAdornment: (
                                <Typography sx={{ ml: 1, fontSize: '1.1rem', color: 'text.secondary' }}>
                                    Total pendiente: {montoPendiente.toFixed(2)}€
                                </Typography>
                            )
                        }}
                        helperText="Debe abonar el monto total pendiente"
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
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel sx={{ fontSize: '1.2rem' }}>Método de Pago</InputLabel>
                        <Select
                            value={metodoPago}
                            label="Método de Pago"
                            onChange={(e) => onMetodoPagoChange(e.target.value as 'efectivo' | 'tarjeta' | '')}
                            sx={{
                                '& .MuiSelect-select': {
                                    fontSize: '1.2rem',
                                    minHeight: '48px',
                                    minWidth: '200px'
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderWidth: '2px'
                                }
                            }}
                        >
                            <MenuItem value="efectivo" sx={{ fontSize: '1.2rem', py: 1 }}>Efectivo</MenuItem>
                            <MenuItem value="tarjeta" sx={{ fontSize: '1.2rem', py: 1 }}>Tarjeta</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        type="number"
                        label="Fianza"
                        value={fianza}
                        onChange={(e) => {
                            const nuevaFianza = parseFloat(e.target.value) || 0;
                            onFianzaChange(nuevaFianza);
                        }}
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem' }}>€</Typography>,
                        }}
                        helperText="Fianza de la reserva para control de caja"
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
                </Grid>
            </Grid>
        </Paper>
    );
}; 