import React, { useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Autocomplete,
} from '@mui/material';
import { Producto } from '../types';

interface ProductoSelectorProps {
    productos: Producto[];
    isLoading: boolean;
    onProductoSelect: (producto: Producto | null) => void;
}

export const ProductoSelector: React.FC<ProductoSelectorProps> = ({
    productos,
    isLoading,
    onProductoSelect,
}) => {
    useEffect(() => {
    }, [productos]);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Seleccionar Producto
            </Typography>
            <Autocomplete
                options={productos}
                getOptionLabel={(option) => option.nombre}
                onChange={(_, newValue) => {
                    onProductoSelect(newValue);
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Buscar producto"
                        variant="outlined"
                        fullWidth
                    />
                )}
                loading={isLoading}
                renderOption={(props, option) => {
                    const { key, ...rest } = props as { key: React.Key } & typeof props;
                    return (
                        <li key={key} {...rest}>
                            <Box>
                                <Typography>{option.nombre}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {option.precio_compra_unitario !== undefined ? option.precio_compra_unitario.toFixed(2) + '€' : 'N/A'} - Stock: {option.stock_actual ?? 'N/A'} - {option.tipo}
                                </Typography>
                            </Box>
                        </li>
                    );
                }}
            />
        </Paper>
    );
}; 