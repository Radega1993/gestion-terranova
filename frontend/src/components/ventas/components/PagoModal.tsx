import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Paper
} from '@mui/material';
import { ProductoSeleccionado, Cliente } from '../types';
import { useAuthStore } from '../../../stores/authStore';
import { API_BASE_URL } from '../../../config';

interface PagoModalProps {
    open: boolean;
    onClose: () => void;
    productos: ProductoSeleccionado[];
    cliente: Cliente | null;
    onVentaCompletada: () => void;
}

export const PagoModal: React.FC<PagoModalProps> = ({
    open,
    onClose,
    productos,
    cliente,
    onVentaCompletada
}) => {
    const { token } = useAuthStore();
    const [pagado, setPagado] = useState<number>(0);
    const [observaciones, setObservaciones] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');

    const total = productos.reduce((sum, producto) => sum + producto.precioTotal, 0);
    const pendiente = total - pagado;
    const cambio = pagado > total ? pagado - total : 0;

    const handleSubmit = async () => {
        try {
            if (!cliente) {
                setError('Debe seleccionar un cliente');
                return;
            }

            if (pagado < total && !observaciones) {
                setError('Las observaciones son obligatorias para pagos parciales');
                return;
            }

            const ventaData = {
                codigoSocio: cliente.codigo,
                nombreSocio: cliente.nombreCompleto,
                esSocio: cliente.tipo === 'Socio',
                productos: productos.map(p => ({
                    nombre: p.nombre,
                    tipo: p.tipo,
                    unidades: p.unidades,
                    precioUnitario: p.precioUnitario,
                    precioTotal: p.precioTotal
                })),
                total,
                pagado,
                metodoPago,
                observaciones: observaciones || undefined
            };

            const response = await fetch(`${API_BASE_URL}/ventas`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ventaData)
            });

            if (!response.ok) {
                throw new Error('Error al procesar la venta');
            }

            onVentaCompletada();
            onClose();
        } catch (error) {
            setError('Error al procesar la venta');
            console.error('Error:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Realizar Pago</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Cliente: {cliente?.nombreCompleto}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Código: {cliente?.codigo}
                    </Typography>
                </Box>

                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Productos
                    </Typography>
                    {productos.map((producto, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                            <Typography>
                                {producto.nombre} x {producto.unidades} = {producto.precioTotal.toFixed(2)}€
                            </Typography>
                        </Box>
                    ))}
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Total: {total.toFixed(2)}€
                    </Typography>
                </Paper>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel>Método de Pago</InputLabel>
                            <Select
                                value={metodoPago}
                                label="Método de Pago"
                                onChange={(e) => setMetodoPago(e.target.value as 'EFECTIVO' | 'TARJETA')}
                            >
                                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                                <MenuItem value="TARJETA">Tarjeta</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Cantidad Pagada"
                            type="number"
                            value={pagado}
                            onChange={(e) => setPagado(Number(e.target.value))}
                            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                        />
                    </Grid>
                    {pagado > total && (
                        <Grid item xs={12}>
                            <Typography color="success.main">
                                Cambio: {cambio.toFixed(2)}€
                            </Typography>
                        </Grid>
                    )}
                    {pagado < total && (
                        <Grid item xs={12}>
                            <Typography color="error">
                                Pendiente: {pendiente.toFixed(2)}€
                            </Typography>
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Observaciones"
                            multiline
                            rows={2}
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            error={pagado < total && !observaciones}
                            helperText={pagado < total && !observaciones ? "Las observaciones son obligatorias para pagos parciales" : ""}
                        />
                    </Grid>
                </Grid>

                {error && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {error}
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Confirmar Venta
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 