import React, { useState } from 'react';
import { Container, Typography, Grid, CircularProgress, Alert, Button, Box, Paper, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Divider } from '@mui/material';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { ProductoSelector } from './components/ProductoSelector';
import { SocioSelector } from './components/SocioSelector';
import { PagoModal } from './components/PagoModal';
import { Producto, ProductoSeleccionado, Cliente } from './types';
import DeleteIcon from '@mui/icons-material/Delete';

const VentasList: React.FC = () => {
    const { token } = useAuthStore();
    const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
    const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalPagoOpen, setModalPagoOpen] = useState(false);

    const fetchProductos = async () => {
        if (!token) {
            console.error('No hay token disponible');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/inventory`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar productos');
            }

            const data = await response.json();
            setProductosDisponibles(data);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            setError(error instanceof Error ? error.message : 'Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchProductos();
    }, [token]);

    const handleProductoSeleccionado = (producto: Producto) => {
        console.log('Producto seleccionado completo:', producto);
        const precioUnitario = producto.precio_compra_unitario;
        console.log('Producto seleccionado con precio:', precioUnitario);

        const nuevoProducto: ProductoSeleccionado = {
            ...producto,
            unidades: 1,
            precioUnitario: precioUnitario,
            precioTotal: precioUnitario
        };

        setProductosSeleccionados(prev => [...prev, nuevoProducto]);
    };

    const handleUnidadesChange = (index: number, nuevasUnidades: number) => {
        if (nuevasUnidades < 1) return;

        setProductosSeleccionados(prev => prev.map((producto, i) => {
            if (i === index) {
                return {
                    ...producto,
                    unidades: nuevasUnidades,
                    precioTotal: producto.precioUnitario * nuevasUnidades
                };
            }
            return producto;
        }));
    };

    const handleEliminarProducto = (index: number) => {
        setProductosSeleccionados(prev => prev.filter((_, i) => i !== index));
    };

    const handleVentaCompletada = () => {
        setProductosSeleccionados([]);
        setClienteSeleccionado(null);
        fetchProductos();
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            </Container>
        );
    }

    const total = productosSeleccionados.reduce((sum, producto) => sum + producto.precioTotal, 0);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                TPV - Terminal Punto de Venta
            </Typography>

            <Grid container spacing={3}>
                {/* Panel de selección de productos y cliente */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Seleccionar Cliente
                        </Typography>
                        <SocioSelector
                            onClienteSeleccionado={setClienteSeleccionado}
                            value={clienteSeleccionado}
                        />
                    </Paper>
                </Grid>

                {/* Lista de productos seleccionados */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Seleccionar Productos
                        </Typography>
                        <ProductoSelector
                            onProductoSeleccionado={handleProductoSeleccionado}
                        />
                    </Paper>

                    <Paper sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Productos Seleccionados
                        </Typography>
                        <List>
                            {productosSeleccionados.map((producto, index) => (
                                <React.Fragment key={index}>
                                    <ListItem>
                                        <ListItemText
                                            primary={producto.nombre}
                                            secondary={`${producto.unidades} x ${producto.precioUnitario.toFixed(2)}€ = ${producto.precioTotal.toFixed(2)}€`}
                                        />
                                        <ListItemSecondaryAction>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Button
                                                    size="small"
                                                    onClick={() => handleUnidadesChange(index, producto.unidades - 1)}
                                                    disabled={producto.unidades <= 1}
                                                >
                                                    -
                                                </Button>
                                                <Typography>{producto.unidades}</Typography>
                                                <Button
                                                    size="small"
                                                    onClick={() => handleUnidadesChange(index, producto.unidades + 1)}
                                                >
                                                    +
                                                </Button>
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete"
                                                    onClick={() => handleEliminarProducto(index)}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < productosSeleccionados.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">
                                Total: {total.toFixed(2)}€
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={() => setModalPagoOpen(true)}
                                disabled={!clienteSeleccionado || productosSeleccionados.length === 0}
                            >
                                Realizar Pago
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            <PagoModal
                open={modalPagoOpen}
                onClose={() => setModalPagoOpen(false)}
                productos={productosSeleccionados}
                cliente={clienteSeleccionado}
                onVentaCompletada={handleVentaCompletada}
            />
        </Container>
    );
};

export default VentasList; 