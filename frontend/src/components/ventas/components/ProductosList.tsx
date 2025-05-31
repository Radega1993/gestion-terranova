import React, { useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProductoSeleccionado } from '../types';

interface ProductosListProps {
    productos: ProductoSeleccionado[];
    onCantidadChange: (id: string, cantidad: number) => void;
    onEliminarProducto: (id: string) => void;
}

export const ProductosList: React.FC<ProductosListProps> = ({
    productos,
    onCantidadChange,
    onEliminarProducto,
}) => {
    useEffect(() => {
    }, [productos]);

    const total = productos.reduce((sum, p) => sum + p.subtotal, 0);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Productos Seleccionados
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell align="right">Precio</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell align="right">Subtotal</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {productos.map((producto) => {
                            return (
                                <TableRow key={producto._id}>
                                    <TableCell>{producto.nombre}</TableCell>
                                    <TableCell align="right">
                                        {producto.precio_compra_unitario !== undefined ? producto.precio_compra_unitario.toFixed(2) + '€' : 'N/A'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <TextField
                                            type="number"
                                            value={producto.cantidad}
                                            onChange={(e) => onCantidadChange(
                                                producto._id,
                                                parseInt(e.target.value) || 1
                                            )}
                                            inputProps={{ min: 1, max: producto.stock_actual }}
                                            sx={{ width: '80px' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        {producto.subtotal.toFixed(2)}€
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            onClick={() => onEliminarProducto(producto._id)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography variant="h6">
                    Total: {total.toFixed(2)}€
                </Typography>
            </Box>
        </Paper>
    );
}; 