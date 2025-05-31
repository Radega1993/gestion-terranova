import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Grid,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { Venta } from './types';

export const VentasPendientes: React.FC = () => {
    const { token } = useAuthStore();
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtros, setFiltros] = useState({
        fechaInicio: null as Date | null,
        fechaFin: null as Date | null,
        codigoCliente: '',
        usuario: ''
    });

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

            const response = await fetch(url, {
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
        } catch (error) {
            console.error('Error:', error);
            setError(error instanceof Error ? error.message : 'Error al cargar las ventas');
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

    const handleBuscar = () => {
        fetchVentas();
    };

    const handleLimpiarFiltros = () => {
        setFiltros({
            fechaInicio: null,
            fechaFin: null,
            codigoCliente: '',
            usuario: ''
        });
        fetchVentas();
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
                Ventas Pendientes
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
                        <TextField
                            fullWidth
                            label="Código Cliente"
                            value={filtros.codigoCliente}
                            onChange={(e) => handleFiltroChange('codigoCliente', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="contained"
                                onClick={handleBuscar}
                                fullWidth
                            >
                                Buscar
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleLimpiarFiltros}
                                fullWidth
                            >
                                Limpiar
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

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Pagado</TableCell>
                            <TableCell>Pendiente</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Método Pago</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ventas.map((venta) => (
                            <TableRow key={venta._id}>
                                <TableCell>
                                    {new Date(venta.createdAt).toLocaleDateString()}
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
                                    {venta.estado === 'PAGADO_PARCIAL' ? 'Pago Parcial' : 'Pendiente'}
                                </TableCell>
                                <TableCell>{venta.metodoPago}</TableCell>
                            </TableRow>
                        ))}
                        {ventas.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    No hay ventas pendientes
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}; 