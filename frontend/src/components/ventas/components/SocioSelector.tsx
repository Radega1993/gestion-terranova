import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Autocomplete,
    CircularProgress,
    Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';
import { Cliente } from '../types';

interface SocioSelectorProps {
    onClienteSeleccionado: (cliente: Cliente | null) => void;
    value: Cliente | null;
    soloSocios?: boolean;
}

interface SocioResponse {
    _id: string;
    socio: string;
    nombreCompleto: string;
    asociados: Array<{
        _id: string;
        codigo: string;
        nombreCompleto: string;
    }>;
}

export const SocioSelector: React.FC<SocioSelectorProps> = ({
    onClienteSeleccionado,
    value,
    soloSocios = false
}) => {
    const { token } = useAuthStore();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Obtener socios
    const { data: socios, isLoading, error: queryError } = useQuery<SocioResponse[]>({
        queryKey: ['socios', token],
        queryFn: async () => {
            if (!token) {
                throw new Error('No hay token disponible');
            }
            const response = await axios.get(`${API_BASE_URL}/socios/simplified`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        },
        enabled: !!token
    });

    // Actualizar el estado de error si hay un error en la query
    useEffect(() => {
        if (queryError) {
            setError(queryError instanceof Error ? queryError.message : 'Error al cargar los socios');
        }
    }, [queryError]);

    // Crear una lista plana que incluya solo socios o socios y asociados según la prop
    const opciones = React.useMemo(() => {
        if (!socios) return [];

        const opcionesPlanas = socios.flatMap(socio => [
            {
                _id: socio._id,
                codigo: socio.socio,
                nombreCompleto: socio.nombreCompleto,
                esSocio: true
            },
            ...(soloSocios ? [] : socio.asociados.map(asociado => ({
                _id: asociado._id,
                codigo: asociado.codigo,
                nombreCompleto: asociado.nombreCompleto,
                esSocio: false
            })))
        ]);

        return opcionesPlanas;
    }, [socios, soloSocios]);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error: {error}
            </Alert>
        );
    }

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                {soloSocios ? 'Seleccionar Socio' : 'Seleccionar Socio o Asociado'}
            </Typography>
            <Autocomplete
                options={opciones}
                value={value}
                getOptionLabel={(option) => `${option.nombreCompleto} (${option.codigo})`}
                onChange={(_, newValue) => {
                    onClienteSeleccionado(newValue);
                }}
                isOptionEqualToValue={(option, value) => option.codigo === value.codigo}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Buscar por nombre o código"
                        variant="outlined"
                        fullWidth
                    />
                )}
                loading={isLoading}
                renderOption={(props, option) => (
                    <li {...props} key={`${option.codigo}-${option.esSocio ? 'socio' : 'asociado'}`}>
                        <Box>
                            <Typography>
                                {option.nombreCompleto}
                                {!soloSocios && (
                                    <Typography
                                        component="span"
                                        sx={{ ml: 1, color: option.esSocio ? 'primary.main' : 'secondary.main' }}
                                    >
                                        ({option.esSocio ? 'Socio' : 'Asociado'})
                                    </Typography>
                                )}
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