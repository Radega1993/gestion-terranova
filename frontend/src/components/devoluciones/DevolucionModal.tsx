import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
    Alert,
    Chip
} from '@mui/material';
import { devolucionesService, CreateDevolucionDto, ProductoDevolucion } from '../../services/devoluciones';
import { Venta } from '../ventas/types';
import { CurrencyInput } from '../common/CurrencyInput';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../stores/authStore';
import Swal from 'sweetalert2';

interface DevolucionModalProps {
    open: boolean;
    onClose: () => void;
    venta: Venta | null;
    onDevolucionCompletada: () => void;
}

export const DevolucionModal: React.FC<DevolucionModalProps> = ({
    open,
    onClose,
    venta,
    onDevolucionCompletada
}) => {
    const { user } = useAuthStore();
    const [productosSeleccionados, setProductosSeleccionados] = useState<Map<string, { cantidad: number; precioUnitario: number }>>(new Map());
    const [metodoDevolucion, setMetodoDevolucion] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
    const [motivo, setMotivo] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && venta) {
            // Resetear estado al abrir
            setProductosSeleccionados(new Map());
            setMetodoDevolucion('EFECTIVO');
            setMotivo('');
            setObservaciones('');
            setError(null);
        }
    }, [open, venta]);

    const handleProductoToggle = (productoNombre: string, precioUnitario: number, cantidadMaxima: number) => {
        const newMap = new Map(productosSeleccionados);
        if (newMap.has(productoNombre)) {
            newMap.delete(productoNombre);
        } else {
            newMap.set(productoNombre, { cantidad: cantidadMaxima, precioUnitario });
        }
        setProductosSeleccionados(newMap);
    };

    const handleCantidadChange = (productoNombre: string, nuevaCantidad: number, cantidadMaxima: number) => {
        if (nuevaCantidad < 1 || nuevaCantidad > cantidadMaxima) return;

        const newMap = new Map(productosSeleccionados);
        const producto = newMap.get(productoNombre);
        if (producto) {
            newMap.set(productoNombre, { ...producto, cantidad: nuevaCantidad });
            setProductosSeleccionados(newMap);
        }
    };

    const calcularTotal = (): number => {
        let total = 0;
        productosSeleccionados.forEach((producto) => {
            total += producto.cantidad * producto.precioUnitario;
        });
        return total;
    };

    const handleSubmit = async () => {
        if (!venta) return;

        if (productosSeleccionados.size === 0) {
            setError('Debe seleccionar al menos un producto para devolver');
            return;
        }

        if (!motivo.trim()) {
            setError('El motivo es obligatorio');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const productos: ProductoDevolucion[] = Array.from(productosSeleccionados.entries()).map(([nombre, data]) => {
                const productoVenta = venta.productos.find(p => p.nombre === nombre);
                return {
                    nombre,
                    categoria: productoVenta?.categoria,
                    cantidad: data.cantidad,
                    precioUnitario: data.precioUnitario,
                    total: data.cantidad * data.precioUnitario
                };
            });

            const devolucionData: CreateDevolucionDto = {
                venta: venta._id,
                productos,
                totalDevolucion: calcularTotal(),
                metodoDevolucion,
                motivo: motivo.trim(),
                observaciones: observaciones.trim() || undefined
            };

            await devolucionesService.create(devolucionData);
            
            Swal.fire({
                icon: 'success',
                title: 'Devolución creada',
                text: 'La devolución ha sido registrada correctamente',
            });

            onDevolucionCompletada();
            onClose();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al crear la devolución';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!venta) return null;

    const totalDevolucion = calcularTotal();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Crear Devolución</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        <strong>Venta:</strong> {venta.nombreSocio} ({venta.codigoSocio})
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        <strong>Fecha:</strong> {new Date(venta.createdAt).toLocaleDateString()}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        <strong>Total Venta:</strong> {formatCurrency(venta.total)}
                    </Typography>

                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                        Productos de la Venta
                    </Typography>

                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">Devolver</TableCell>
                                    <TableCell>Producto</TableCell>
                                    <TableCell align="right">Cantidad Vendida</TableCell>
                                    <TableCell align="right">Precio Unitario</TableCell>
                                    <TableCell align="right">Cantidad a Devolver</TableCell>
                                    <TableCell align="right">Subtotal</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {venta.productos.map((producto, index) => {
                                    const isSelected = productosSeleccionados.has(producto.nombre);
                                    const cantidadSeleccionada = productosSeleccionados.get(producto.nombre)?.cantidad || 0;

                                    return (
                                        <TableRow key={index}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onChange={() => handleProductoToggle(
                                                        producto.nombre,
                                                        producto.precioUnitario,
                                                        producto.unidades
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>{producto.nombre}</TableCell>
                                            <TableCell align="right">{producto.unidades}</TableCell>
                                            <TableCell align="right">{formatCurrency(producto.precioUnitario)}</TableCell>
                                            <TableCell align="right">
                                                {isSelected ? (
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={cantidadSeleccionada}
                                                        onChange={(e) => handleCantidadChange(
                                                            producto.nombre,
                                                            parseInt(e.target.value) || 0,
                                                            producto.unidades
                                                        )}
                                                        inputProps={{ min: 1, max: producto.unidades }}
                                                        sx={{ width: '80px' }}
                                                    />
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {isSelected ? formatCurrency(cantidadSeleccionada * producto.precioUnitario) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="h6">
                            Total Devolución: {formatCurrency(totalDevolucion)}
                        </Typography>
                    </Box>

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Método de Devolución *</InputLabel>
                        <Select
                            value={metodoDevolucion}
                            onChange={(e) => setMetodoDevolucion(e.target.value as 'EFECTIVO' | 'TARJETA')}
                            label="Método de Devolución *"
                            required
                        >
                            <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                            <MenuItem value="TARJETA">Tarjeta</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Motivo *"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        required
                        multiline
                        rows={3}
                        helperText="Motivo de la devolución (obligatorio)"
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Observaciones"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        multiline
                        rows={2}
                    />

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={loading || productosSeleccionados.size === 0 || !motivo.trim()}
                >
                    {loading ? 'Creando...' : 'Crear Devolución'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};








