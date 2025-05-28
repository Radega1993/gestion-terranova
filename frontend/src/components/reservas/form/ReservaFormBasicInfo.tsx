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
    Autocomplete,
} from '@mui/material';
import { Servicio, Socio } from '../types';

interface ReservaFormBasicInfoProps {
    formData: {
        fecha: string;
        servicio: string;
        socio: string;
    };
    servicios: Servicio[];
    socios: Socio[];
    onFormDataChange: (field: string, value: any) => void;
}

export const ReservaFormBasicInfo: React.FC<ReservaFormBasicInfoProps> = ({
    formData,
    servicios,
    socios,
    onFormDataChange,
}) => {
    return (
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                Información Principal
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        type="date"
                        label="Fecha"
                        value={formData.fecha}
                        onChange={(e) => onFormDataChange('fecha', e.target.value)}
                        InputLabelProps={{ shrink: true }}
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
                        <InputLabel sx={{ fontSize: '1.2rem' }}>Servicio</InputLabel>
                        <Select
                            value={formData.servicio}
                            label="Servicio"
                            onChange={(e) => onFormDataChange('servicio', e.target.value)}
                            sx={{
                                '& .MuiSelect-select': {
                                    fontSize: '1.2rem',
                                    padding: '11px 14px',
                                    minHeight: '48px',
                                    minWidth: '200px'
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderWidth: '2px'
                                }
                            }}
                        >
                            {servicios.filter(s => s.activo).map((servicio) => (
                                <MenuItem key={servicio.id} value={servicio.id} sx={{ fontSize: '1.2rem', py: 1 }}>
                                    {servicio.nombre} - {servicio.precio}€
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <Autocomplete
                        options={socios.filter(s => s.active)}
                        getOptionLabel={(option) => `${option.nombre.nombre} ${option.nombre.primerApellido} (${option.socio})`}
                        value={socios.find(s => s._id === formData.socio) || null}
                        onChange={(_, newValue) => onFormDataChange('socio', newValue?._id || '')}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Socio"
                                fullWidth
                                sx={{
                                    '& .MuiInputBase-root': {
                                        fontSize: '1.2rem',
                                        minHeight: '48px',
                                        width: '215%'
                                    },
                                    '& .MuiInputLabel-root': {
                                        fontSize: '1.2rem'
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderWidth: '2px'
                                    },
                                    '& .MuiAutocomplete-input': {
                                        padding: '11px 14px'
                                    },
                                    '& .MuiAutocomplete-endAdornment': {
                                        top: 'calc(50% - 14px)',
                                        right: '14px'
                                    }
                                }}
                            />
                        )}
                    />
                </Grid>
            </Grid>
        </Paper>
    );
}; 