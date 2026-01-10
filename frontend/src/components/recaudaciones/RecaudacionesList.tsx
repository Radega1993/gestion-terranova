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
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Close as CloseIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { SocioSelector } from '../ventas/components/SocioSelector';
import { UsuarioSelector } from '../ventas/components/UsuarioSelector';
import { UsuarioTrabajadorSelector } from './UsuarioTrabajadorSelector';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types/user';
import { Cliente } from '../ventas/types';
import { ResumenGeneralPDF } from './ResumenGeneralPDF';
import { ResumenDetalladoPDF } from './ResumenDetalladoPDF';
import { ResumenSociosPDF } from './ResumenSociosPDF';

interface Filtros {
    fechaInicio: Date | null;
    fechaFin: Date | null;
    codigoSocio: string;
    usuario: string | string[];
    trabajadorId: string | string[];
    metodoPago: string; // 'todos', 'efectivo', 'tarjeta'
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
    trabajador?: {
        _id: string;
        nombre: string;
        identificador: string;
    };
    total: number;
    pagado: number;
    fianza?: number;
    metodoPago?: string;
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
    const { token, userRole } = useAuthStore();
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filtros, setFiltros] = useState<Filtros>({
        fechaInicio: null,
        fechaFin: null,
        codigoSocio: '',
        usuario: [],
        trabajadorId: [],
        metodoPago: 'todos',
    });
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
    const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState<string | null>(null);
    const [showResumenProductos, setShowResumenProductos] = useState(false);
    const [showResumenSocios, setShowResumenSocios] = useState(false);
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
        // Si se selecciona un usuario, limpiar el filtro de trabajador
        if (usuario) {
            handleFiltroChange('trabajadorId', '');
            setTrabajadorSeleccionado(null);
        }
    };

    const handleUsuarioTrabajadorSeleccionado = (ids: string[], tipos: Array<'usuario' | 'trabajador'>) => {
        // Separar IDs por tipo
        const trabajadorIds = ids.filter((id, index) => tipos[index] === 'trabajador');
        const usuarioIds = ids.filter((id, index) => tipos[index] === 'usuario');

        handleFiltroChange('trabajadorId', trabajadorIds);
        handleFiltroChange('usuario', usuarioIds);
    };

    const handleBuscar = async () => {
        try {
            setLoading(true);
            setError(null);

            // Ajustar las fechas para incluir todo el día
            let fechaInicio = filtros.fechaInicio;
            let fechaFin = filtros.fechaFin;

            if (fechaInicio) {
                fechaInicio = new Date(fechaInicio);
                fechaInicio.setHours(0, 0, 0, 0);
            }

            if (fechaFin) {
                fechaFin = new Date(fechaFin);
                fechaFin.setHours(23, 59, 59, 999);
            }

            console.log('Filtros enviados:', {
                ...filtros,
                fechaInicio: fechaInicio?.toISOString(),
                fechaFin: fechaFin?.toISOString()
            });

            // Construir query string con soporte para arrays
            const queryParams = new URLSearchParams();
            if (fechaInicio) queryParams.append('fechaInicio', fechaInicio.toISOString());
            if (fechaFin) queryParams.append('fechaFin', fechaFin.toISOString());
            if (filtros.codigoSocio) queryParams.append('codigoSocio', filtros.codigoSocio);
            
            // Agregar usuarios y trabajadores como arrays
            const trabajadorIds = Array.isArray(filtros.trabajadorId) 
                ? filtros.trabajadorId.filter(id => id) 
                : filtros.trabajadorId ? [filtros.trabajadorId] : [];
            const usuarioIds = Array.isArray(filtros.usuario) 
                ? filtros.usuario.filter(id => id) 
                : filtros.usuario ? [filtros.usuario] : [];
            
            trabajadorIds.forEach(id => queryParams.append('trabajadorId', id));
            usuarioIds.forEach(id => queryParams.append('usuario', id));
            
            // Agregar filtro de método de pago si no es 'todos'
            if (filtros.metodoPago && filtros.metodoPago !== 'todos') {
                queryParams.append('metodoPago', filtros.metodoPago);
            }

            const response = await fetch(`${API_BASE_URL}/ventas/recaudaciones?${queryParams.toString()}`, {
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
            usuario: [],
            trabajadorId: [],
            metodoPago: 'todos',
        });
        setUsuarioSeleccionado(null);
        setTrabajadorSeleccionado(null);
        setVentas([]);
    };

    const totalRecaudado = ventas.reduce((sum, venta) => sum + venta.pagado, 0);

    // Calcular totales por usuario/trabajador
    const totalesPorUsuario = ventas.reduce((acc: { [key: string]: { username: string; total: number; cantidad: number } }, venta) => {
        // Si hay trabajador, usar el trabajador; si no, usar el usuario
        const identificador = venta.trabajador 
            ? `${venta.trabajador.nombre} (${venta.trabajador.identificador})`
            : venta.usuario.username;
        
        if (!acc[identificador]) {
            acc[identificador] = {
                username: identificador,
                total: 0,
                cantidad: 0
            };
        }
        acc[identificador].total += venta.pagado;
        acc[identificador].cantidad += 1;
        return acc;
    }, {});

    const totalesPorUsuarioArray = Object.values(totalesPorUsuario).sort((a, b) => b.total - a.total);

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
                        {userRole === UserRole.TIENDA ? (
                            <UsuarioTrabajadorSelector
                                value={[
                                    ...(Array.isArray(filtros.trabajadorId) ? filtros.trabajadorId : filtros.trabajadorId ? [filtros.trabajadorId] : []),
                                    ...(Array.isArray(filtros.usuario) ? filtros.usuario : filtros.usuario ? [filtros.usuario] : [])
                                ]}
                                onChange={handleUsuarioTrabajadorSeleccionado}
                                required={false}
                                multiple={true}
                            />
                        ) : (
                            <UsuarioSelector
                                onUsuarioSeleccionado={handleUsuarioSeleccionado}
                                value={usuarioSeleccionado}
                                excluirTienda={true}
                            />
                        )}
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Método de Pago</InputLabel>
                            <Select
                                value={filtros.metodoPago}
                                label="Método de Pago"
                                onChange={(e) => handleFiltroChange('metodoPago', e.target.value)}
                            >
                                <MenuItem value="todos">Todos</MenuItem>
                                <MenuItem value="efectivo">Efectivo</MenuItem>
                                <MenuItem value="tarjeta">Tarjeta</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                startIcon={<PdfIcon />}
                                onClick={() => {
                                    setShowResumenProductos(true);
                                }}
                                disabled={ventas.length === 0}
                            >
                                Resumen de Productos
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<PdfIcon />}
                                onClick={() => {
                                    setShowResumenSocios(true);
                                }}
                                disabled={ventas.length === 0}
                            >
                                Resumen de Socios
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
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="h6" gutterBottom>
                                    Total Recaudado: {totalRecaudado.toFixed(2)}€
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="h6" gutterBottom>
                                    Total Fianzas: {ventas.filter(v => v.tipo === 'RESERVA' && v.fianza).reduce((sum, v) => sum + (v.fianza || 0), 0).toFixed(2)}€
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Totales por Usuario */}
                    {totalesPorUsuarioArray.length > 0 && (
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                Totales por Usuario
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell><strong>Usuario</strong></TableCell>
                                            <TableCell align="right"><strong>Transacciones</strong></TableCell>
                                            <TableCell align="right"><strong>Total Recaudado</strong></TableCell>
                                            <TableCell align="right"><strong>% del Total</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {totalesPorUsuarioArray.map((usuario: any) => (
                                            <TableRow key={usuario.username}>
                                                <TableCell>{usuario.username}</TableCell>
                                                <TableCell align="right">{usuario.cantidad}</TableCell>
                                                <TableCell align="right">
                                                    <strong>{usuario.total.toFixed(2)}€</strong>
                                                </TableCell>
                                                <TableCell align="right">
                                                    {totalRecaudado > 0 
                                                        ? ((usuario.total / totalRecaudado) * 100).toFixed(1)
                                                        : '0.0'
                                                    }%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={2}><strong>TOTAL</strong></TableCell>
                                            <TableCell align="right">
                                                <strong>{totalRecaudado.toFixed(2)}€</strong>
                                            </TableCell>
                                            <TableCell align="right"><strong>100.0%</strong></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    )}

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
                                    <TableCell>Fianza</TableCell>
                                    <TableCell>Método Pago</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Productos</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ventas.map((venta, index) => {
                                    // Crear una clave única combinando _id, fecha y si hay pagos, el índice del pago
                                    const uniqueKey = venta.pagos && venta.pagos.length > 0
                                        ? `${venta._id}-${venta.fecha}-${index}-${venta.pagos[0]?.fecha || index}`
                                        : `${venta._id}-${venta.fecha}-${index}`;
                                    return (
                                    <TableRow key={uniqueKey}>
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
                                        <TableCell>
                                            {venta.trabajador 
                                                ? `${venta.trabajador.nombre} (${venta.trabajador.identificador})`
                                                : venta.usuario.username}
                                        </TableCell>
                                        <TableCell align="right">{venta.total.toFixed(2)}€</TableCell>
                                        <TableCell align="right">{venta.pagado.toFixed(2)}€</TableCell>
                                        <TableCell align="right">
                                            {venta.tipo === 'RESERVA' && venta.fianza ? `${venta.fianza.toFixed(2)}€` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {venta.metodoPago ? (
                                                <Chip 
                                                    label={venta.metodoPago === 'EFECTIVO' ? 'Efectivo' : venta.metodoPago === 'TARJETA' ? 'Tarjeta' : venta.metodoPago}
                                                    size="small"
                                                    color={venta.metodoPago === 'EFECTIVO' ? 'default' : 'primary'}
                                                />
                                            ) : (
                                                venta.pagos && venta.pagos.length > 0 ? (
                                                    <Chip 
                                                        label={venta.pagos[0].metodoPago === 'EFECTIVO' ? 'Efectivo' : venta.pagos[0].metodoPago === 'TARJETA' ? 'Tarjeta' : venta.pagos[0].metodoPago}
                                                        size="small"
                                                        color={venta.pagos[0].metodoPago === 'EFECTIVO' ? 'default' : 'primary'}
                                                    />
                                                ) : '-'
                                            )}
                                        </TableCell>
                                        <TableCell>{venta.estado}</TableCell>
                                        <TableCell>
                                            {venta.detalles.map((producto, index) => (
                                                <div key={index}>
                                                    {producto.cantidad} x {producto.nombre} = {producto.total.toFixed(2)}€
                                                </div>
                                            ))}
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {/* Modal para Resumen de Productos */}
            <Dialog
                open={showResumenProductos}
                onClose={() => setShowResumenProductos(false)}
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
                    Resumen de Productos
                    <IconButton
                        onClick={() => setShowResumenProductos(false)}
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
                        if (ventas.length === 0) {
                            return (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No hay datos para mostrar. Por favor, aplica filtros y busca recaudaciones.
                                    </Typography>
                                </Box>
                            );
                        }
                        
                        const fechaInicio = filtros.fechaInicio || (ventas.length > 0 
                            ? new Date(Math.min(...ventas.map(v => new Date(v.fecha).getTime())))
                            : new Date());
                        const fechaFin = filtros.fechaFin || (ventas.length > 0
                            ? new Date(Math.max(...ventas.map(v => new Date(v.fecha).getTime())))
                            : new Date());
                        
                        // Validar que las fechas sean válidas
                        const fechaInicioValida = fechaInicio instanceof Date && !isNaN(fechaInicio.getTime()) 
                            ? fechaInicio 
                            : new Date();
                        const fechaFinValida = fechaFin instanceof Date && !isNaN(fechaFin.getTime())
                            ? fechaFin
                            : new Date();
                        
                        return (
                            <ResumenGeneralPDF
                                ventas={ventas}
                                fechaInicio={fechaInicioValida}
                                fechaFin={fechaFinValida}
                            />
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Modal para Resumen de Socios */}
            <Dialog
                open={showResumenSocios}
                onClose={() => setShowResumenSocios(false)}
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
                    Resumen de Socios
                    <IconButton
                        onClick={() => setShowResumenSocios(false)}
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
                        if (ventas.length === 0) {
                            return (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No hay datos para mostrar. Por favor, aplica filtros y busca recaudaciones.
                                    </Typography>
                                </Box>
                            );
                        }
                        
                        const fechaInicio = filtros.fechaInicio || (ventas.length > 0 
                            ? new Date(Math.min(...ventas.map(v => new Date(v.fecha).getTime())))
                            : new Date());
                        const fechaFin = filtros.fechaFin || (ventas.length > 0
                            ? new Date(Math.max(...ventas.map(v => new Date(v.fecha).getTime())))
                            : new Date());
                        
                        // Validar que las fechas sean válidas
                        const fechaInicioValida = fechaInicio instanceof Date && !isNaN(fechaInicio.getTime()) 
                            ? fechaInicio 
                            : new Date();
                        const fechaFinValida = fechaFin instanceof Date && !isNaN(fechaFin.getTime())
                            ? fechaFin
                            : new Date();
                        
                        return (
                            <ResumenSociosPDF
                                ventas={ventas}
                                fechaInicio={fechaInicioValida}
                                fechaFin={fechaFinValida}
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
                        if (ventas.length === 0) {
                            return (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No hay datos para mostrar. Por favor, aplica filtros y busca recaudaciones.
                                    </Typography>
                                </Box>
                            );
                        }
                        
                        const fechaInicio = filtros.fechaInicio || (ventas.length > 0
                            ? new Date(Math.min(...ventas.map(v => new Date(v.fecha).getTime())))
                            : new Date());
                        const fechaFin = filtros.fechaFin || (ventas.length > 0
                            ? new Date(Math.max(...ventas.map(v => new Date(v.fecha).getTime())))
                            : new Date());
                        
                        // Validar que las fechas sean válidas
                        const fechaInicioValida = fechaInicio instanceof Date && !isNaN(fechaInicio.getTime())
                            ? fechaInicio
                            : new Date();
                        const fechaFinValida = fechaFin instanceof Date && !isNaN(fechaFin.getTime())
                            ? fechaFin
                            : new Date();
                        
                        return (
                            <ResumenDetalladoPDF
                                ventas={ventas}
                                fechaInicio={fechaInicioValida}
                                fechaFin={fechaFinValida}
                            />
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default RecaudacionesList; 