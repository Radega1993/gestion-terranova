import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';
import { Socio } from '../../types/socio';
import { formatCurrency } from '../../utils/formatters';

const SociosDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Query para obtener los detalles del socio
    const { data: socio, isLoading } = useQuery({
        queryKey: ['socio', id],
        queryFn: async () => {
            if (!id) throw new Error('No hay ID de socio');
            const response = await fetch(`${API_BASE_URL}/socios/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al cargar el socio');
            }
            return response.json();
        },
        enabled: !!id && !!token,
    });

    // Query para obtener productos consumidos
    const { data: productosData, isLoading: isLoadingProductos } = useQuery({
        queryKey: ['productos-consumidos', id],
        queryFn: async () => {
            if (!id) throw new Error('No hay ID de socio');
            const response = await fetch(`${API_BASE_URL}/socios/${id}/productos-consumidos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al cargar los productos consumidos');
            }
            return response.json();
        },
        enabled: !!id && !!token,
    });

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!socio) {
        return (
            <Box>
                <Typography variant="h6" color="error">
                    No se encontró el socio
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    Detalles del Socio
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/socios')}
                >
                    Volver
                </Button>
            </Box>

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Información Personal
                        </Typography>
                        <Typography>
                            <strong>Nombre:</strong> {socio.nombre.nombre} {socio.nombre.primerApellido} {socio.nombre.segundoApellido}
                        </Typography>
                        <Typography>
                            <strong>Número de Socio:</strong> {socio.socio}
                        </Typography>
                        <Typography>
                            <strong>Estado:</strong>{' '}
                            <Chip
                                label={socio.activo ? 'Activo' : 'Inactivo'}
                                color={socio.activo ? 'success' : 'error'}
                                size="small"
                            />
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Contacto
                        </Typography>
                        <Typography>
                            <strong>Teléfonos:</strong>{' '}
                            {socio.contacto.telefonos.join(', ')}
                        </Typography>
                        <Typography>
                            <strong>Emails:</strong>{' '}
                            {socio.contacto.email.join(', ')}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Dirección
                        </Typography>
                        <Typography>
                            {socio.direccion.calle}, {socio.direccion.numero}
                        </Typography>
                        <Typography>
                            {socio.direccion.colonia}, {socio.direccion.ciudad}
                        </Typography>
                        <Typography>
                            {socio.direccion.estado}, CP: {socio.direccion.cp}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Productos Consumidos */}
            <Paper sx={{ p: 3, mt: 3 }}>
                <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">
                            Productos Consumidos
                            {productosData && (
                                <Chip 
                                    label={`${productosData.resumen.totalProductosDiferentes} productos`} 
                                    size="small" 
                                    sx={{ ml: 2 }} 
                                />
                            )}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {isLoadingProductos ? (
                            <Box display="flex" justifyContent="center" p={3}>
                                <CircularProgress />
                            </Box>
                        ) : productosData && productosData.productosConsumidos.length > 0 ? (
                            <>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={4}>
                                        <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                                            <Typography variant="subtitle2">Total Ventas</Typography>
                                            <Typography variant="h5">{productosData.totalVentas}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                                            <Typography variant="subtitle2">Total Unidades</Typography>
                                            <Typography variant="h5">{productosData.resumen.totalUnidades}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                                            <Typography variant="subtitle2">Total Importe</Typography>
                                            <Typography variant="h5">{formatCurrency(productosData.resumen.totalImporte)}</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Producto</strong></TableCell>
                                                <TableCell><strong>Categoría</strong></TableCell>
                                                <TableCell align="right"><strong>Total Unidades</strong></TableCell>
                                                <TableCell align="right"><strong>Total Importe</strong></TableCell>
                                                <TableCell align="right"><strong>Compras</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {productosData.productosConsumidos
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                .map((producto: any, index: number) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{producto.nombre}</TableCell>
                                                        <TableCell>{producto.categoria || '-'}</TableCell>
                                                        <TableCell align="right">{producto.totalUnidades}</TableCell>
                                                        <TableCell align="right">{formatCurrency(producto.totalImporte)}</TableCell>
                                                        <TableCell align="right">{producto.ventas.length}</TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    component="div"
                                    count={productosData.productosConsumidos.length}
                                    page={page}
                                    onPageChange={(_, newPage) => setPage(newPage)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                />
                            </>
                        ) : (
                            <Typography color="text.secondary">
                                No se han encontrado productos consumidos para este socio.
                            </Typography>
                        )}
                    </AccordionDetails>
                </Accordion>
            </Paper>
        </Box>
    );
};

export default SociosDetails; 