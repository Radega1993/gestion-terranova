import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Grid,
    TextField,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    Checkbox,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { Venta } from '../ventas/types';
import { PagoDeudaModal } from './PagoDeudaModal';
import { PagoAcumuladoModal } from './PagoAcumuladoModal';
import { DeudasPDF } from './DeudasPDF';
import { DevolucionModal } from '../devoluciones/DevolucionModal';
import PaymentIcon from '@mui/icons-material/Payment';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UndoIcon from '@mui/icons-material/Undo';
import { SocioSelector } from '../ventas/components/SocioSelector';
import { Cliente } from '../ventas/types';
import { formatCurrency } from '../../utils/formatters';

export const DeudasList: React.FC = () => {
    const { token } = useAuthStore();
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtros, setFiltros] = useState({
        fechaInicio: null as Date | null,
        fechaFin: null as Date | null,
        codigoCliente: '',
        estado: 'PENDIENTE' as 'PENDIENTE' | 'PAGADO_PARCIAL'
    });
    const [modalPagoOpen, setModalPagoOpen] = useState(false);
    const [modalDevolucionOpen, setModalDevolucionOpen] = useState(false);
    const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [showPDF, setShowPDF] = useState(false);
    const [ventasSeleccionadas, setVentasSeleccionadas] = useState<Set<string>>(new Set());
    const [modalPagoAcumuladoOpen, setModalPagoAcumuladoOpen] = useState(false);

    const fetchVentas = async () => {
        try {
            setLoading(true);
            let url = `${API_BASE_URL}/ventas/pendientes?`;

            if (filtros.fechaInicio) {
                url += `fechaInicio=${filtros.fechaInicio.toISOString()}&`;
            }
            if (filtros.fechaFin) {
                url += `fechaFin=${filtros.fechaFin.toISOString()}&`;
            }
            if (filtros.codigoCliente) {
                url += `codigoCliente=${filtros.codigoCliente}&`;
            }
            if (filtros.estado) {
                url += `estado=${filtros.estado}&`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar las deudas');
            }

            const data = await response.json();
            setVentas(data);
        } catch (error) {
            console.error('Error:', error);
            setError(error instanceof Error ? error.message : 'Error al cargar las deudas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVentas();
    }, [token]);

    const handleFiltroChange = (campo: string, valor: any) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const handleClienteSeleccionado = (cliente: Cliente | null) => {
        setClienteSeleccionado(cliente);
        handleFiltroChange('codigoCliente', cliente?.codigo || '');
    };

    const handleBuscar = () => {
        fetchVentas();
    };

    const handleLimpiarFiltros = () => {
        setFiltros({
            fechaInicio: null,
            fechaFin: null,
            codigoCliente: '',
            estado: 'PENDIENTE'
        });
        fetchVentas();
    };

    const handlePagarDeuda = (venta: Venta) => {
        setVentaSeleccionada(venta);
        setModalPagoOpen(true);
    };

    const handleDevolverVenta = (venta: Venta) => {
        setVentaSeleccionada(venta);
        setModalDevolucionOpen(true);
    };

    const handlePagoCompletado = () => {
        setVentasSeleccionadas(new Set());
        fetchVentas();
    };

    const handleDevolucionCompletada = () => {
        fetchVentas();
    };

    const handleToggleVenta = (ventaId: string) => {
        setVentasSeleccionadas(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ventaId)) {
                newSet.delete(ventaId);
            } else {
                newSet.add(ventaId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (ventasSeleccionadas.size === ventas.length) {
            setVentasSeleccionadas(new Set());
        } else {
            setVentasSeleccionadas(new Set(ventas.map(v => v._id)));
        }
    };

    const handlePagarAcumulado = () => {
        if (ventasSeleccionadas.size === 0) {
            setError('Debe seleccionar al menos una deuda para pagar');
            return;
        }
        setModalPagoAcumuladoOpen(true);
    };

    const ventasSeleccionadasArray = ventas.filter(v => ventasSeleccionadas.has(v._id));
    const totalPendienteAcumulado = ventasSeleccionadasArray.reduce((sum, v) => sum + (v.total - v.pagado), 0);

    const getEstadoChip = (estado: string) => {
        switch (estado) {
            case 'PAGADO_PARCIAL':
                return <Chip label="Pago Parcial" color="warning" />;
            case 'PENDIENTE':
                return <Chip label="Pendiente" color="error" />;
            default:
                return <Chip label={estado} />;
        }
    };

    const handleImprimirDeudas = () => {
        if (!clienteSeleccionado) return;

        // Obtener el código base del socio (sin el sufijo _XX)
        const codigoBase = clienteSeleccionado.codigo.split('_')[0];

        // Filtrar ventas que coincidan con el código base (socio principal y asociados)
        const ventasFiltradas = ventas.filter(venta =>
            venta.codigoSocio.startsWith(codigoBase)
        );

        if (ventasFiltradas.length === 0) {
            setError('No hay deudas para imprimir');
            return;
        }

        setShowPDF(true);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestión de Deudas
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                            <DatePicker
                                label="Fecha Inicio"
                                value={filtros.fechaInicio}
                                onChange={(date) => handleFiltroChange('fechaInicio', date)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                            <DatePicker
                                label="Fecha Fin"
                                value={filtros.fechaFin}
                                onChange={(date) => handleFiltroChange('fechaFin', date)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <SocioSelector
                            value={clienteSeleccionado}
                            onClienteSeleccionado={handleClienteSeleccionado}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleBuscar}
                                fullWidth
                                size="large"
                            >
                                Buscar
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleLimpiarFiltros}
                                fullWidth
                                size="large"
                            >
                                Limpiar
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PictureAsPdfIcon />}
                                onClick={handleImprimirDeudas}
                                disabled={!clienteSeleccionado}
                                fullWidth
                                size="large"
                            >
                                Imprimir
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Botón de pago acumulado */}
            {ventasSeleccionadas.size > 0 && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            {ventasSeleccionadas.size} deuda(s) seleccionada(s) - Total pendiente: {totalPendienteAcumulado.toFixed(2)}€
                        </Typography>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handlePagarAcumulado}
                            startIcon={<PaymentIcon />}
                        >
                            Pagar Todas ({ventasSeleccionadas.size})
                        </Button>
                    </Box>
                </Paper>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    indeterminate={ventasSeleccionadas.size > 0 && ventasSeleccionadas.size < ventas.length}
                                    checked={ventas.length > 0 && ventasSeleccionadas.size === ventas.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Pagado</TableCell>
                            <TableCell>Pendiente</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Observaciones</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ventas.map((venta) => (
                            <TableRow key={venta._id}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={ventasSeleccionadas.has(venta._id)}
                                        onChange={() => handleToggleVenta(venta._id)}
                                    />
                                </TableCell>
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
                                <TableCell>{venta.total.toFixed(2)}€</TableCell>
                                <TableCell>{venta.pagado.toFixed(2)}€</TableCell>
                                <TableCell>
                                    {(venta.total - venta.pagado).toFixed(2)}€
                                </TableCell>
                                <TableCell>
                                    {getEstadoChip(venta.estado)}
                                </TableCell>
                                <TableCell>
                                    {venta.observaciones || '-'}
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <IconButton
                                            color="primary"
                                            onClick={() => handlePagarDeuda(venta)}
                                            title="Pagar deuda"
                                        >
                                            <PaymentIcon />
                                        </IconButton>
                                        <IconButton
                                            color="secondary"
                                            onClick={() => handleDevolverVenta(venta)}
                                            title="Devolver productos"
                                        >
                                            <UndoIcon />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                        {ventas.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    No hay deudas pendientes
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <PagoDeudaModal
                open={modalPagoOpen}
                onClose={() => {
                    setModalPagoOpen(false);
                    setVentaSeleccionada(null);
                }}
                venta={ventaSeleccionada}
                onPagoCompletado={handlePagoCompletado}
            />

            <DevolucionModal
                open={modalDevolucionOpen}
                onClose={() => {
                    setModalDevolucionOpen(false);
                    setVentaSeleccionada(null);
                }}
                venta={ventaSeleccionada}
                onDevolucionCompletada={handleDevolucionCompletada}
            />

            <PagoAcumuladoModal
                open={modalPagoAcumuladoOpen}
                onClose={() => {
                    setModalPagoAcumuladoOpen(false);
                }}
                ventas={ventasSeleccionadasArray}
                onPagoCompletado={handlePagoCompletado}
            />

            <Dialog
                open={showPDF}
                onClose={() => setShowPDF(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        height: '90vh',
                        maxHeight: '90vh'
                    }
                }}
            >
                <DialogTitle>
                    Informe de Deudas
                </DialogTitle>
                <DialogContent sx={{
                    p: 0,
                    height: 'calc(90vh - 64px)',
                    '& > div': {
                        height: '100%'
                    }
                }}>
                    {clienteSeleccionado && (
                        <DeudasPDF
                            socio={{
                                codigo: clienteSeleccionado.codigo.split('_')[0],
                                nombre: clienteSeleccionado.nombreCompleto.split(' (')[0]
                            }}
                            ventas={ventas.filter(venta =>
                                venta.codigoSocio.startsWith(clienteSeleccionado.codigo.split('_')[0])
                            )}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
}; 