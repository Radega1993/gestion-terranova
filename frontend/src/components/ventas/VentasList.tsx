import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { ProductoSelector } from './components/ProductoSelector';
import { ProductosList } from './components/ProductosList';
import { SocioSelector } from './components/SocioSelector';
import { Producto, ProductoSeleccionado } from './types';

interface NombreSocio {
    nombre: string;
    primerApellido: string;
    segundoApellido: string;
}

interface Socio {
    _id: string;
    socio: string;
    nombre: NombreSocio;
    casa: number;
    totalSocios: number;
    numPersonas: number;
    adheridos: number;
    menor3Años: number;
    cuota: number;
    rgpd: boolean;
}

const VentasList: React.FC = () => {
    const { token } = useAuthStore();
    const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
    const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProductos = async () => {
        if (!token) {
            console.error('No hay token disponible');
            return;
        }

        try {
            console.log('Haciendo petición de productos con token:', token);
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
            console.log('Productos cargados:', data);
            setProductos(data);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            setError(error instanceof Error ? error.message : 'Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductos();
    }, [token]);

    const handleProductoSelect = (producto: Producto | null) => {
        if (!producto) return;

        console.log('Producto seleccionado completo:', producto);
        // Asegurarnos de que el precio sea un número válido
        const precio = typeof producto.precio_compra_unitario === 'number' ? producto.precio_compra_unitario : 0;
        console.log('Producto seleccionado con precio:', precio);

        const productoExistente = productosSeleccionados.find(p => p._id === producto._id);

        if (productoExistente) {
            // Si el producto ya está en la lista, incrementar la cantidad
            setProductosSeleccionados(prev =>
                prev.map(p =>
                    p._id === producto._id
                        ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * precio }
                        : p
                )
            );
        } else {
            // Si es un producto nuevo, añadirlo a la lista
            setProductosSeleccionados(prev => [
                ...prev,
                {
                    ...producto,
                    precio_compra_unitario: precio, // Aseguramos que el precio sea un número
                    cantidad: 1,
                    subtotal: precio
                }
            ]);
        }
    };

    const handleCantidadChange = (id: string, nuevaCantidad: number) => {
        if (nuevaCantidad < 1) return;

        setProductosSeleccionados(prev =>
            prev.map(p =>
                p._id === id
                    ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio_compra_unitario }
                    : p
            )
        );
    };

    const handleEliminarProducto = (id: string) => {
        setProductosSeleccionados(prev => prev.filter(p => p._id !== id));
    };

    const handleSocioSelect = (socio: Socio | null) => {
        console.log('Socio seleccionado:', socio);
        setSocioSeleccionado(socio);
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

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                TPV - Terminal Punto de Venta
            </Typography>

            <Grid container spacing={3}>
                {/* Panel de selección de productos y socio */}
                <Grid item xs={12} md={4}>
                    <ProductoSelector
                        productos={productos}
                        isLoading={loading}
                        onProductoSelect={handleProductoSelect}
                    />
                    <SocioSelector onSocioSelect={handleSocioSelect} />
                </Grid>

                {/* Lista de productos seleccionados */}
                <Grid item xs={12} md={8}>
                    <ProductosList
                        productos={productosSeleccionados}
                        onCantidadChange={handleCantidadChange}
                        onEliminarProducto={handleEliminarProducto}
                    />
                </Grid>
            </Grid>
        </Container>
    );
};

export default VentasList; 