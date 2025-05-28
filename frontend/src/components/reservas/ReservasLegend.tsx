import React from 'react';
import { Box, Typography } from '@mui/material';
import { Servicio } from './types';

interface ReservasLegendProps {
    servicios: Servicio[];
}

export const ReservasLegend: React.FC<ReservasLegendProps> = ({ servicios }) => (
    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {servicios.filter(s => s.activo).map((servicio) => (
                <Box key={servicio.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 20, backgroundColor: servicio.color, borderRadius: '50%' }} />
                        <Typography variant="body2">{servicio.nombre}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                        <Box sx={{ width: 20, height: 20, backgroundColor: servicio.colorConObservaciones, borderRadius: '50%' }} />
                        <Typography variant="body2">{servicio.nombre} (con observaciones)</Typography>
                    </Box>
                </Box>
            ))}
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: '#ff9800', borderRadius: '50%' }} />
                    <Typography variant="body2">Lista de espera</Typography>
                </Box>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: '#2e7d32', borderRadius: '50%' }} />
                    <Typography variant="body2">Completada y pagada</Typography>
                </Box>
            </Box>
            <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, backgroundColor: '#9e9e9e', borderRadius: '50%' }} />
                    <Typography variant="body2">Cancelada</Typography>
                </Box>
            </Box>
        </Box>
    </Box>
); 