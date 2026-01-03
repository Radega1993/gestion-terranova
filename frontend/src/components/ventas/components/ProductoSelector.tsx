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
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';
import { Producto } from '../types';

interface ProductoSelectorProps {
    onProductoSeleccionado: (producto: Producto) => void;
}

export const ProductoSelector: React.FC<ProductoSelectorProps> = ({ onProductoSeleccionado }) => {
    const { token } = useAuthStore();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProductos = async () => {
            if (!token) {
                console.error('No hay token disponible');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/inventory`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Error al cargar productos');
                }

                const data = await response.json();
                console.log('Productos cargados:', data);
                setProductos(data);
            } catch (error) {
                console.error('Error al obtener productos:', error);
                setError(error instanceof Error ? error.message : 'Error al cargar productos');
            } finally {
                setLoading(false);
            }
        };

        fetchProductos();
    }, [token]);

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
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Seleccionar Producto
            </Typography>
            <Autocomplete
                options={productos}
                getOptionLabel={(option) => `${option.nombre} - ${option.stock_actual} ${option.unidad_medida}`}
                onChange={(_, value) => {
                    if (value) {
                        onProductoSeleccionado(value);
                    }
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Buscar producto"
                        variant="outlined"
                        fullWidth
                    />
                )}
                renderOption={(props, option) => {
                    const { key, ...restProps } = props;
                    return (
                        <li key={key} {...restProps}>
                            <Box>
                                <Box component="span" sx={{ fontWeight: 'bold' }}>
                                    {option.nombre}
                                </Box>
                                <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                                    {option.stock_actual} {option.unidad_medida}
                                </Box>
                            </Box>
                        </li>
                    );
                }}
            />
        </Paper>
    );
}; 