import React, { useState } from 'react';
import {
    Container,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
} from '@mui/material';
import { Close as CloseIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { SocioSelector } from '../ventas/components/SocioSelector';
import { UsuarioSelector } from '../ventas/components/UsuarioSelector';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { Cliente } from '../ventas/types';
import { ResumenGeneralPDF } from './ResumenGeneralPDF';
import { ResumenDetalladoPDF } from './ResumenDetalladoPDF';

interface Filtros {
    fechaInicio: Date | null;
    fechaFin: Date | null;
    codigoSocio: string;
    usuario: string;
}

interface Usuario {
    _id: string;
    username: string;
    nombre: string;
    apellidos: string;
    role: string;
    activo: boolean;
    lastLogin: string;
}

interface Venta {
    _id: string;
    tipo: 'VENTA' | 'RESERVA';
    fecha: string;
    socio: {
        codigo: string;
        nombre: string;
    };
    usuario: {
        _id: string;
        username: string;
    };
    total: number;
    pagado: number;
    estado: string;
    detalles: Array<{
        nombre: string;
        cantidad: number;
        precio: number;
        total: number;
    }>;
    pagos?: Array<{
        fecha: string;
        monto: number;
        metodoPago: string;
        observaciones?: string;
    }>;
}

const RecaudacionesList: React.FC = () => {
    const { token } = useAuthStore();
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filtros, setFiltros] = useState<Filtros>({
        fechaInicio: null,
        fechaFin: null,
        codigoSocio: '',
        usuario: '',
    });
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
    const [showResumenGeneral, setShowResumenGeneral] = useState(false);
    const [showResumenDetallado, setShowResumenDetallado] = useState(false);

    const handleFiltroChange = (campo: keyof Filtros, valor: any) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const handleUsuarioSeleccionado = (usuario: Usuario | null) => {
        setUsuarioSeleccionado(usuario);
        handleFiltroChange('usuario', usuario?._id || '');
    };

    const handleBuscar = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Filtros enviados:', filtros);

            const response = await fetch(`${API_BASE_URL}/ventas/recaudaciones?${new URLSearchParams({
                ...(filtros.fechaInicio && { fechaInicio: filtros.fechaInicio.toISOString() }),
                ...(filtros.fechaFin && { fechaFin: filtros.fechaFin.toISOString() }),
                ...(filtros.codigoSocio && { codigoSocio: filtros.codigoSocio }),
                ...(filtros.usuario && { usuario: filtros.usuario })
            })}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar las recaudaciones');
            }

            const data = await response.json();
            console.log('Datos recibidos:', data);
            setVentas(data);
            console.log('Número de registros:', data.length);
            if (data.length > 0) {
                console.log('Primer registro:', data[0]);
            }
        } catch (error: any) {
            console.error('Error completo:', error);
            setError(error.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    const handleLimpiarFiltros = () => {
        setFiltros({
            fechaInicio: null,
            fechaFin: null,
            codigoSocio: '',
            usuario: '',
        });
        setVentas([]);
    };

    const totalRecaudado = ventas.reduce((sum, venta) => sum + venta.pagado, 0);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Recaudaciones
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
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
                            onClienteSeleccionado={(socio) => handleFiltroChange('codigoSocio', socio?.codigo || '')}
                            value={filtros.codigoSocio ? {
                                _id: filtros.codigoSocio,
                                codigo: filtros.codigoSocio,
                                nombreCompleto: '',
                                tipo: 'Socio'
                            } as Cliente : null}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <UsuarioSelector
                            onUsuarioSeleccionado={handleUsuarioSeleccionado}
                            value={usuarioSeleccionado}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                startIcon={<PdfIcon />}
                                onClick={() => {
                                    console.log('Abriendo Resumen General');
                                    console.log('Fecha Inicio:', filtros.fechaInicio);
                                    console.log('Fecha Fin:', filtros.fechaFin);
                                    console.log('Ventas:', ventas);
                                    setShowResumenGeneral(true);
                                }}
                                disabled={ventas.length === 0}
                            >
                                Resumen General
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PdfIcon />}
                                onClick={() => {
                                    console.log('Abriendo Resumen Detallado');
                                    console.log('Fecha Inicio:', filtros.fechaInicio);
                                    console.log('Fecha Fin:', filtros.fechaFin);
                                    console.log('Ventas:', ventas);
                                    setShowResumenDetallado(true);
                                }}
                                disabled={ventas.length === 0}
                            >
                                Resumen Detallado
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleLimpiarFiltros}
                            >
                                Limpiar Filtros
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleBuscar}
                                disabled={loading}
                            >
                                Buscar
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            ) : (
                <>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Total Recaudado: {totalRecaudado.toFixed(2)}€
                        </Typography>
                    </Paper>

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Socio</TableCell>
                                    <TableCell>Usuario</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Pagado</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Productos</TableCell>
                                    <TableCell>Desglose Pagos</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ventas.map((venta) => (
                                    <TableRow key={venta._id}>
                                        <TableCell>
                                            {new Date(venta.fecha).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>{venta.tipo}</TableCell>
                                        <TableCell>
                                            {venta.socio.nombre} ({venta.socio.codigo})
                                        </TableCell>
                                        <TableCell>{venta.usuario.username}</TableCell>
                                        <TableCell align="right">{venta.total.toFixed(2)}€</TableCell>
                                        <TableCell align="right">{venta.pagado.toFixed(2)}€</TableCell>
                                        <TableCell>{venta.estado}</TableCell>
                                        <TableCell>
                                            {venta.detalles.map((producto, index) => (
                                                <div key={index}>
                                                    {producto.cantidad} x {producto.nombre} = {producto.total.toFixed(2)}€
                                                </div>
                                            ))}
                                        </TableCell>
                                        <TableCell>
                                            {venta.pagos?.map((pago, index) => (
                                                <div key={index}>
                                                    {new Date(pago.fecha).toLocaleDateString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })} - {pago.monto.toFixed(2)}€ ({pago.metodoPago})
                                                    {pago.observaciones && <div style={{ fontSize: '0.8em', color: 'gray' }}>{pago.observaciones}</div>}
                                                </div>
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {/* Modal para Resumen General */}
            <Dialog
                open={showResumenGeneral}
                onClose={() => setShowResumenGeneral(false)}
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
                    Resumen General de Recaudaciones
                    <IconButton
                        onClick={() => setShowResumenGeneral(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{
                    p: 0,
                    height: 'calc(90vh - 64px)',
                    '& > div': {
                        height: '100%'
                    }
                }}>
                    {(() => {
                        const fechaInicio = filtros.fechaInicio || new Date(Math.min(...ventas.map(v => new Date(v.fecha).getTime())));
                        const fechaFin = filtros.fechaFin || new Date(Math.max(...ventas.map(v => new Date(v.fecha).getTime())));
                        console.log('Modal General - Fecha Inicio:', fechaInicio);
                        console.log('Modal General - Fecha Fin:', fechaFin);
                        console.log('Modal General - Ventas:', ventas);
                        return ventas.length > 0 && (
                            <ResumenGeneralPDF
                                ventas={ventas}
                                fechaInicio={fechaInicio}
                                fechaFin={fechaFin}
                            />
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Modal para Resumen Detallado */}
            <Dialog
                open={showResumenDetallado}
                onClose={() => setShowResumenDetallado(false)}
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
                    Resumen Detallado de Ventas
                    <IconButton
                        onClick={() => setShowResumenDetallado(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{
                    p: 0,
                    height: 'calc(90vh - 64px)',
                    '& > div': {
                        height: '100%'
                    }
                }}>
                    {(() => {
                        const fechaInicio = filtros.fechaInicio || new Date(Math.min(...ventas.map(v => new Date(v.fecha).getTime())));
                        const fechaFin = filtros.fechaFin || new Date(Math.max(...ventas.map(v => new Date(v.fecha).getTime())));
                        console.log('Modal Detallado - Fecha Inicio:', fechaInicio);
                        console.log('Modal Detallado - Fecha Fin:', fechaFin);
                        console.log('Modal Detallado - Ventas:', ventas);
                        return ventas.length > 0 && (
                            <ResumenDetalladoPDF
                                ventas={ventas}
                                fechaInicio={fechaInicio}
                                fechaFin={fechaFin}
                            />
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default RecaudacionesList; 