import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Autocomplete,
    Grid,
    Typography,
    Box,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config';
import { authenticatedFetchJson } from '../../utils/apiHelper';
import { useAuthStore } from '../../stores/authStore';
import { ProcesarPagoCambioModal } from './ProcesarPagoCambioModal';
import Swal from 'sweetalert2';

interface ProductoVenta {
    nombre: string;
    categoria?: string;
    unidades: number;
    precioUnitario: number;
    precioTotal: number;
}

interface Venta {
    _id: string;
    codigoSocio: string;
    nombreSocio: string;
    productos: ProductoVenta[];
    total: number;
    pagado: number;
    estado: string;
}

interface Product {
    _id: string;
    nombre: string;
    tipo: string;
    unidad_medida: string;
    stock_actual: number;
    precio_compra_unitario: number;
}

interface Trabajador {
    _id: string;
    nombre: string;
    apellidos: string;
    identificador: string;
}

interface CambioModalProps {
    open: boolean;
    onClose: () => void;
    venta: Venta;
    onCambioRealizado: () => void;
}

export const CambioModal: React.FC<CambioModalProps> = ({
    open,
    onClose,
    venta,
    onCambioRealizado
}) => {
    const { user } = useAuthStore();
    const [productoOriginal, setProductoOriginal] = useState<ProductoVenta | null>(null);
    const [productoNuevo, setProductoNuevo] = useState<Product | null>(null);
    const [cantidadOriginal, setCantidadOriginal] = useState<number>(1);
    const [cantidadNueva, setCantidadNueva] = useState<number>(1);
    const [motivo, setMotivo] = useState<string>('');
    const [observaciones, setObservaciones] = useState<string>('');
    const [trabajadorId, setTrabajadorId] = useState<string>('');
    const [cambioCreado, setCambioCreado] = useState<any>(null);
    const [mostrarModalPago, setMostrarModalPago] = useState(false);

    const queryClient = useQueryClient();

    // Obtener productos disponibles
    const { data: productos = [] } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: () => authenticatedFetchJson<Product[]>(`${API_BASE_URL}/inventory`),
        enabled: open
    });

    // Obtener trabajadores si el usuario es TIENDA
    const { data: trabajadores = [] } = useQuery<Trabajador[]>({
        queryKey: ['trabajadores'],
        queryFn: () => authenticatedFetchJson<Trabajador[]>(`${API_BASE_URL}/trabajadores`),
        enabled: open && user?.role === 'TIENDA'
    });

    // Resetear formulario al cerrar
    useEffect(() => {
        if (!open) {
            setProductoOriginal(null);
            setProductoNuevo(null);
            setCantidadOriginal(1);
            setCantidadNueva(1);
            setMotivo('');
            setObservaciones('');
            setTrabajadorId('');
            setCambioCreado(null);
            setMostrarModalPago(false);
        }
    }, [open]);

    // Calcular diferencia de precio
    const diferenciaPrecio = productoOriginal && productoNuevo
        ? Number((productoNuevo.precio_compra_unitario * cantidadNueva - productoOriginal.precioUnitario * cantidadOriginal).toFixed(2))
        : 0;

    // Mutación para crear el cambio
    const cambioMutation = useMutation({
        mutationFn: async (data: any) => {
            return authenticatedFetchJson(`${API_BASE_URL}/cambios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        },
        onSuccess: (data) => {
            // Si no hay diferencia de precio, cerrar directamente
            if (diferenciaPrecio === 0) {
                Swal.fire({
                    icon: 'success',
                    title: 'Cambio realizado',
                    text: 'El cambio se ha realizado correctamente',
                    timer: 3000
                });
                onCambioRealizado();
            } else {
                // Si hay diferencia, guardar el cambio y mostrar modal de pago
                setCambioCreado(data);
                setMostrarModalPago(true);
            }
        },
        onError: (error: any) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al realizar el cambio'
            });
        }
    });

    const handleRealizarCambio = () => {
        if (!productoOriginal || !productoNuevo) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Debe seleccionar el producto original y el producto nuevo'
            });
            return;
        }

        if (cantidadOriginal > productoOriginal.unidades) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `La cantidad a cambiar (${cantidadOriginal}) excede la cantidad vendida (${productoOriginal.unidades})`
            });
            return;
        }

        if (productoNuevo.stock_actual < cantidadNueva) {
            Swal.fire({
                icon: 'error',
                title: 'Stock insuficiente',
                text: `Stock disponible: ${productoNuevo.stock_actual}, cantidad solicitada: ${cantidadNueva}`
            });
            return;
        }

        const cambioData: any = {
            ventaId: venta._id,
            productoOriginal: {
                nombre: productoOriginal.nombre,
                categoria: productoOriginal.categoria,
                cantidad: cantidadOriginal,
                precioUnitario: productoOriginal.precioUnitario,
                total: Number((productoOriginal.precioUnitario * cantidadOriginal).toFixed(2))
            },
            productoNuevo: {
                nombre: productoNuevo.nombre,
                categoria: productoNuevo.tipo,
                cantidad: cantidadNueva,
                precioUnitario: productoNuevo.precio_compra_unitario,
                total: Number((productoNuevo.precio_compra_unitario * cantidadNueva).toFixed(2))
            },
            motivo: motivo || 'Cambio de producto',
            observaciones: observaciones || undefined
        };

        if (user?.role === 'TIENDA' && trabajadorId) {
            cambioData.trabajadorId = trabajadorId;
        }

        cambioMutation.mutate(cambioData);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Realizar Cambio de Producto</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            <strong>Venta:</strong> {venta.nombreSocio} ({venta.codigoSocio})<br />
                            <strong>Total:</strong> {venta.total.toFixed(2)}€ | <strong>Pagado:</strong> {venta.pagado.toFixed(2)}€
                        </Typography>
                    </Alert>

                    <Grid container spacing={3}>
                        {/* Producto Original */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Producto Original (a devolver)
                            </Typography>
                            <Autocomplete
                                options={venta.productos}
                                getOptionLabel={(option) => `${option.nombre} (${option.unidades} unidades)`}
                                value={productoOriginal}
                                onChange={(_, newValue) => {
                                    setProductoOriginal(newValue);
                                    if (newValue) {
                                        setCantidadOriginal(Math.min(1, newValue.unidades));
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Seleccionar producto" fullWidth />
                                )}
                            />
                            {productoOriginal && (
                                <TextField
                                    label="Cantidad a cambiar"
                                    type="number"
                                    value={cantidadOriginal}
                                    onChange={(e) => {
                                        const cantidad = parseInt(e.target.value) || 1;
                                        setCantidadOriginal(Math.min(cantidad, productoOriginal.unidades));
                                    }}
                                    inputProps={{ min: 1, max: productoOriginal.unidades }}
                                    fullWidth
                                    sx={{ mt: 2 }}
                                />
                            )}
                            {productoOriginal && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Total: {(productoOriginal.precioUnitario * cantidadOriginal).toFixed(2)}€
                                </Typography>
                            )}
                        </Grid>

                        {/* Producto Nuevo */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                                Producto Nuevo (a entregar)
                            </Typography>
                            <Autocomplete
                                options={productos.filter(p => p.activo !== false)}
                                getOptionLabel={(option) => `${option.nombre} (Stock: ${option.stock_actual})`}
                                value={productoNuevo}
                                onChange={(_, newValue) => {
                                    setProductoNuevo(newValue);
                                    if (newValue) {
                                        setCantidadNueva(Math.min(1, newValue.stock_actual));
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Seleccionar producto nuevo" fullWidth />
                                )}
                            />
                            {productoNuevo && (
                                <TextField
                                    label="Cantidad"
                                    type="number"
                                    value={cantidadNueva}
                                    onChange={(e) => {
                                        const cantidad = parseInt(e.target.value) || 1;
                                        setCantidadNueva(Math.min(cantidad, productoNuevo.stock_actual));
                                    }}
                                    inputProps={{ min: 1, max: productoNuevo.stock_actual }}
                                    fullWidth
                                    sx={{ mt: 2 }}
                                />
                            )}
                            {productoNuevo && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Total: {(productoNuevo.precio_compra_unitario * cantidadNueva).toFixed(2)}€
                                </Typography>
                            )}
                        </Grid>

                        {/* Diferencia de Precio */}
                        {productoOriginal && productoNuevo && (
                            <Grid item xs={12}>
                                <Alert
                                    severity={diferenciaPrecio > 0 ? 'warning' : diferenciaPrecio < 0 ? 'info' : 'success'}
                                >
                                    <Typography variant="body1">
                                        <strong>Diferencia de precio:</strong>{' '}
                                        {diferenciaPrecio > 0
                                            ? `+${diferenciaPrecio.toFixed(2)}€ (el cliente debe pagar más)`
                                            : diferenciaPrecio < 0
                                                ? `${diferenciaPrecio.toFixed(2)}€ (se debe devolver al cliente)`
                                                : '0.00€ (mismo precio)'}
                                    </Typography>
                                </Alert>
                            </Grid>
                        )}

                        {/* Motivo */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Motivo del cambio"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                fullWidth
                                placeholder="Ej: Error en la venta, cliente cambió de opinión"
                            />
                        </Grid>

                        {/* Trabajador (solo si es TIENDA) */}
                        {user?.role === 'TIENDA' && (
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Trabajador que realiza el cambio</InputLabel>
                                    <Select
                                        value={trabajadorId}
                                        onChange={(e) => setTrabajadorId(e.target.value)}
                                        label="Trabajador que realiza el cambio"
                                    >
                                        <MenuItem value="">Seleccionar trabajador</MenuItem>
                                        {trabajadores.map((trabajador) => (
                                            <MenuItem key={trabajador._id} value={trabajador._id}>
                                                {trabajador.nombre} {trabajador.apellidos} ({trabajador.identificador})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}

                        {/* Observaciones */}
                        <Grid item xs={12}>
                            <TextField
                                label="Observaciones"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={cambioMutation.isPending}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleRealizarCambio}
                    variant="contained"
                    disabled={!productoOriginal || !productoNuevo || cambioMutation.isPending}
                    startIcon={cambioMutation.isPending ? <CircularProgress size={20} /> : null}
                >
                    Realizar Cambio
                </Button>
            </DialogActions>

            {/* Modal para procesar pago/devolución */}
            {cambioCreado && (
                <ProcesarPagoCambioModal
                    open={mostrarModalPago}
                    onClose={() => {
                        setMostrarModalPago(false);
                        setCambioCreado(null);
                        onCambioRealizado();
                    }}
                    cambioId={cambioCreado._id}
                    diferenciaPrecio={diferenciaPrecio}
                    trabajadores={trabajadores}
                    onPagoProcesado={() => {
                        setMostrarModalPago(false);
                        setCambioCreado(null);
                        onCambioRealizado();
                    }}
                />
            )}
        </Dialog>
    );
};

