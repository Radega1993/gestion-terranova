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
import { CurrencyInput } from '../common/CurrencyInput';
import { formatCurrency } from '../../utils/formatters';
import { TrabajadorSelector } from '../trabajadores/TrabajadorSelector';
import { UserRole } from '../../types/user';

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
    const { token, userRole } = useAuthStore();
    const [pagado, setPagado] = useState<number>(0);
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
    const [observaciones, setObservaciones] = useState<string>('');
    const [trabajadorId, setTrabajadorId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!venta) return;

        // Validar trabajador si el usuario es TIENDA
        if (userRole === UserRole.TIENDA && !trabajadorId) {
            setError('Debe seleccionar un trabajador para realizar el pago');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Redondear el monto a pagar a 2 decimales
            const pagadoRedondeado = Number(pagado.toFixed(2));
            
            // Si el método de pago es EFECTIVO y se paga más de lo debido, ajustar el monto a pagar al pendiente
            // El cambio se maneja en el frontend, pero el backend solo registra el monto pendiente
            const montoAPagar = metodoPago === 'EFECTIVO' && pagadoRedondeado > pendiente 
                ? pendiente 
                : pagadoRedondeado;

            const pagoData: any = {
                pagado: montoAPagar,
                metodoPago,
                observaciones
            };

            // Añadir trabajadorId si el usuario es TIENDA
            if (userRole === UserRole.TIENDA && trabajadorId) {
                pagoData.trabajadorId = trabajadorId;
            }

            // Redondear todos los valores a 2 decimales para evitar problemas de precisión
            const totalRedondeadoLog = Number(venta.total.toFixed(2));
            const yaPagadoRedondeadoLog = Number(venta.pagado.toFixed(2));
            const pendienteRedondeadoLog = Number((totalRedondeadoLog - yaPagadoRedondeadoLog).toFixed(2));

            const cambioLog = metodoPago === 'EFECTIVO' && pagadoRedondeado > pendienteRedondeadoLog 
                ? Number((pagadoRedondeado - pendienteRedondeadoLog).toFixed(2)) 
                : 0;

            console.log('Datos del pago:', {
                ventaId: venta._id,
                totalOriginal: totalRedondeadoLog,
                yaPagado: yaPagadoRedondeadoLog,
                pendiente: pendienteRedondeadoLog,
                montoRecibido: pagadoRedondeado,
                montoAPagar: montoAPagar,
                cambio: cambioLog,
                metodoPago,
                observaciones,
                trabajadorId
            });

            const response = await fetch(`${API_BASE_URL}/ventas/${venta._id}/pago`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pagoData),
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

    // Redondear todos los valores a 2 decimales
    const totalRedondeado = Number(venta.total.toFixed(2));
    const yaPagadoRedondeado = Number(venta.pagado.toFixed(2));
    const pendiente = Number((totalRedondeado - yaPagadoRedondeado).toFixed(2));
    const pagadoRedondeado = Number(pagado.toFixed(2));
    const cambio = metodoPago === 'EFECTIVO' && pagadoRedondeado > pendiente 
        ? Number((pagadoRedondeado - pendiente).toFixed(2)) 
        : 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Pagar Deuda</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Cliente: {venta.nombreSocio} ({venta.codigoSocio})
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Total Original: {formatCurrency(totalRedondeado)}€
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Ya Pagado: {formatCurrency(yaPagadoRedondeado)}€
                    </Typography>
                    <Typography variant="h6" color="primary" gutterBottom>
                        Pendiente: {formatCurrency(pendiente)}€
                    </Typography>

                    {userRole === UserRole.TIENDA && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Seleccionar Trabajador
                            </Typography>
                            <TrabajadorSelector
                                value={trabajadorId || undefined}
                                onChange={setTrabajadorId}
                                required={true}
                                variant="select"
                            />
                        </Box>
                    )}

                    <CurrencyInput
                        fullWidth
                        label="Cantidad a Pagar"
                        value={pagado}
                        onChange={setPagado}
                        margin="normal"
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
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                            <Typography variant="h6" color="success.dark" gutterBottom>
                                💰 Resumen del Pago
                            </Typography>
                            <Typography variant="body1" color="text.primary">
                                <strong>Monto recibido:</strong> {formatCurrency(pagadoRedondeado)}€
                            </Typography>
                            <Typography variant="body1" color="text.primary">
                                <strong>Monto a pagar:</strong> {formatCurrency(pendiente)}€
                            </Typography>
                            <Typography variant="h6" color="success.dark" sx={{ mt: 1 }}>
                                <strong>Cambio a devolver:</strong> {formatCurrency(cambio)}€
                            </Typography>
                        </Box>
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
                    disabled={loading || pagadoRedondeado <= 0 || (metodoPago === 'TARJETA' && pagadoRedondeado > pendiente + 0.01) || (userRole === UserRole.TIENDA && !trabajadorId)}
                >
                    {loading ? 'Procesando...' : 'Pagar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 