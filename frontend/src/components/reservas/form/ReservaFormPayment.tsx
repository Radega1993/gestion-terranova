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
import { CurrencyInput } from '../../common/CurrencyInput';

interface ReservaFormPaymentProps {
    formData: {
        montoAbonado: number;
        metodoPago: 'efectivo' | 'tarjeta' | '';
        observaciones: string;
    };
    onFormDataChange: (field: string, value: any) => void;
}

export const ReservaFormPayment: React.FC<ReservaFormPaymentProps> = ({
    formData,
    onFormDataChange,
}) => {
    return (
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                Pago y Observaciones
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <CurrencyInput
                        label="Monto Abonado"
                        value={formData.montoAbonado}
                        onChange={(value) => onFormDataChange('montoAbonado', value)}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel sx={{ fontSize: '1.2rem' }}>Método de Pago</InputLabel>
                        <Select
                            value={formData.metodoPago}
                            label="Método de Pago"
                            onChange={(e) => onFormDataChange('metodoPago', e.target.value)}
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
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Observaciones"
                        value={formData.observaciones}
                        onChange={(e) => onFormDataChange('observaciones', e.target.value)}
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