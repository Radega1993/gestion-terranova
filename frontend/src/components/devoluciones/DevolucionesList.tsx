import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    CircularProgress,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Visibility as VisibilityIcon
} from '@mui/icons-material';
import { devolucionesService, Devolucion, DevolucionesFilters } from '../../services/devoluciones';
import { formatCurrency } from '../../utils/formatters';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types/user';
import Swal from 'sweetalert2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

export const DevolucionesList: React.FC = () => {
    const { user } = useAuthStore();
    const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtros, setFiltros] = useState<DevolucionesFilters>({});
    const [selectedDevolucion, setSelectedDevolucion] = useState<Devolucion | null>(null);
    const [openDetailDialog, setOpenDetailDialog] = useState(false);

    useEffect(() => {
        fetchDevoluciones();
    }, []);

    const fetchDevoluciones = async () => {
        try {
            setLoading(true);
            const data = await devolucionesService.getAll(filtros);
            setDevoluciones(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar devoluciones');
        } finally {
            setLoading(false);
        }
    };

    const handleFiltroChange = (campo: keyof DevolucionesFilters, valor: any) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const handleBuscar = () => {
        fetchDevoluciones();
    };

    const handleLimpiarFiltros = () => {
        setFiltros({});
        fetchDevoluciones();
    };

    const handleProcesar = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Procesar devolución?',
            text: 'Esto actualizará el stock del inventario. ¿Está seguro?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, procesar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await devolucionesService.procesar(id);
                Swal.fire('Éxito', 'Devolución procesada correctamente', 'success');
                fetchDevoluciones();
            } catch (err: any) {
                Swal.fire('Error', err.response?.data?.message || 'Error al procesar la devolución', 'error');
            }
        }
    };

    const handleCancelar = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Cancelar devolución?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No'
        });

        if (result.isConfirmed) {
            try {
                await devolucionesService.cancelar(id);
                Swal.fire('Éxito', 'Devolución cancelada', 'success');
                fetchDevoluciones();
            } catch (err: any) {
                Swal.fire('Error', err.response?.data?.message || 'Error al cancelar la devolución', 'error');
            }
        }
    };

    const handleEliminar = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Eliminar devolución?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await devolucionesService.delete(id);
                Swal.fire('Éxito', 'Devolución eliminada', 'success');
                fetchDevoluciones();
            } catch (err: any) {
                Swal.fire('Error', err.response?.data?.message || 'Error al eliminar la devolución', 'error');
            }
        }
    };

    const handleVerDetalle = async (id: string) => {
        try {
            const devolucion = await devolucionesService.getById(id);
            setSelectedDevolucion(devolucion);
            setOpenDetailDialog(true);
        } catch (err) {
            Swal.fire('Error', 'Error al cargar los detalles de la devolución', 'error');
        }
    };

    const getEstadoChip = (estado: string) => {
        switch (estado) {
            case 'PROCESADA':
                return <Chip label="Procesada" color="success" size="small" />;
            case 'PENDIENTE':
                return <Chip label="Pendiente" color="warning" size="small" />;
            case 'CANCELADA':
                return <Chip label="Cancelada" color="error" size="small" />;
            default:
                return <Chip label={estado} size="small" />;
        }
    };

    if (loading && devoluciones.length === 0) {
        return (
            <Container>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Devoluciones</Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Filtros
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                            <DatePicker
                                label="Fecha Inicio"
                                value={filtros.fechaInicio ? new Date(filtros.fechaInicio) : null}
                                onChange={(date) => handleFiltroChange('fechaInicio', date?.toISOString())}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                            <DatePicker
                                label="Fecha Fin"
                                value={filtros.fechaFin ? new Date(filtros.fechaFin) : null}
                                onChange={(date) => handleFiltroChange('fechaFin', date?.toISOString())}
                                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            label="ID Venta"
                            value={filtros.ventaId || ''}
                            onChange={(e) => handleFiltroChange('ventaId', e.target.value || undefined)}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button variant="contained" onClick={handleBuscar}>
                                Buscar
                            </Button>
                            <Button variant="outlined" onClick={handleLimpiarFiltros}>
                                Limpiar
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabla de devoluciones */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Venta</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Productos</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Método</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Usuario</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {devoluciones.map((devolucion) => {
                            const venta = typeof devolucion.venta === 'string' 
                                ? null 
                                : devolucion.venta;
                            const usuario = typeof devolucion.usuario === 'string'
                                ? null
                                : devolucion.usuario;

                            return (
                                <TableRow key={devolucion._id}>
                                    <TableCell>
                                        {new Date(devolucion.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {venta ? `#${venta._id.slice(-6)}` : devolucion.venta}
                                    </TableCell>
                                    <TableCell>
                                        {venta ? `${venta.nombreSocio} (${venta.codigoSocio})` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {devolucion.productos.length} producto(s)
                                    </TableCell>
                                    <TableCell>{formatCurrency(devolucion.totalDevolucion)}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={devolucion.metodoDevolucion} 
                                            size="small"
                                            color={devolucion.metodoDevolucion === 'EFECTIVO' ? 'default' : 'primary'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {getEstadoChip(devolucion.estado)}
                                    </TableCell>
                                    <TableCell>
                                        {usuario ? usuario.username : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleVerDetalle(devolucion._id)}
                                            color="primary"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                        {devolucion.estado === 'PENDIENTE' && (user?.role === UserRole.ADMINISTRADOR || user?.role === UserRole.JUNTA) && (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleProcesar(devolucion._id)}
                                                    color="success"
                                                >
                                                    <CheckCircleIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleCancelar(devolucion._id)}
                                                    color="error"
                                                >
                                                    <CancelIcon />
                                                </IconButton>
                                            </>
                                        )}
                                        {user?.role === UserRole.ADMINISTRADOR && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEliminar(devolucion._id)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {devoluciones.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                        No hay devoluciones registradas
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog de detalles */}
            <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Detalles de la Devolución</DialogTitle>
                <DialogContent>
                    {selectedDevolucion && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Estado:</strong> {getEstadoChip(selectedDevolucion.estado)}
                            </Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Total:</strong> {formatCurrency(selectedDevolucion.totalDevolucion)}
                            </Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Método:</strong> {selectedDevolucion.metodoDevolucion}
                            </Typography>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Motivo:</strong> {selectedDevolucion.motivo}
                            </Typography>
                            {selectedDevolucion.observaciones && (
                                <Typography variant="subtitle1" gutterBottom>
                                    <strong>Observaciones:</strong> {selectedDevolucion.observaciones}
                                </Typography>
                            )}

                            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                Productos Devueltos
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Producto</TableCell>
                                            <TableCell align="right">Cantidad</TableCell>
                                            <TableCell align="right">Precio Unitario</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedDevolucion.productos.map((producto, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{producto.nombre}</TableCell>
                                                <TableCell align="right">{producto.cantidad}</TableCell>
                                                <TableCell align="right">{formatCurrency(producto.precioUnitario)}</TableCell>
                                                <TableCell align="right">{formatCurrency(producto.total)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDetailDialog(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};







