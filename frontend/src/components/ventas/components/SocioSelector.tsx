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
import { api } from '../../../services/api';

interface SocioSelectorProps {
    onClienteSeleccionado: (cliente: Cliente | null) => void;
    value: Cliente | null;
}

export const SocioSelector: React.FC<SocioSelectorProps> = ({ onClienteSeleccionado, value }) => {
    const { token } = useAuthStore();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClientes = async () => {
            if (!token) {
                console.error('No hay token disponible');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/socios/simplified`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Error al cargar los clientes');
                }

                const data = await response.json();
                console.log('Socios cargados:', data);
                setClientes(data);
            } catch (error) {
                console.error('Error al obtener clientes:', error);
                setError(error instanceof Error ? error.message : 'Error al cargar los clientes');
            } finally {
                setLoading(false);
            }
        };

        fetchClientes();
    }, [token]);

    useEffect(() => {
        console.log('Token en SocioSelector:', token);
    }, [token]);

    // Obtener socios
    const { data: socios, isLoading } = useQuery<SocioResponse[]>({
        queryKey: ['socios', token],
        queryFn: async () => {
            if (!token) {
                console.error('No hay token disponible');
                return [];
            }
            try {
                console.log('Haciendo petición de socios con token:', token);
                const response = await axios.get(`${API_BASE_URL}/socios/simplified`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Socios cargados:', response.data);
                return response.data;
            } catch (error) {
                console.error('Error al obtener socios:', error);
                return [];
            }
        },
        enabled: !!token // Solo ejecutar la query si hay token
    });

    useEffect(() => {
        console.log('Socios disponibles:', socios);
    }, [socios]);

    // Crear una lista plana que incluya tanto socios como asociados
    const opciones = React.useMemo(() => {
        if (!socios) return [];

        const opcionesPlanas = socios.flatMap(socio => [
            {
                _id: socio._id,
                codigo: socio.socio,
                nombreCompleto: socio.nombreCompleto,
                esSocio: true
            },
            ...socio.asociados.map(asociado => ({
                _id: asociado._id,
                codigo: asociado.codigo,
                nombreCompleto: asociado.nombreCompleto,
                esSocio: false
            }))
        ]);

        return opcionesPlanas;
    }, [socios]);

    if (loading) {
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
                Seleccionar Socio o Asociado
            </Typography>
            <Autocomplete
                options={opciones}
                value={value}
                getOptionLabel={(option) => `${option.nombreCompleto} (${option.codigo})`}
                onChange={(_, newValue) => {
                    console.log('Seleccionado:', newValue);
                    onClienteSeleccionado(newValue);
                }}
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
                    <li {...props} key={option._id}>
                        <Box>
                            <Typography>
                                {option.nombreCompleto}
                                <Typography
                                    component="span"
                                    sx={{ ml: 1, color: option.esSocio ? 'primary.main' : 'secondary.main' }}
                                >
                                    ({option.esSocio ? 'Socio' : 'Asociado'})
                                </Typography>
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