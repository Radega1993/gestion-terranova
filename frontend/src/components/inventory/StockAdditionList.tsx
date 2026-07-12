import React from 'react';
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
    CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetchJson } from '../../utils/apiHelper';
import { API_BASE_URL } from '../../config';
import { Product } from '../../types/product';

export interface StockAddition {
    _id: string;
    producto: Product;
    cantidad: number;
    usuarioRegistro: {
        _id: string;
        username: string;
    };
    fechaRegistro: string;
    observaciones?: string;
}

export const StockAdditionList: React.FC = () => {
    const { data: stockAdditions = [], isLoading } = useQuery<StockAddition[]>({
        queryKey: ['stock-additions'],
        queryFn: () => authenticatedFetchJson<StockAddition[]>(`${API_BASE_URL}/inventory/stock-additions`),
    });

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Movimientos de stock
            </Typography>
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Producto</TableCell>
                                <TableCell>Cantidad</TableCell>
                                <TableCell>Registrado por</TableCell>
                                <TableCell>Observaciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stockAdditions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        No hay movimientos de stock registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stockAdditions.map((item) => (
                                    <TableRow key={item._id}>
                                        <TableCell>{new Date(item.fechaRegistro).toLocaleString('es-ES')}</TableCell>
                                        <TableCell>{item.producto.nombre}</TableCell>
                                        <TableCell>{item.cantidad}</TableCell>
                                        <TableCell>{item.usuarioRegistro.username}</TableCell>
                                        <TableCell>{item.observaciones || '-'}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
};
