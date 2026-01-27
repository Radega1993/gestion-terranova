import React, { useState } from 'react';
import {
    Container,
    Typography,
    Paper,
    Grid,
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
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { SocioSelector } from './components/SocioSelector';
import { UsuarioTrabajadorSelector } from '../recaudaciones/UsuarioTrabajadorSelector';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types/user';
import { Cliente } from './types';
import { EditarVentaModal } from './components/EditarVentaModal';

interface Filtros {
    fechaInicio: Date | null;
    fechaFin: Date | null;
    codigoSocio: string;
    usuario: string | string[];
    trabajadorId: string | string[];
    metodoPago: string;
}

interface Venta {
    _id: string;
    createdAt: string;
    codigoSocio: string;
    nombreSocio: string;
    esSocio: boolean;
    usuario: {
        _id: string;
        username: string;
        nombre?: string;
    };
    trabajador?: {
        _id: string;
        nombre: string;
        identificador: string;
    };
    productos: Array<{
        nombre: string;
        categoria?: string;
        unidades: number;
        precioUnitario: number;
        precioTotal: number;
    }>;
    total: number;
    pagado: number;
    estado: string;
    metodoPago?: string;
    observaciones?: string;
    pagos?: Array<{
        fecha: string;
        monto: number;
        metodoPago: string;
        observaciones?: string;
    }>;
}

const GestionVentasList: React.FC = () => {
    const { token } = useAuthStore();
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
    const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
    const [modalEditarOpen, setModalEditarOpen] = useState(false);

    const handleFiltroChange = (campo: keyof Filtros, valor: any) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const handleUsuarioTrabajadorSeleccionado = (ids: string[], tipos: Array<'usuario' | 'trabajador'>) => {
        const trabajadorIds = ids.filter((id, index) => tipos[index] === 'trabajador');
        const usuarioIds = ids.filter((id, index) => tipos[index] === 'usuario');
        handleFiltroChange('trabajadorId', trabajadorIds);
        handleFiltroChange('usuario', usuarioIds);
    };

    const handleBuscar = async () => {
        try {
            setLoading(true);
            setError(null);

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

            const queryParams = new URLSearchParams();
            if (fechaInicio) queryParams.append('fechaInicio', fechaInicio.toISOString());
            if (fechaFin) queryParams.append('fechaFin', fechaFin.toISOString());
            if (filtros.codigoSocio) queryParams.append('codigoCliente', filtros.codigoSocio);
            
            const trabajadorIds = Array.isArray(filtros.trabajadorId) 
                ? filtros.trabajadorId.filter(id => id) 
                : filtros.trabajadorId ? [filtros.trabajadorId] : [];
            const usuarioIds = Array.isArray(filtros.usuario) 
                ? filtros.usuario.filter(id => id) 
                : filtros.usuario ? [filtros.usuario] : [];
            
            trabajadorIds.forEach(id => queryParams.append('trabajadorId', id));
            usuarioIds.forEach(id => queryParams.append('usuario', id));
            
            if (filtros.metodoPago && filtros.metodoPago !== 'todos') {
                queryParams.append('metodoPago', filtros.metodoPago);
            }

            const response = await fetch(`${API_BASE_URL}/ventas?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar las ventas');
            }

            const data = await response.json();
            setVentas(data);
        } catch (error: any) {
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
        setVentas([]);
    };

    const handleEditarVenta = (venta: Venta) => {
        setVentaSeleccionada(venta);
        setModalEditarOpen(true);
    };

    const handleVentaActualizada = () => {
        setModalEditarOpen(false);
        setVentaSeleccionada(null);
        handleBuscar(); // Recargar la lista
    };

    const getEstadoChip = (estado: string) => {
        let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
        let label = estado;
        switch (estado) {
            case 'PAGADO':
                color = 'success';
                label = 'Pagado';
                break;
            case 'PENDIENTE':
                color = 'warning';
                label = 'Pendiente';
                break;
            case 'PAGADO_PARCIAL':
                color = 'info';
                label = 'Pago Parcial';
                break;
            default:
                color = 'default';
        }
        return <Chip label={label} size="small" color={color} />;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestión de Ventas
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
                        <UsuarioTrabajadorSelector
                            value={[
                                ...(Array.isArray(filtros.trabajadorId) ? filtros.trabajadorId : filtros.trabajadorId ? [filtros.trabajadorId] : []),
                                ...(Array.isArray(filtros.usuario) ? filtros.usuario : filtros.usuario ? [filtros.usuario] : [])
                            ]}
                            onChange={handleUsuarioTrabajadorSeleccionado}
                            required={false}
                            multiple={true}
                        />
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
                                <MenuItem value="transferencia">Transferencia</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Socio</TableCell>
                                <TableCell>Usuario/Trabajador</TableCell>
                                <TableCell>Productos</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell align="right">Pagado</TableCell>
                                <TableCell>Método Pago</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ventas.map((venta) => (
                                <TableRow key={venta._id}>
                                    <TableCell>
                                        {new Date(venta.createdAt).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        {venta.nombreSocio} ({venta.codigoSocio})
                                    </TableCell>
                                    <TableCell>
                                        {venta.trabajador 
                                            ? `${venta.trabajador.nombre} (${venta.trabajador.identificador})`
                                            : venta.usuario.username}
                                    </TableCell>
                                    <TableCell>
                                        {venta.productos.map((producto, index) => (
                                            <div key={index}>
                                                {producto.unidades} x {producto.nombre} = {producto.precioTotal.toFixed(2)}€
                                            </div>
                                        ))}
                                    </TableCell>
                                    <TableCell align="right">
                                        {venta.total.toFixed(2)}€
                                    </TableCell>
                                    <TableCell align="right">
                                        {venta.pagado.toFixed(2)}€
                                    </TableCell>
                                    <TableCell>
                                        {venta.metodoPago ? (
                                            <Chip 
                                                label={venta.metodoPago === 'EFECTIVO' ? 'Efectivo' : 
                                                       venta.metodoPago === 'TARJETA' ? 'Tarjeta' : 
                                                       venta.metodoPago === 'TRANSFERENCIA' ? 'Transferencia' : venta.metodoPago}
                                                size="small"
                                                color={venta.metodoPago === 'EFECTIVO' ? 'default' : 'primary'}
                                            />
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {getEstadoChip(venta.estado)}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleEditarVenta(venta)}
                                            size="small"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {ventaSeleccionada && (
                <EditarVentaModal
                    open={modalEditarOpen}
                    venta={ventaSeleccionada}
                    onClose={() => {
                        setModalEditarOpen(false);
                        setVentaSeleccionada(null);
                    }}
                    onVentaActualizada={handleVentaActualizada}
                />
            )}
        </Container>
    );
};

export default GestionVentasList;



