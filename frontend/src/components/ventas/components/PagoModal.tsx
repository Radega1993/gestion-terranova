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
import { CurrencyInput } from '../../../components/common/CurrencyInput';
import { formatCurrency } from '../../../utils/formatters';
import { TrabajadorSelector } from '../../../components/trabajadores/TrabajadorSelector';
import { UserRole } from '../../../types/user';

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
    const { token, userRole } = useAuthStore();
    const [pagado, setPagado] = useState<number>(0);
    const [observaciones, setObservaciones] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
    const [trabajadorId, setTrabajadorId] = useState<string | null>(null);

    // Redondear a 2 decimales para evitar problemas de precisión
    const total = Number(productos.reduce((sum, producto) => sum + producto.precioTotal, 0).toFixed(2));
    const pagadoRedondeado = Number(pagado.toFixed(2));
    const pendiente = Number((total - pagadoRedondeado).toFixed(2));
    const cambio = pagadoRedondeado > total ? Number((pagadoRedondeado - total).toFixed(2)) : 0;
    
    // Función helper para comparar números con precisión de 2 decimales
    const esPagoCompleto = pagadoRedondeado >= total;
    const esPagoParcial = pagadoRedondeado < total && pagadoRedondeado > 0;

    const handleSubmit = async () => {
        try {
            if (!cliente) {
                setError('Debe seleccionar un cliente');
                return;
            }

            // Si el usuario es TIENDA, trabajadorId es obligatorio
            if (userRole === UserRole.TIENDA && !trabajadorId) {
                setError('Debe seleccionar un trabajador para realizar la venta');
                return;
            }

            if (!esPagoCompleto && !observaciones.trim()) {
                setError('Las observaciones son obligatorias para pagos parciales');
                return;
            }

            const ventaData: any = {
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
                pagado: pagadoRedondeado,
                metodoPago,
                observaciones: observaciones.trim() || undefined
            };

            // Añadir trabajadorId si el usuario es TIENDA
            if (userRole === UserRole.TIENDA && trabajadorId) {
                ventaData.trabajadorId = trabajadorId;
            }

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
                                {producto.nombre} x {producto.unidades} = {formatCurrency(producto.precioTotal)}€
                            </Typography>
                        </Box>
                    ))}
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Total: {formatCurrency(total)}€
                    </Typography>
                </Paper>

                {userRole === UserRole.TIENDA && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Seleccionar Trabajador
                        </Typography>
                        <TrabajadorSelector
                            value={trabajadorId || undefined}
                            onChange={setTrabajadorId}
                            required={true}
                            variant="buttons"
                        />
                    </Box>
                )}

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
                        <CurrencyInput
                            fullWidth
                            label="Cantidad Pagada"
                            value={pagado}
                            onChange={setPagado}
                        />
                    </Grid>
                    {cambio > 0 && (
                        <Grid item xs={12}>
                            <Typography color="success.main">
                                Cambio: {formatCurrency(cambio)}€
                            </Typography>
                        </Grid>
                    )}
                    {pendiente > 0 && (
                        <Grid item xs={12}>
                            <Typography color="error">
                                Pendiente: {formatCurrency(pendiente)}€
                            </Typography>
                        </Grid>
                    )}
                    {esPagoCompleto && pendiente === 0 && (
                        <Grid item xs={12}>
                            <Typography color="success.main">
                                Pago completo
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
                            error={!esPagoCompleto && !observaciones.trim()}
                            helperText={!esPagoCompleto && !observaciones.trim() ? "Las observaciones son obligatorias para pagos parciales" : ""}
                            required={!esPagoCompleto}
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
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={!esPagoCompleto && !observaciones.trim()}
                >
                    Confirmar Venta
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 