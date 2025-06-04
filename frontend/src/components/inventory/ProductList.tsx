import React, { useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Switch,
    FormControlLabel,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, ProductType, CreateProductDto, UpdateProductDto } from '../../types/product';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';

const ProductList: React.FC = () => {
    const queryClient = useQueryClient();
    const { token } = useAuthStore();
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<CreateProductDto>({
        nombre: '',
        tipo: ProductType.OTRO,
        unidad_medida: '',
        stock_actual: 0,
        precio_compra_unitario: 0,
        activo: true,
    });

    // Consulta para obtener productos
    const { data: products, isLoading } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/inventory`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al cargar los productos');
            }
            return response.json();
        }
    });

    // Mutación para crear producto
    const createMutation = useMutation({
        mutationFn: async (newProduct: CreateProductDto) => {
            const response = await fetch(`${API_BASE_URL}/inventory`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newProduct)
            });
            if (!response.ok) {
                throw new Error('Error al crear el producto');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setCreateDialogOpen(false);
            resetForm();
        }
    });

    // Mutación para actualizar producto
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateProductDto }) => {
            const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error('Error al actualizar el producto');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setEditDialogOpen(false);
            setSelectedProduct(null);
        }
    });

    // Mutación para eliminar producto
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al eliminar el producto');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });

    // Mutación para cambiar estado activo/inactivo
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
            const response = await fetch(`${API_BASE_URL}/inventory/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ activo: isActive })
            });
            if (!response.ok) {
                throw new Error('Error al cambiar el estado del producto');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        }
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProduct) {
            updateMutation.mutate({
                id: selectedProduct._id,
                data: formData as UpdateProductDto
            });
        }
    };

    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setFormData({
            nombre: product.nombre,
            tipo: product.tipo,
            unidad_medida: product.unidad_medida,
            stock_actual: product.stock_actual,
            precio_compra_unitario: product.precio_compra_unitario,
            activo: product.activo,
        });
        setEditDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleStatus = (id: string, currentStatus: boolean) => {
        toggleStatusMutation.mutate({ id, isActive: !currentStatus });
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            tipo: ProductType.OTRO,
            unidad_medida: '',
            stock_actual: 0,
            precio_compra_unitario: 0,
            activo: true,
        });
    };

    const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/inventory/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) {
                throw new Error('Error al importar el archivo Excel');
            }
            queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error) {
            console.error('Error importing Excel:', error);
            alert('Error al importar el archivo Excel');
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/inventory/export`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al exportar');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'productos.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting Excel:', error);
            alert('Error al exportar a Excel');
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Inventario</Typography>
                <Box>
                    <input
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                        id="import-excel"
                        type="file"
                        onChange={handleImportExcel}
                    />
                    <label htmlFor="import-excel">
                        <Button component="span" variant="contained" color="primary" style={{ marginRight: 8 }}>
                            Importar Excel
                        </Button>
                    </label>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleExportExcel}
                        style={{ marginRight: 8 }}
                    >
                        Exportar Excel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        Nuevo Producto
                    </Button>
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Unidad de Medida</TableCell>
                            <TableCell align="right">Stock Actual</TableCell>
                            <TableCell align="right">Precio Compra</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {products?.map((product) => (
                            <TableRow key={product._id}>
                                <TableCell>{product.nombre}</TableCell>
                                <TableCell>{product.tipo}</TableCell>
                                <TableCell>{product.unidad_medida}</TableCell>
                                <TableCell align="right">{product.stock_actual}</TableCell>
                                <TableCell align="right">{product.precio_compra_unitario.toFixed(2)} €</TableCell>
                                <TableCell>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={product.activo}
                                                onChange={() => handleToggleStatus(product._id, product.activo)}
                                                color="primary"
                                            />
                                        }
                                        label={product.activo ? 'Activo' : 'Inactivo'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEditClick(product)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDeleteClick(product._id)} color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Diálogo de Creación */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleCreateSubmit}>
                    <DialogTitle>Crear Nuevo Producto</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            margin="normal"
                            required
                        />
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as ProductType })}
                                label="Tipo"
                            >
                                {Object.values(ProductType).map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Unidad de Medida"
                            value={formData.unidad_medida}
                            onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Stock Actual"
                            value={formData.stock_actual}
                            onChange={(e) => setFormData({ ...formData, stock_actual: Number(e.target.value) })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Precio Compra Unitario"
                            value={formData.precio_compra_unitario}
                            onChange={(e) => setFormData({ ...formData, precio_compra_unitario: Number(e.target.value) })}
                            margin="normal"
                            required
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary">
                            Crear
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Diálogo de Edición */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleEditSubmit}>
                    <DialogTitle>Editar Producto</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Nombre"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            margin="normal"
                            required
                        />
                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                                value={formData.tipo}
                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as ProductType })}
                                label="Tipo"
                            >
                                {Object.values(ProductType).map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Unidad de Medida"
                            value={formData.unidad_medida}
                            onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Stock Actual"
                            value={formData.stock_actual}
                            onChange={(e) => setFormData({ ...formData, stock_actual: Number(e.target.value) })}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Precio Compra Unitario"
                            value={formData.precio_compra_unitario}
                            onChange={(e) => setFormData({ ...formData, precio_compra_unitario: Number(e.target.value) })}
                            margin="normal"
                            required
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary">
                            Guardar
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default ProductList; 