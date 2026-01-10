import React, { useState, useEffect } from 'react';
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
    Button,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    IconButton,
    Tooltip
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config';
import { authenticatedFetchJson } from '../../utils/apiHelper';
import { CambioModal } from './CambioModal';
import { useAuthStore } from '../../stores/authStore';

interface ProductoVenta {
    nombre: string;
    categoria?: string;
    unidades: number;
    precioUnitario: number;
    precioTotal: number;
}

interface Cambio {
    _id: string;
    productoOriginal: {
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        total: number;
    };
    productoNuevo: {
        nombre: string;
        cantidad: number;
        precioUnitario: number;
        total: number;
    };
    diferenciaPrecio: number;
    estadoPago: string;
    motivo?: string;
    createdAt: string;
}

interface Venta {
    _id: string;
    codigoSocio: string;
    nombreSocio: string;
    productos: ProductoVenta[];
    total: number;
    pagado: number;
    estado: string;
    createdAt: string;
    cambios?: Cambio[];
    usuario?: {
        _id: string;
        username: string;
    };
    trabajador?: {
        _id: string;
        nombre: string;
    };
}

export const CambiosList: React.FC = () => {
    const { user } = useAuthStore();
    const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
    const [modalCambioOpen, setModalCambioOpen] = useState(false);

    // Obtener ventas del día
    const { data: ventas = [], isLoading, refetch } = useQuery<Venta[]>({
        queryKey: ['ventas-del-dia'],
        queryFn: () => authenticatedFetchJson<Venta[]>(`${API_BASE_URL}/cambios/ventas-del-dia`)
    });

    const queryClient = useQueryClient();

    const handleAbrirModalCambio = (venta: Venta) => {
        setVentaSeleccionada(venta);
        setModalCambioOpen(true);
    };

    const handleCerrarModal = () => {
        setModalCambioOpen(false);
        setVentaSeleccionada(null);
    };

    const handleCambioRealizado = () => {
        queryClient.invalidateQueries({ queryKey: ['ventas-del-dia'] });
        queryClient.invalidateQueries({ queryKey: ['recaudaciones'] });
        handleCerrarModal();
    };

    const getEstadoChip = (estado: string) => {
        const estados: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
            PENDIENTE: { label: 'Pendiente', color: 'warning' },
            PAGADO: { label: 'Pagado', color: 'success' },
            PAGADO_PARCIAL: { label: 'Pago Parcial', color: 'info' }
        };

        const estadoInfo = estados[estado] || { label: estado, color: 'default' as const };
        return <Chip label={estadoInfo.label} color={estadoInfo.color} size="small" />;
    };

    return (
        <Box>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Cambios de Productos
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Solo se pueden cambiar productos de ventas realizadas el día actual
                </Typography>

                {isLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : ventas.length === 0 ? (
                    <Alert severity="info">
                        No hay ventas del día actual para realizar cambios
                    </Alert>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fecha/Hora</TableCell>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Productos</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Pagado</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ventas.map((venta) => (
                                    <TableRow key={venta._id}>
                                        <TableCell>
                                            {new Date(venta.createdAt).toLocaleString('es-ES', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {venta.nombreSocio} ({venta.codigoSocio})
                                        </TableCell>
                                        <TableCell>
                                            {/* Mostrar productos actuales */}
                                            {venta.productos.map((p, idx) => (
                                                <Typography key={idx} variant="body2">
                                                    {p.nombre} x{p.unidades} = {p.precioTotal.toFixed(2)}€
                                                </Typography>
                                            ))}
                                            {/* Mostrar cambios realizados */}
                                            {venta.cambios && venta.cambios.length > 0 && (
                                                <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #ccc' }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                                        Cambios realizados:
                                                    </Typography>
                                                    {venta.cambios.map((cambio, idx) => (
                                                        <Typography key={idx} variant="caption" display="block" sx={{ mt: 0.5 }}>
                                                            <span style={{ color: '#d32f2f' }}>
                                                                {cambio.productoOriginal.nombre} x{cambio.productoOriginal.cantidad} = {cambio.productoOriginal.total.toFixed(2)}€
                                                            </span>
                                                            {' → '}
                                                            <span style={{ color: '#2e7d32' }}>
                                                                {cambio.productoNuevo.nombre} x{cambio.productoNuevo.cantidad} = {cambio.productoNuevo.total.toFixed(2)}€
                                                            </span>
                                                            {cambio.diferenciaPrecio !== 0 && (
                                                                <span style={{ color: cambio.diferenciaPrecio > 0 ? '#d32f2f' : '#1976d2', marginLeft: '8px' }}>
                                                                    ({cambio.diferenciaPrecio > 0 ? '+' : ''}{cambio.diferenciaPrecio.toFixed(2)}€)
                                                                </span>
                                                            )}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell>{venta.total.toFixed(2)}€</TableCell>
                                        <TableCell>{venta.pagado.toFixed(2)}€</TableCell>
                                        <TableCell>{getEstadoChip(venta.estado)}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Realizar cambio">
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleAbrirModalCambio(venta)}
                                                >
                                                    <SwapHorizIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {ventaSeleccionada && (
                <CambioModal
                    open={modalCambioOpen}
                    onClose={handleCerrarModal}
                    venta={ventaSeleccionada}
                    onCambioRealizado={handleCambioRealizado}
                />
            )}
        </Box>
    );
};

