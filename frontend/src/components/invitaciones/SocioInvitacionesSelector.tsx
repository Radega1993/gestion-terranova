import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Autocomplete,
    TextField,
    CircularProgress,
    Alert
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { API_BASE_URL } from '../../config';

interface Socio {
    _id: string;
    socio: string;
    nombre: {
        nombre: string;
        primerApellido: string;
        segundoApellido?: string;
    };
}

interface SocioSelectorProps {
    onSocioSeleccionado: (socio: { codigo: string; nombreCompleto: string } | null) => void;
    value: { codigo: string; nombreCompleto: string } | null;
}

export const SocioInvitacionesSelector: React.FC<SocioSelectorProps> = ({ onSocioSeleccionado, value }) => {
    const { token } = useAuthStore();

    // Obtener socios
    const { data: socios, isLoading, error } = useQuery<Socio[]>({
        queryKey: ['socios-invitaciones'],
        queryFn: async () => {
            if (!token) {
                throw new Error('No hay token disponible');
            }
            const response = await fetch(`${API_BASE_URL}/socios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar los socios');
            }

            return response.json();
        },
        enabled: !!token
    });

    // Crear opciones para el Autocomplete
    const opciones = React.useMemo(() => {
        if (!socios) return [];

        return socios.map(socio => ({
            codigo: socio.socio,
            nombreCompleto: `${socio.nombre.nombre} ${socio.nombre.primerApellido} ${socio.nombre.segundoApellido || ''}`.trim()
        }));
    }, [socios]);

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error al cargar los socios: {error instanceof Error ? error.message : 'Error desconocido'}
            </Alert>
        );
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Seleccionar Socio
            </Typography>
            <Autocomplete
                options={opciones}
                value={value}
                getOptionLabel={(option) => `${option.nombreCompleto} (${option.codigo})`}
                onChange={(_, newValue) => onSocioSeleccionado(newValue)}
                isOptionEqualToValue={(option, value) => option.codigo === value.codigo}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Buscar socio por nombre o código"
                        variant="outlined"
                        fullWidth
                    />
                )}
                loading={isLoading}
                renderOption={(props, option) => (
                    <li {...props} key={option.codigo}>
                        <Box>
                            <Typography>
                                {option.nombreCompleto}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Código: {option.codigo}
                            </Typography>
                        </Box>
                    </li>
                )}
            />
        </Paper>
    );
}; 