import React, { useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Autocomplete,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';

interface NombreSocio {
    nombre: string;
    primerApellido: string;
    segundoApellido: string;
}

interface Socio {
    _id: string;
    socio: string;
    nombre: NombreSocio;
    casa: number;
    totalSocios: number;
    numPersonas: number;
    adheridos: number;
    menor3Años: number;
    cuota: number;
    rgpd: boolean;
}

interface SocioSelectorProps {
    onSocioSelect: (socio: Socio | null) => void;
}

export const SocioSelector: React.FC<SocioSelectorProps> = ({
    onSocioSelect,
}) => {
    const { token } = useAuthStore();

    useEffect(() => {
        console.log('Token en SocioSelector:', token);
    }, [token]);

    // Obtener socios
    const { data: socios, isLoading } = useQuery<Socio[]>({
        queryKey: ['socios', token],
        queryFn: async () => {
            if (!token) {
                console.error('No hay token disponible');
                return [];
            }
            try {
                console.log('Haciendo petición de socios con token:', token);
                const response = await axios.get(`${API_BASE_URL}/socios`, {
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

    const getNombreCompleto = (socio: Socio) => {
        if (!socio.nombre) return 'Sin nombre';
        const { nombre, primerApellido, segundoApellido } = socio.nombre;
        return `${nombre || ''} ${primerApellido || ''} ${segundoApellido || ''}`.trim();
    };

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Seleccionar Socio
            </Typography>
            <Autocomplete
                options={socios || []}
                getOptionLabel={(option) => `${getNombreCompleto(option)} (${option.socio})`}
                onChange={(_, newValue) => {
                    console.log('Socio seleccionado:', newValue);
                    onSocioSelect(newValue);
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Buscar socio por nombre o código"
                        variant="outlined"
                        fullWidth
                    />
                )}
                loading={isLoading}
                renderOption={(props, option) => {
                    const nombreCompleto = getNombreCompleto(option);
                    return (
                        <li {...props} key={option._id}>
                            <Box>
                                <Typography>{nombreCompleto}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Código: {option.socio}
                                </Typography>
                            </Box>
                        </li>
                    );
                }}
            />
        </Paper>
    );
}; 