import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Typography,
    Alert,
    Box,
    CircularProgress
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config';
import { authenticatedFetchJson } from '../../utils/apiHelper';
import { useAuthStore } from '../../stores/authStore';
import Swal from 'sweetalert2';

interface Trabajador {
    _id: string;
    nombre: string;
    apellidos: string;
    identificador: string;
}

interface ProcesarPagoCambioModalProps {
    open: boolean;
    onClose: () => void;
    cambioId: string;
    diferenciaPrecio: number;
    trabajadores?: Trabajador[];
    onPagoProcesado: () => void;
}

export const ProcesarPagoCambioModal: React.FC<ProcesarPagoCambioModalProps> = ({
    open,
    onClose,
    cambioId,
    diferenciaPrecio,
    trabajadores = [],
    onPagoProcesado
}) => {
    const { user } = useAuthStore();
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA'>('EFECTIVO');
    const [trabajadorId, setTrabajadorId] = useState<string>('');
    const [observaciones, setObservaciones] = useState<string>('');

    const queryClient = useQueryClient();

    // Resetear formulario al cerrar
    useEffect(() => {
        if (!open) {
            setMetodoPago('EFECTIVO');
            setTrabajadorId('');
            setObservaciones('');
        }
    }, [open]);

    // Mutación para procesar el pago
    const procesarPagoMutation = useMutation({
        mutationFn: async (data: any) => {
            return authenticatedFetchJson(`${API_BASE_URL}/cambios/${cambioId}/procesar-pago`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        },
        onSuccess: () => {
            Swal.fire({
                icon: 'success',
                title: diferenciaPrecio > 0 ? 'Pago procesado' : 'Devolución procesada',
                text: diferenciaPrecio > 0
                    ? `Se ha registrado el pago de ${diferenciaPrecio.toFixed(2)}€`
                    : `Se ha registrado la devolución de ${Math.abs(diferenciaPrecio).toFixed(2)}€`,
                timer: 3000
            });
            queryClient.invalidateQueries({ queryKey: ['ventas-del-dia'] });
            queryClient.invalidateQueries({ queryKey: ['recaudaciones'] });
            onPagoProcesado();
        },
        onError: (error: any) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al procesar el pago/devolución'
            });
        }
    });

    const handleProcesarPago = () => {
        if (user?.role === 'TIENDA' && !trabajadorId) {
            Swal.fire({
                icon: 'warning',
                title: 'Trabajador requerido',
                text: 'Debe seleccionar un trabajador para procesar el pago'
            });
            return;
        }

        const pagoData: any = {
            metodoPago,
            observaciones: observaciones || undefined
        };

        if (user?.role === 'TIENDA' && trabajadorId) {
            pagoData.trabajadorId = trabajadorId;
        }

        procesarPagoMutation.mutate(pagoData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {diferenciaPrecio > 0 ? 'Procesar Pago del Cambio' : 'Procesar Devolución del Cambio'}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <Alert 
                        severity={diferenciaPrecio > 0 ? 'warning' : 'info'} 
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="body1">
                            {diferenciaPrecio > 0
                                ? `El cliente debe pagar ${diferenciaPrecio.toFixed(2)}€ adicionales`
                                : `Se debe devolver ${Math.abs(diferenciaPrecio).toFixed(2)}€ al cliente`}
                        </Typography>
                    </Alert>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>Método de {diferenciaPrecio > 0 ? 'Pago' : 'Devolución'}</InputLabel>
                        <Select
                            value={metodoPago}
                            onChange={(e) => setMetodoPago(e.target.value as 'EFECTIVO' | 'TARJETA')}
                            label={`Método de ${diferenciaPrecio > 0 ? 'Pago' : 'Devolución'}`}
                        >
                            <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                            <MenuItem value="TARJETA">Tarjeta</MenuItem>
                        </Select>
                    </FormControl>

                    {user?.role === 'TIENDA' && (
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>
                                Trabajador que {diferenciaPrecio > 0 ? 'cobra' : 'devuelve'}
                            </InputLabel>
                            <Select
                                value={trabajadorId}
                                onChange={(e) => setTrabajadorId(e.target.value)}
                                label={`Trabajador que ${diferenciaPrecio > 0 ? 'cobra' : 'devuelve'}`}
                            >
                                <MenuItem value="">Seleccionar trabajador</MenuItem>
                                {trabajadores.map((trabajador) => (
                                    <MenuItem key={trabajador._id} value={trabajador._id}>
                                        {trabajador.nombre} {trabajador.apellidos} ({trabajador.identificador})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <TextField
                        label="Observaciones"
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={procesarPagoMutation.isPending}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleProcesarPago}
                    variant="contained"
                    disabled={procesarPagoMutation.isPending || (user?.role === 'TIENDA' && !trabajadorId)}
                    startIcon={procesarPagoMutation.isPending ? <CircularProgress size={20} /> : null}
                >
                    {diferenciaPrecio > 0 ? 'Procesar Pago' : 'Procesar Devolución'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};


