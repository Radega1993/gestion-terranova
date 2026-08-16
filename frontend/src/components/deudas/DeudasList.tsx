import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Grid,
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
import { authenticatedFetchJson } from '../../utils/apiHelper';
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
import { roundMoney } from '../../utils/formatters';

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
    const [familiaSeleccionada, setFamiliaSeleccionada] = useState<string | null>(null);
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
            // No enviar estado si es 'PENDIENTE' para obtener todas las pendientes (PENDIENTE y PAGADO_PARCIAL)
            // Solo enviar si se quiere filtrar específicamente por PAGADO_PARCIAL
            if (filtros.estado && filtros.estado !== 'PENDIENTE') {
                url += `estado=${filtros.estado}&`;
            }

            const data = await authenticatedFetchJson<Venta[]>(url);
            setVentas(data);
            setError(null);
        } catch (error) {
            console.error('Error:', error);
            setError(error instanceof Error ? error.message : 'Error al cargar las deudas');
            setVentas([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchVentas();
        }
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
        setFamiliaSeleccionada(cliente?.codigo.split('_')[0] || null);
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

    const isFiltradoPorSocio = Boolean(filtros.codigoCliente?.trim());

    type VentaGroup = Venta & {
        originalIds?: string[];
        productos?: Venta['productos'];
        subVentas?: Venta[];
    };

    const getTrabajadorLabelFromVenta = (venta: Venta): string => {
        if (venta.trabajador && typeof venta.trabajador === 'object') {
            const { nombre, identificador } = venta.trabajador;
            if (nombre && identificador) {
                return `${nombre} (${identificador})`;
            }
            return nombre || identificador || '-';
        }
        if (venta.usuario && typeof venta.usuario === 'object') {
            return venta.usuario.username || venta.usuario.nombre || '-';
        }
        return '-';
    };

    const getTrabajadorLabel = (venta: VentaGroup): string => {
        if (venta.subVentas && venta.subVentas.length > 0) {
            const labels = Array.from(
                new Set(venta.subVentas.map(getTrabajadorLabelFromVenta).filter((label) => label !== '-'))
            );
            return labels.length > 0 ? labels.join(', ') : '-';
        }
        return getTrabajadorLabelFromVenta(venta);
    };

    const agruparProductos = (productos: Venta['productos'][]) => {
        const map = new Map<string, { nombre: string; tipo: string; unidades: number; precioUnitario: number; precioTotal: number; }>();
        productos.forEach((producto) => {
            const clave = `${producto.nombre}-${producto.precioUnitario}`;
            const existente = map.get(clave);
            if (existente) {
                existente.unidades += producto.unidades;
                existente.precioTotal = Number((existente.precioTotal + producto.precioTotal).toFixed(2));
            } else {
                map.set(clave, { ...producto });
            }
        });
        return Array.from(map.values());
    };

    const ventasAgrupadas: VentaGroup[] = React.useMemo(() => {
        if (!isFiltradoPorSocio) return ventas;

        const grupos = new Map<string, VentaGroup>();
        ventas.forEach((venta) => {
            const codigoBase = venta.codigoSocio.split('_')[0];
            const grupoExistente = grupos.get(codigoBase);
            const productosCombinados = grupoExistente ? [...grupoExistente.productos || [], ...venta.productos] : [...venta.productos];
            const productosAgrupados = agruparProductos(productosCombinados);
            const total = (grupoExistente?.total || 0) + venta.total;
            const pagado = (grupoExistente?.pagado || 0) + venta.pagado;
            const observaciones = grupoExistente?.observaciones ? `${grupoExistente.observaciones}; ${venta.observaciones || ''}` : (venta.observaciones || '');
            const estado = grupoExistente?.estado === 'PAGADO_PARCIAL' || venta.estado === 'PAGADO_PARCIAL' ? 'PAGADO_PARCIAL' : 'PENDIENTE';
            const createdAt = grupoExistente?.createdAt || venta.createdAt;
            const nombreSocio = venta.nombreSocio;
            const codigoSocio = codigoBase;

            grupos.set(codigoBase, {
                ...venta,
                _id: codigoBase,
                codigoSocio,
                total,
                pagado,
                estado: estado as 'PENDIENTE' | 'PAGADO_PARCIAL',
                observaciones,
                productos: productosAgrupados,
                originalIds: [...(grupoExistente?.originalIds || []), venta._id],
                subVentas: [...(grupoExistente?.subVentas || []), venta]
            });
        });

        return Array.from(grupos.values());
    }, [ventas, isFiltradoPorSocio]);

    const getVentaIds = (venta: VentaGroup) => venta.originalIds || [venta._id];

    const handleToggleVenta = (venta: VentaGroup) => {
        const baseCodigo = venta.codigoSocio.split('_')[0];
        const familyIds = ventas
            .filter(v => v.codigoSocio.startsWith(baseCodigo))
            .map(v => v._id);

        setVentasSeleccionadas(prev => {
            const newSet = new Set(prev);
            const marcado = familyIds.every(id => newSet.has(id));
            familyIds.forEach(id => {
                if (marcado) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }
            });
            return newSet;
        });
    };

    const allVentaIds = ventasAgrupadas.flatMap(getVentaIds);
    const allFamiliaVentaIds = familiaSeleccionada
        ? ventas.filter(v => v.codigoSocio.startsWith(familiaSeleccionada)).map(v => v._id)
        : allVentaIds;

    const handleSelectAll = () => {
        const targetIds = familiaSeleccionada ? allFamiliaVentaIds : allVentaIds;
        const allSelected = targetIds.length > 0 && targetIds.every(id => ventasSeleccionadas.has(id));
        if (allSelected) {
            setVentasSeleccionadas(new Set());
        } else {
            setVentasSeleccionadas(new Set(targetIds));
        }
    };

    const handlePagarAcumulado = () => {
        if (ventasSeleccionadas.size === 0) {
            setError('Debe seleccionar al menos una deuda para pagar');
            return;
        }
        setModalPagoAcumuladoOpen(true);
    };

    const handlePagarAcumuladoGroup = (venta: VentaGroup) => {
        const baseCodigo = venta.codigoSocio.split('_')[0];
        const familiaIds = ventas
            .filter(v => v.codigoSocio.startsWith(baseCodigo))
            .map(v => v._id);
        setVentasSeleccionadas(new Set(familiaIds));
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
                                    indeterminate={ventasSeleccionadas.size > 0 && ventasSeleccionadas.size < allFamiliaVentaIds.length}
                                    checked={allFamiliaVentaIds.length > 0 && ventasSeleccionadas.size === allFamiliaVentaIds.length}
                                    onChange={handleSelectAll}
                                />
                            </TableCell>
                                    <TableCell>Fecha</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Trabajador</TableCell>
                            <TableCell>Productos</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Pagado</TableCell>
                            <TableCell>Pendiente</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Observaciones</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ventasAgrupadas.map((venta) => {
                            const esVentaSeleccionable = !familiaSeleccionada || venta.codigoSocio.startsWith(familiaSeleccionada);
                            return (
                                <TableRow key={venta._id}>
                                    <TableCell padding="checkbox">
                                        {esVentaSeleccionable ? (
                                            <Checkbox
                                                checked={getVentaIds(venta).every(id => ventasSeleccionadas.has(id))}
                                                onChange={() => handleToggleVenta(venta)}
                                            />
                                        ) : null}
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
                                <TableCell>
                                    {getTrabajadorLabel(venta)}
                                </TableCell>
                                <TableCell>
                                    {venta.productos?.map((producto, index) => (
                                        <Typography key={`${producto.nombre}-${index}`} variant="body2">
                                            {producto.nombre} x{producto.unidades} - {roundMoney(producto.precioTotal).toFixed(2)}€
                                        </Typography>
                                    ))}
                                </TableCell>
                                <TableCell>{roundMoney(venta.total).toFixed(2)}€</TableCell>
                                <TableCell>{roundMoney(venta.pagado).toFixed(2)}€</TableCell>
                                <TableCell>
                                    {roundMoney(roundMoney(venta.total) - roundMoney(venta.pagado)).toFixed(2)}€
                                </TableCell>
                                <TableCell>
                                    {getEstadoChip(venta.estado)}
                                </TableCell>
                                <TableCell>
                                    {venta.observaciones || '-'}
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {isFiltradoPorSocio ? (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={() => handlePagarAcumuladoGroup(venta)}
                                            >
                                                Pagar acumulado
                                            </Button>
                                        ) : (
                                            <>
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
                                            </>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                            );
                        })}
                        {ventasAgrupadas.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={11} align="center">
                                    {error ? `Error: ${error}` : 'No hay deudas pendientes'}
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