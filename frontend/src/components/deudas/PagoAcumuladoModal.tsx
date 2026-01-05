import React, { useState, useEffect } from 'react';
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
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper
} from '@mui/material';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { Venta } from '../ventas/types';
import { CurrencyInput } from '../common/CurrencyInput';
import { formatCurrency } from '../../utils/formatters';
import { TrabajadorSelector } from '../trabajadores/TrabajadorSelector';
import { UserRole } from '../../types/user';
import Swal from 'sweetalert2';

interface PagoAcumuladoModalProps {
    open: boolean;
    onClose: () => void;
    ventas: Venta[];
    onPagoCompletado: () => void;
}

export const PagoAcumuladoModal: React.FC<PagoAcumuladoModalProps> = ({
    open,
    onClose,
    ventas,
    onPagoCompletado
}) => {
    const { token, userRole } = useAuthStore();
    const [montoTotal, setMontoTotal] = useState<number>(0);
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
    const [observaciones, setObservaciones] = useState<string>('');
    const [trabajadorId, setTrabajadorId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && ventas.length > 0) {
            // Redondear todos los valores a 2 decimales
            const totalPendiente = ventas.reduce((sum, v) => {
                const totalRedondeado = Number(v.total.toFixed(2));
                const pagadoRedondeado = Number(v.pagado.toFixed(2));
                return sum + Number((totalRedondeado - pagadoRedondeado).toFixed(2));
            }, 0);
            setMontoTotal(Number(totalPendiente.toFixed(2)));
        }
    }, [open, ventas]);

    const handleSubmit = async () => {
        if (ventas.length === 0) return;

        // Validar trabajador si el usuario es TIENDA
        if (userRole === UserRole.TIENDA && !trabajadorId) {
            setError('Debe seleccionar un trabajador para realizar el pago');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Redondear todos los valores a 2 decimales
            const totalPendiente = ventas.reduce((sum, v) => {
                const totalRedondeado = Number(v.total.toFixed(2));
                const pagadoRedondeado = Number(v.pagado.toFixed(2));
                return sum + Number((totalRedondeado - pagadoRedondeado).toFixed(2));
            }, 0);
            const totalPendienteRedondeado = Number(totalPendiente.toFixed(2));
            const montoTotalRedondeado = Number(montoTotal.toFixed(2));

            if (montoTotalRedondeado <= 0) {
                setError('El monto debe ser mayor a 0');
                return;
            }

            if (montoTotalRedondeado > totalPendienteRedondeado + 0.01) {
                setError(`El monto no puede ser mayor al total pendiente (${totalPendienteRedondeado.toFixed(2)}€)`);
                return;
            }

            // Confirmar pago
            const result = await Swal.fire({
                title: '¿Confirmar pago acumulado?',
                html: `
                    <p>Se procesarán <strong>${ventas.length}</strong> deuda(s)</p>
                    <p>Total a pagar: <strong>${montoTotal.toFixed(2)}€</strong></p>
                    <p>Método: <strong>${metodoPago}</strong></p>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, pagar',
                cancelButtonText: 'Cancelar'
            });

            if (!result.isConfirmed) {
                return;
            }

            // Procesar pagos de forma secuencial
            const resultados = [];
            let montoRestante = montoTotalRedondeado;
            for (const venta of ventas) {
                const totalVentaRedondeado = Number(venta.total.toFixed(2));
                const pagadoVentaRedondeado = Number(venta.pagado.toFixed(2));
                const pendiente = Number((totalVentaRedondeado - pagadoVentaRedondeado).toFixed(2));
                const montoAPagar = Number(Math.min(pendiente, montoRestante).toFixed(2));
                montoRestante = Number((montoRestante - montoAPagar).toFixed(2));

                if (montoAPagar <= 0) continue;

                try {
                    const pagoData: any = {
                        pagado: montoAPagar,
                        metodoPago,
                        observaciones: observaciones || `Pago acumulado - ${ventas.length} deuda(s)`
                    };

                    // Añadir trabajadorId si el usuario es TIENDA
                    if (userRole === UserRole.TIENDA && trabajadorId) {
                        pagoData.trabajadorId = trabajadorId;
                    }

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
                        throw new Error(errorData.message || `Error al procesar pago de venta ${venta._id}`);
                    }

                    resultados.push({ ventaId: venta._id, monto: montoAPagar, exito: true });
                } catch (err) {
                    resultados.push({ 
                        ventaId: venta._id, 
                        monto: montoAPagar, 
                        exito: false, 
                        error: err instanceof Error ? err.message : 'Error desconocido' 
                    });
                }
            }

            const exitosos = resultados.filter(r => r.exito).length;
            const fallidos = resultados.filter(r => !r.exito).length;

            if (fallidos > 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Pago parcialmente completado',
                    html: `
                        <p>Se procesaron <strong>${exitosos}</strong> de <strong>${ventas.length}</strong> deuda(s)</p>
                        <p>Fallaron: <strong>${fallidos}</strong></p>
                    `,
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Pago completado',
                    text: `Se procesaron ${exitosos} deuda(s) correctamente`,
                });
            }

            onPagoCompletado();
            onClose();
        } catch (error) {
            console.error('Error detallado:', error);
            setError(error instanceof Error ? error.message : 'Error al procesar el pago acumulado');
        } finally {
            setLoading(false);
        }
    };

    if (ventas.length === 0) return null;

    const totalPendiente = ventas.reduce((sum, v) => sum + (v.total - v.pagado), 0);
    const cambio = metodoPago === 'EFECTIVO' && montoTotal > totalPendiente ? montoTotal - totalPendiente : 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Pago Acumulado de Deudas</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        {ventas.length} deuda(s) seleccionada(s)
                    </Typography>

                    {/* Tabla de deudas */}
                    <TableContainer component={Paper} sx={{ mt: 2, mb: 2, maxHeight: 300 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="right">Pagado</TableCell>
                                    <TableCell align="right">Pendiente</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ventas.map((venta) => {
                                    const totalVentaRedondeado = Number(venta.total.toFixed(2));
                                    const pagadoVentaRedondeado = Number(venta.pagado.toFixed(2));
                                    const pendiente = Number((totalVentaRedondeado - pagadoVentaRedondeado).toFixed(2));
                                    return (
                                        <TableRow key={venta._id}>
                                            <TableCell>
                                                {venta.nombreSocio} ({venta.codigoSocio})
                                            </TableCell>
                                            <TableCell align="right">{formatCurrency(totalVentaRedondeado)}</TableCell>
                                            <TableCell align="right">{formatCurrency(pagadoVentaRedondeado)}</TableCell>
                                            <TableCell align="right">
                                                <strong>{formatCurrency(pendiente)}</strong>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                <TableRow>
                                    <TableCell colSpan={3}><strong>TOTAL PENDIENTE</strong></TableCell>
                                    <TableCell align="right">
                                        <strong>{formatCurrency(totalPendienteRedondeado)}</strong>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                        Total Pendiente: {formatCurrency(totalPendienteRedondeado)}
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
                        label="Monto Total a Pagar"
                        value={montoTotal}
                        onChange={setMontoTotal}
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
                        placeholder="Observaciones para todas las deudas"
                    />

                    {metodoPago === 'EFECTIVO' && cambio > 0 && (
                        <Typography variant="h6" color="success.main" sx={{ mt: 2 }}>
                            Cambio a devolver: {formatCurrency(cambio)}
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
                <Button onClick={onClose} disabled={loading}>Cancelar</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading || montoTotalRedondeado <= 0 || montoTotalRedondeado > totalPendienteRedondeado + 0.01 || (userRole === UserRole.TIENDA && !trabajadorId)}
                >
                    {loading ? 'Procesando...' : `Pagar ${ventas.length} Deuda(s)`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};




