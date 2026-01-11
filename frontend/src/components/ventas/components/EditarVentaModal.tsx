import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Alert,
    CircularProgress,
    Chip,
} from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';
import { UserRole } from '../../../types/user';
import { ProductoSelector } from './ProductoSelector';
import { SocioSelector } from './SocioSelector';
import { UsuarioSelector } from './UsuarioSelector';
import { TrabajadorSelector } from '../../trabajadores/TrabajadorSelector';
import { trabajadoresService, Trabajador } from '../../../services/trabajadores';
import { tiendasService, Tienda } from '../../../services/tiendas';
import { Producto, ProductoSeleccionado, Cliente } from '../types';

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

interface EditarVentaModalProps {
    open: boolean;
    venta: Venta;
    onClose: () => void;
    onVentaActualizada: () => void;
}

export const EditarVentaModal: React.FC<EditarVentaModalProps> = ({
    open,
    venta,
    onClose,
    onVentaActualizada
}) => {
    const { token, userRole } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Estados del formulario
    const [socio, setSocio] = useState<Cliente | null>(null);
    const [productos, setProductos] = useState<ProductoSeleccionado[]>([]);
    const [total, setTotal] = useState(0);
    const [pagado, setPagado] = useState(0);
    const [metodoPago, setMetodoPago] = useState<string>('EFECTIVO');
    const [estado, setEstado] = useState<string>('PENDIENTE');
    const [observaciones, setObservaciones] = useState<string>('');
    const [usuarioId, setUsuarioId] = useState<string | null>(null);
    const [trabajadorId, setTrabajadorId] = useState<string | null>(null);
    const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
    const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
    const [usuarioTienda, setUsuarioTienda] = useState<any>(null);
    const [loadingUsuarioTienda, setLoadingUsuarioTienda] = useState(false);

    useEffect(() => {
        if (venta && open) {
            // Inicializar el formulario con los datos de la venta
            setSocio({
                _id: venta.codigoSocio,
                codigo: venta.codigoSocio,
                nombreCompleto: venta.nombreSocio,
                tipo: venta.esSocio ? 'Socio' : 'Asociado'
            });
            
            setProductos(venta.productos.map(p => ({
                _id: '',
                nombre: p.nombre,
                tipo: p.categoria || '',
                unidad_medida: '',
                stock_actual: 0,
                precio_compra_unitario: p.precioUnitario,
                activo: true,
                unidades: p.unidades,
                precioUnitario: p.precioUnitario,
                precioTotal: p.precioTotal
            })));
            
            setTotal(venta.total);
            setPagado(venta.pagado);
            setMetodoPago(venta.metodoPago || 'EFECTIVO');
            setEstado(venta.estado);
            setObservaciones(venta.observaciones || '');
            
            // Si hay trabajador, solo establecer trabajador; si no, establecer usuario
            if (venta.trabajador) {
                setTrabajadorId(venta.trabajador._id);
                setUsuarioId(null);
            } else {
                setUsuarioId(venta.usuario._id);
                setTrabajadorId(null);
            }
        }
    }, [venta, open]);

    // Cargar trabajadores para ADMINISTRADOR
    useEffect(() => {
        const loadTrabajadores = async () => {
            if (userRole === UserRole.ADMINISTRADOR && open) {
                try {
                    setLoadingTrabajadores(true);
                    const data = await trabajadoresService.getAll();
                    setTrabajadores(data.filter(t => t.activo));
                } catch (error) {
                    console.error('Error al cargar trabajadores:', error);
                    setTrabajadores([]);
                } finally {
                    setLoadingTrabajadores(false);
                }
            }
        };
        loadTrabajadores();
    }, [userRole, open]);

    // Cuando se selecciona un trabajador, obtener su tienda y el usuario TIENDA
    useEffect(() => {
        const loadUsuarioTienda = async () => {
            if (trabajadorId) {
                try {
                    setLoadingUsuarioTienda(true);
                    // Obtener el trabajador completo
                    const trabajador = await trabajadoresService.getById(trabajadorId);
                    
                    // Obtener la tienda del trabajador
                    const tiendaId = typeof trabajador.tienda === 'string' 
                        ? trabajador.tienda 
                        : trabajador.tienda._id;
                    
                    const tienda = await tiendasService.getById(tiendaId);
                    
                    // Obtener el usuario TIENDA asignado a la tienda
                    if (tienda.usuarioAsignado) {
                        const usuarioIdTienda = typeof tienda.usuarioAsignado === 'string'
                            ? tienda.usuarioAsignado
                            : tienda.usuarioAsignado._id;
                        
                        const response = await fetch(`${API_BASE_URL}/users/${usuarioIdTienda}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        
                        if (response.ok) {
                            const usuarioData = await response.json();
                            setUsuarioTienda(usuarioData);
                            // Establecer automáticamente el usuarioId cuando hay trabajador
                            setUsuarioId(usuarioIdTienda);
                        } else {
                            setError('No se pudo obtener el usuario TIENDA de la tienda');
                            setUsuarioTienda(null);
                        }
                    } else {
                        setError('La tienda del trabajador no tiene un usuario TIENDA asignado');
                        setUsuarioTienda(null);
                    }
                } catch (error: any) {
                    console.error('Error al cargar usuario TIENDA:', error);
                    setError(error.message || 'Error al obtener el usuario TIENDA');
                    setUsuarioTienda(null);
                } finally {
                    setLoadingUsuarioTienda(false);
                }
            } else {
                setUsuarioTienda(null);
            }
        };
        loadUsuarioTienda();
    }, [trabajadorId, token]);

    useEffect(() => {
        // Recalcular total cuando cambian los productos
        const nuevoTotal = productos.reduce((sum, p) => sum + p.precioTotal, 0);
        setTotal(nuevoTotal);
    }, [productos]);

    const handleProductoSeleccionado = (producto: Producto) => {
        const precioUnitario = producto.precio_compra_unitario;
        const nuevoProducto: ProductoSeleccionado = {
            ...producto,
            unidades: 1,
            precioUnitario: precioUnitario,
            precioTotal: precioUnitario
        };
        setProductos(prev => [...prev, nuevoProducto]);
    };

    const handleUnidadesChange = (index: number, nuevasUnidades: number) => {
        if (nuevasUnidades < 1) return;
        setProductos(prev => prev.map((producto, i) => {
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

    const handlePrecioUnitarioChange = (index: number, nuevoPrecio: number) => {
        if (nuevoPrecio < 0) return;
        setProductos(prev => prev.map((producto, i) => {
            if (i === index) {
                return {
                    ...producto,
                    precioUnitario: nuevoPrecio,
                    precioTotal: nuevoPrecio * producto.unidades
                };
            }
            return producto;
        }));
    };

    const handleEliminarProducto = (index: number) => {
        setProductos(prev => prev.filter((_, i) => i !== index));
    };

    const handleGuardar = async () => {
        if (!socio) {
            setError('Debe seleccionar un socio');
            return;
        }
        if (productos.length === 0) {
            setError('Debe agregar al menos un producto');
            return;
        }
        if (pagado > total) {
            setError('El monto pagado no puede ser mayor al total');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const updateData: any = {
                codigoSocio: socio.codigo,
                nombreSocio: socio.nombreCompleto,
                esSocio: socio.tipo === 'Socio',
                productos: productos.map(p => ({
                    nombre: p.nombre,
                    unidades: p.unidades,
                    precioUnitario: p.precioUnitario,
                    precioTotal: p.precioTotal
                })),
                total: total,
                pagado: pagado,
                metodoPago: metodoPago,
                observaciones: observaciones,
                estado: estado
            };

            // Usuario y trabajador son mutuamente excluyentes
            // IMPORTANTE: El usuario siempre debe existir (requerido por el schema)
            // Si hay trabajador, el backend establecerá automáticamente el usuario TIENDA
            // Si hay usuario, establecer usuario y limpiar trabajador
            if (trabajadorId) {
                updateData.trabajadorId = trabajadorId;
                // El backend establecerá automáticamente el usuario TIENDA de la tienda del trabajador
                // No es necesario enviar usuarioId, el backend lo manejará
            } else if (usuarioId) {
                updateData.usuarioId = usuarioId;
                updateData.trabajadorId = null; // Asegurar que no hay trabajador si hay usuario
            } else {
                // Si no hay ninguno seleccionado, mantener el usuario original
                updateData.usuarioId = venta.usuario._id;
                updateData.trabajadorId = null;
            }

            const response = await fetch(`${API_BASE_URL}/ventas/${venta._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar la venta');
            }

            onVentaActualizada();
        } catch (error: any) {
            setError(error.message || 'Error desconocido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Editar Venta
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                        <SocioSelector
                            onClienteSeleccionado={setSocio}
                            value={socio}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box>
                            <UsuarioSelector
                                onUsuarioSeleccionado={(usuario) => {
                                    if (usuario) {
                                        setUsuarioId(usuario._id);
                                        setTrabajadorId(null); // Limpiar trabajador si se selecciona usuario
                                        setUsuarioTienda(null); // Limpiar usuario tienda
                                    } else {
                                        setUsuarioId(null);
                                    }
                                }}
                                value={usuarioId ? (usuarioTienda ? {
                                    _id: usuarioTienda._id,
                                    username: usuarioTienda.username,
                                    nombre: usuarioTienda.nombre || '',
                                    apellidos: usuarioTienda.apellidos || '',
                                    role: usuarioTienda.role || '',
                                    activo: usuarioTienda.isActive !== false,
                                    lastLogin: usuarioTienda.lastLogin || ''
                                } : {
                                    _id: usuarioId,
                                    username: venta.usuario.username,
                                    nombre: venta.usuario.nombre || '',
                                    apellidos: '',
                                    role: '',
                                    activo: true,
                                    lastLogin: ''
                                }) : null}
                                excluirTienda={false}
                                disabled={!!trabajadorId} // Deshabilitar si hay trabajador seleccionado
                            />
                            {trabajadorId && (
                                <Box sx={{ mt: 1 }}>
                                    {loadingUsuarioTienda ? (
                                        <Typography variant="caption" color="text.secondary">
                                            Cargando usuario TIENDA...
                                        </Typography>
                                    ) : usuarioTienda ? (
                                        <Alert severity="info" sx={{ mt: 1 }}>
                                            Usuario TIENDA asignado automáticamente: <strong>{usuarioTienda.username}</strong>
                                        </Alert>
                                    ) : (
                                        <Alert severity="warning" sx={{ mt: 1 }}>
                                            No se pudo obtener el usuario TIENDA de la tienda del trabajador
                                        </Alert>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        {userRole === UserRole.ADMINISTRADOR ? (
                            <FormControl fullWidth>
                                <InputLabel>Trabajador</InputLabel>
                                <Select
                                    value={trabajadorId || ''}
                                    onChange={(e) => {
                                        const nuevoTrabajadorId = e.target.value || null;
                                        if (nuevoTrabajadorId) {
                                            setTrabajadorId(nuevoTrabajadorId);
                                            setUsuarioId(null); // Limpiar usuario si se selecciona trabajador
                                        } else {
                                            setTrabajadorId(null);
                                        }
                                    }}
                                    label="Trabajador"
                                    disabled={loadingTrabajadores}
                                >
                                    <MenuItem value="">Ninguno</MenuItem>
                                    {trabajadores.map(trabajador => (
                                        <MenuItem key={trabajador._id} value={trabajador._id}>
                                            {trabajador.nombre} ({trabajador.identificador})
                                        </MenuItem>
                                    ))}
                                </Select>
                                {loadingTrabajadores && (
                                    <Box sx={{ mt: 1 }}>
                                        <CircularProgress size={20} />
                                    </Box>
                                )}
                            </FormControl>
                        ) : (
                            <TrabajadorSelector
                                value={trabajadorId || undefined}
                                onChange={(id) => {
                                    if (id) {
                                        setTrabajadorId(id);
                                        setUsuarioId(null); // Limpiar usuario si se selecciona trabajador
                                    } else {
                                        setTrabajadorId(null);
                                    }
                                }}
                                required={false}
                            />
                        )}
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Método de Pago</InputLabel>
                            <Select
                                value={metodoPago}
                                label="Método de Pago"
                                onChange={(e) => setMetodoPago(e.target.value)}
                            >
                                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                                <MenuItem value="TARJETA">Tarjeta</MenuItem>
                                <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Estado</InputLabel>
                            <Select
                                value={estado}
                                label="Estado"
                                onChange={(e) => setEstado(e.target.value)}
                            >
                                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                                <MenuItem value="PAGADO_PARCIAL">Pago Parcial</MenuItem>
                                <MenuItem value="PAGADO">Pagado</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Productos
                        </Typography>
                        <ProductoSelector
                            onProductoSeleccionado={handleProductoSeleccionado}
                        />
                        <List>
                            {productos.map((producto, index) => (
                                <ListItem key={index}>
                                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {producto.nombre}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                            <TextField
                                                type="number"
                                                label="Unidades"
                                                value={producto.unidades}
                                                onChange={(e) => handleUnidadesChange(index, parseInt(e.target.value) || 1)}
                                                size="small"
                                                sx={{ width: 100 }}
                                                inputProps={{ min: 1 }}
                                            />
                                            <TextField
                                                type="number"
                                                label="Precio Unitario"
                                                value={producto.precioUnitario.toFixed(2)}
                                                onChange={(e) => handlePrecioUnitarioChange(index, parseFloat(e.target.value) || 0)}
                                                size="small"
                                                sx={{ width: 120 }}
                                                inputProps={{ min: 0, step: 0.01 }}
                                            />
                                            <Typography variant="body2" sx={{ ml: 1 }}>
                                                Total: {producto.precioTotal.toFixed(2)}€
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            onClick={() => handleEliminarProducto(index)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Total"
                            type="number"
                            value={total.toFixed(2)}
                            InputProps={{ readOnly: true }}
                            helperText="Calculado automáticamente"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Pagado"
                            type="number"
                            value={pagado}
                            onChange={(e) => setPagado(parseFloat(e.target.value) || 0)}
                            inputProps={{ min: 0, step: 0.01 }}
                            error={pagado > total}
                            helperText={pagado > total ? 'El monto pagado no puede ser mayor al total' : ''}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Observaciones"
                            multiline
                            rows={3}
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleGuardar}
                    variant="contained"
                    disabled={loading || productos.length === 0 || !socio || pagado > total}
                >
                    {loading ? <CircularProgress size={24} /> : 'Guardar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

