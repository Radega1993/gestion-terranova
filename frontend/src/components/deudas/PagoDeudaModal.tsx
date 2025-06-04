import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert
} from '@mui/material';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { Venta } from '../ventas/types';

interface PagoDeudaModalProps {
    open: boolean;
    onClose: () => void;
    venta: Venta | null;
    onPagoCompletado: () => void;
}

export const PagoDeudaModal: React.FC<PagoDeudaModalProps> = ({
    open,
    onClose,
    venta,
    onPagoCompletado
}) => {
    const { token } = useAuthStore();
    const [pagado, setPagado] = useState<number>(0);
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
    const [observaciones, setObservaciones] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!venta) return;

        try {
            setLoading(true);
            setError(null);

            console.log('Datos del pago:', {
                ventaId: venta._id,
                totalOriginal: venta.total,
                yaPagado: venta.pagado,
                pendiente: venta.total - venta.pagado,
                montoAPagar: pagado,
                metodoPago,
                observaciones
            });

            const response = await fetch(`${API_BASE_URL}/ventas/${venta._id}/pago`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pagado,
                    metodoPago,
                    observaciones
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error en la respuesta:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData
                });
                throw new Error(errorData.message || 'Error al procesar el pago');
            }

            const responseData = await response.json();
            console.log('Respuesta exitosa:', responseData);

            onPagoCompletado();
            onClose();
        } catch (error) {
            console.error('Error detallado:', error);
            setError(error instanceof Error ? error.message : 'Error al procesar el pago');
        } finally {
            setLoading(false);
        }
    };

    if (!venta) return null;

    const pendiente = venta.total - venta.pagado;
    const cambio = metodoPago === 'EFECTIVO' && pagado > pendiente ? pagado - pendiente : 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Pagar Deuda</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Cliente: {venta.nombreSocio} ({venta.codigoSocio})
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Total Original: {venta.total.toFixed(2)}€
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Ya Pagado: {venta.pagado.toFixed(2)}€
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                        Pendiente: {pendiente.toFixed(2)}€
                    </Typography>

                    <TextField
                        fullWidth
                        label="Cantidad a Pagar"
                        type="number"
                        value={pagado}
                        onChange={(e) => setPagado(Number(e.target.value))}
                        margin="normal"
                        inputProps={{ min: 0, step: 0.01 }}
                    />

                    <FormControl fullWidth margin="normal">
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

                    <TextField
                        fullWidth
                        label="Observaciones"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        margin="normal"
                        multiline
                        rows={2}
                    />

                    {metodoPago === 'EFECTIVO' && cambio > 0 && (
                        <Typography variant="h6" color="success.main" sx={{ mt: 2 }}>
                            Cambio a devolver: {cambio.toFixed(2)}€
                        </Typography>
                    )}

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || pagado <= 0 || pagado > pendiente + 0.01}
                >
                    {loading ? 'Procesando...' : 'Pagar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 