import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Card,
    CardContent,
    Autocomplete
} from '@mui/material';
import {
    DatePicker
} from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config';
import { authenticatedFetchJson } from '../../utils/apiHelper';
import { Product } from '../../types/product';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { ProductosRetiradosPDF } from './ProductosRetiradosPDF';

interface ProductoRetirado {
    _id: string;
    producto: Product;
    cantidad: number;
    motivo: string;
    usuarioRegistro: {
        _id: string;
        username: string;
    };
    fechaRetiro: string;
    observaciones?: string;
}

interface Resumen {
    totalRegistros: number;
    totalCantidad: number;
    porMotivo: Record<string, { cantidad: number }>;
    porProducto: Record<string, { cantidad: number; nombre: string }>;
}

interface Filtros {
    fechaInicio: Date | null;
    fechaFin: Date | null;
    productoId: string;
    motivo: string;
}

export const ProductosRetiradosList: React.FC = () => {
    const [filtros, setFiltros] = useState<Filtros>({
        fechaInicio: null,
        fechaFin: null,
        productoId: '',
        motivo: ''
    });
    const [showPDF, setShowPDF] = useState(false);

    // Obtener productos para el filtro
    const { data: productos } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: () => authenticatedFetchJson<Product[]>(`${API_BASE_URL}/inventory`)
    });

    // Construir query params
    const queryParams = new URLSearchParams();
    if (filtros.fechaInicio) {
        queryParams.append('fechaInicio', filtros.fechaInicio.toISOString());
    }
    if (filtros.fechaFin) {
        queryParams.append('fechaFin', filtros.fechaFin.toISOString());
    }
    if (filtros.productoId) {
        queryParams.append('productoId', filtros.productoId);
    }
    if (filtros.motivo) {
        queryParams.append('motivo', filtros.motivo);
    }

    // Obtener productos retirados
    const { data: productosRetirados = [], isLoading } = useQuery<ProductoRetirado[]>({
        queryKey: ['productos-retirados', queryParams.toString()],
        queryFn: () => authenticatedFetchJson<ProductoRetirado[]>(
            `${API_BASE_URL}/inventory/productos-retirados?${queryParams.toString()}`
        )
    });

    // Obtener resumen
    const { data: resumen } = useQuery<Resumen>({
        queryKey: ['productos-retirados-resumen', queryParams.toString()],
        queryFn: () => authenticatedFetchJson<Resumen>(
            `${API_BASE_URL}/inventory/productos-retirados/resumen?${queryParams.toString()}`
        )
    });

    const handleLimpiarFiltros = () => {
        setFiltros({
            fechaInicio: null,
            fechaFin: null,
            productoId: '',
            motivo: ''
        });
    };

    const handleGenerarPDF = () => {
        setShowPDF(true);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Box>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Productos Retirados
                    </Typography>

                    {/* Resumen */}
                    {resumen && (
                        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
                            <Grid item xs={12} sm={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Registros
                                        </Typography>
                                        <Typography variant="h4">
                                            {resumen.totalRegistros}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Cantidad Retirada
                                        </Typography>
                                        <Typography variant="h4">
                                            {resumen.totalCantidad}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    {/* Filtros */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={3}>
                            <DatePicker
                                label="Fecha Inicio"
                                value={filtros.fechaInicio}
                                onChange={(date) => setFiltros(prev => ({ ...prev, fechaInicio: date }))}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <DatePicker
                                label="Fecha Fin"
                                value={filtros.fechaFin}
                                onChange={(date) => setFiltros(prev => ({ ...prev, fechaFin: date }))}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <Autocomplete
                                options={productos || []}
                                getOptionLabel={(option) => option.nombre}
                                value={productos?.find(p => p._id === filtros.productoId) || null}
                                onChange={(_, newValue) => {
                                    setFiltros(prev => ({ ...prev, productoId: newValue?._id || '' }));
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Producto" fullWidth />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <FormControl fullWidth>
                                <InputLabel>Motivo</InputLabel>
                                <Select
                                    value={filtros.motivo}
                                    onChange={(e) => setFiltros(prev => ({ ...prev, motivo: e.target.value }))}
                                    label="Motivo"
                                >
                                    <MenuItem value="">Todos</MenuItem>
                                    <MenuItem value="Caducado">Caducado</MenuItem>
                                    <MenuItem value="Dañado">Dañado</MenuItem>
                                    <MenuItem value="Defectuoso">Defectuoso</MenuItem>
                                    <MenuItem value="Roto">Roto</MenuItem>
                                    <MenuItem value="Contaminado">Contaminado</MenuItem>
                                    <MenuItem value="Otro">Otro</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="outlined"
                                onClick={handleLimpiarFiltros}
                                sx={{ mr: 2 }}
                            >
                                Limpiar Filtros
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<PictureAsPdfIcon />}
                                onClick={handleGenerarPDF}
                            >
                                Generar PDF
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Tabla */}
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Cantidad</TableCell>
                                    <TableCell>Motivo</TableCell>
                                    <TableCell>Registrado por</TableCell>
                                    <TableCell>Observaciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            Cargando...
                                        </TableCell>
                                    </TableRow>
                                ) : productosRetirados.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            No hay productos retirados registrados
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    productosRetirados.map((pr) => (
                                        <TableRow key={pr._id}>
                                            <TableCell>
                                                {new Date(pr.fechaRetiro).toLocaleDateString('es-ES')}
                                            </TableCell>
                                            <TableCell>
                                                {pr.producto.nombre} ({pr.producto.tipo})
                                            </TableCell>
                                            <TableCell>
                                                {pr.cantidad} {pr.producto.unidad_medida}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={pr.motivo} size="small" />
                                            </TableCell>
                                            <TableCell>
                                                {pr.usuarioRegistro.username}
                                            </TableCell>
                                            <TableCell>
                                                {pr.observaciones || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                {/* PDF Dialog */}
                <Dialog
                    open={showPDF}
                    onClose={() => setShowPDF(false)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>Informe de Productos Retirados</DialogTitle>
                    <DialogContent>
                        <ProductosRetiradosPDF
                            productosRetirados={productosRetirados}
                            resumen={resumen}
                            fechaInicio={filtros.fechaInicio}
                            fechaFin={filtros.fechaFin}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowPDF(false)}>Cerrar</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

