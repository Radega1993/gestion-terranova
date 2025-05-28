import React from 'react';
import {
    Box,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Grid
} from '@mui/material';
import { Reserva } from '../types';

interface CancelacionFormProps {
    reserva: Reserva;
    motivo: 'CLIMA' | 'ANTICIPADA' | 'OTRO';
    observaciones: string;
    montoDevuelto: number;
    onMotivoChange: (motivo: 'CLIMA' | 'ANTICIPADA' | 'OTRO') => void;
    onObservacionesChange: (observaciones: string) => void;
    onMontoDevueltoChange: (monto: number) => void;
}

export const CancelacionForm: React.FC<CancelacionFormProps> = ({
    reserva,
    motivo,
    observaciones,
    montoDevuelto,
    onMotivoChange,
    onObservacionesChange,
    onMontoDevueltoChange
}) => {
    const fechaReserva = new Date(reserva.fecha);
    const fechaActual = new Date();
    const diasDiferencia = Math.ceil((fechaReserva.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>Motivo de Cancelación</InputLabel>
                        <Select
                            value={motivo}
                            label="Motivo de Cancelación"
                            onChange={(e) => onMotivoChange(e.target.value as 'CLIMA' | 'ANTICIPADA' | 'OTRO')}
                        >
                            <MenuItem value="CLIMA">Por condiciones climáticas</MenuItem>
                            <MenuItem value="ANTICIPADA">Cancelación anticipada</MenuItem>
                            <MenuItem value="OTRO">Otro motivo</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {motivo === 'ANTICIPADA' && (
                    <>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Observaciones"
                                value={observaciones}
                                onChange={(e) => onObservacionesChange(e.target.value)}
                                helperText="Especifique el motivo de la cancelación"
                            />
                        </Grid>
                        {diasDiferencia >= 9 && reserva.montoAbonado && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Monto a Devolver"
                                    value={montoDevuelto}
                                    onChange={(e) => onMontoDevueltoChange(parseFloat(e.target.value) || 0)}
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1 }}>€</Typography>,
                                    }}
                                    helperText={`Monto máximo a devolver: ${reserva.montoAbonado}€`}
                                />
                            </Grid>
                        )}
                    </>
                )}

                {motivo === 'OTRO' && (
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Observaciones"
                            value={observaciones}
                            onChange={(e) => onObservacionesChange(e.target.value)}
                        />
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}; 