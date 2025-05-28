import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Checkbox,
    TextField,
} from '@mui/material';
import { Suplemento } from '../types';

interface ReservaFormSuplementosProps {
    suplementosList: Suplemento[];
    selectedSuplementos: { id: string; cantidad?: number }[];
    onSuplementoChange: (suplementoId: string, checked: boolean, cantidad?: number) => void;
    onCantidadChange: (suplementoId: string, cantidad: number) => void;
}

export const ReservaFormSuplementos: React.FC<ReservaFormSuplementosProps> = ({
    suplementosList,
    selectedSuplementos,
    onSuplementoChange,
    onCantidadChange,
}) => {
    return (
        <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                Suplementos Disponibles
            </Typography>
            <Grid container spacing={2}>
                {suplementosList.filter(s => s.activo).map((suplemento) => (
                    <Grid item xs={12} sm={6} md={4} key={suplemento.id}>
                        <Paper
                            elevation={1}
                            sx={{
                                p: 2,
                                border: selectedSuplementos.some(s => s.id === suplemento.id)
                                    ? '2px solid'
                                    : '1px solid',
                                borderColor: selectedSuplementos.some(s => s.id === suplemento.id)
                                    ? 'primary.main'
                                    : 'divider',
                                borderRadius: 2,
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'action.hover'
                                }
                            }}
                            onClick={() => onSuplementoChange(suplemento.id, !selectedSuplementos.some(s => s.id === suplemento.id))}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Checkbox
                                    checked={selectedSuplementos.some(s => s.id === suplemento.id)}
                                    onChange={(e) => onSuplementoChange(suplemento.id, e.target.checked)}
                                    sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        {suplemento.nombre}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {suplemento.precio}€ {suplemento.tipo === 'porHora' ? '/hora' : ''}
                                    </Typography>
                                </Box>
                            </Box>
                            {suplemento.tipo === 'porHora' && selectedSuplementos.some(s => s.id === suplemento.id) && (
                                <TextField
                                    type="number"
                                    size="small"
                                    label="Cantidad de horas"
                                    value={selectedSuplementos.find(s => s.id === suplemento.id)?.cantidad || 1}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onCantidadChange(suplemento.id, parseInt(e.target.value) || 1);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{
                                        width: '100%',
                                        mt: 1,
                                        '& .MuiInputBase-input': {
                                            fontSize: '1rem',
                                            padding: '8px 14px'
                                        }
                                    }}
                                />
                            )}
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
}; 