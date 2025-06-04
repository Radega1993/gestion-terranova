import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    TextField,
    IconButton,
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
    Tooltip,
    Stack,
    Autocomplete,
    FormControlLabel,
    Switch,
    InputAdornment,
    SelectChangeEvent
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FileUpload as FileUploadIcon,
    FileDownload as FileDownloadIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Warning as WarningIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Upload as UploadIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, ProductType, CreateProductDto, UpdateProductDto } from '../../types/product';
import { UserRole } from '../../types/user';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';

const STOCK_BAJO = 10;

interface FormData {
    nombre: string;
    tipo: ProductType;
    unidad_medida: string;
    stock_actual: number;
    precio_compra_unitario: number;
    activo: boolean;
}

interface ImportResponse {
    message: string;
    importedCount: number;
}

export const InventoryView: React.FC = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<FormData>({
        nombre: '',
        tipo: ProductType.BEBIDA,
        unidad_medida: '',
        stock_actual: 0,
        precio_compra_unitario: 0,
        activo: true
    });
    const [fileUpload, setFileUpload] = useState<File | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchField, setSearchField] = useState<'nombre' | 'tipo'>('nombre');
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [newType, setNewType] = useState<string>('');
    const [isNewType, setIsNewType] = useState(false);

    const { token, user } = useAuthStore();
    const userRole = user?.role;
    const queryClient = useQueryClient();

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
            handleCloseDialog();
            fetchProducts();
        }
    });

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
            handleCloseDialog();
            fetchProducts();
        }
    });

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
            fetchProducts();
        }
    });

    const toggleActiveMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/inventory/${id}/toggle-active`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            if (!response.ok) {
                throw new Error('Error al cambiar el estado del producto');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            fetchProducts();
        }
    });

    const importMutation = useMutation<ImportResponse, Error, File>({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await fetch(`${API_BASE_URL}/inventory/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error al importar el archivo');
            }

            return response.json();
        },
        onSuccess: () => {
            fetchProducts();
        },
        onError: (error: Error) => {
            console.error('Error al importar:', error);
        }
    });

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let url = `${API_BASE_URL}/inventory`;

            if (searchQuery) {
                url = `${API_BASE_URL}/inventory/search?query=${encodeURIComponent(searchQuery)}&field=${searchField}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al cargar los productos');
            }
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Cargar tipos de productos al montar el componente
        const fetchProductTypes = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/inventory/types`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Error al cargar los tipos de productos');
                }
                const data = await response.json();
                setProductTypes(data);
            } catch (error) {
                console.error('Error fetching product types:', error);
            }
        };

        fetchProductTypes();
    }, [token]);

    useEffect(() => {
        fetchProducts();
    }, [token]);

    // Añadir el debounce para la búsqueda
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchField, token]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    const handleSearchFieldChange = (event: SelectChangeEvent) => {
        setSearchField(event.target.value as 'nombre' | 'tipo');
    };

    const clearSearch = () => {
        setSearchQuery('');
        setSearchField('nombre');
    };

    const handleOpenDialog = (product?: Product) => {
        if (product) {
            setSelectedProduct(product);
            setFormData({
                nombre: product.nombre,
                tipo: product.tipo,
                unidad_medida: product.unidad_medida,
                stock_actual: product.stock_actual,
                precio_compra_unitario: product.precio_compra_unitario,
                activo: product.activo
            });
        } else {
            setSelectedProduct(null);
            setFormData({
                nombre: '',
                tipo: ProductType.BEBIDA,
                unidad_medida: '',
                stock_actual: 0,
                precio_compra_unitario: 0,
                activo: true
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedProduct(null);
        setFormData({
            nombre: '',
            tipo: ProductType.BEBIDA,
            unidad_medida: '',
            stock_actual: 0,
            precio_compra_unitario: 0,
            activo: true
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProduct) {
            updateMutation.mutate({
                id: selectedProduct._id,
                data: formData
            });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleExport = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/inventory/export`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
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
            console.error('Error al exportar:', error);
        }
    };

    const columns: GridColDef[] = [
        { field: 'nombre', headerName: 'Nombre', flex: 1 },
        { field: 'tipo', headerName: 'Tipo', width: 130 },
        { field: 'unidad_medida', headerName: 'Unidad', width: 100 },
        {
            field: 'stock_actual',
            headerName: 'Stock',
            width: 100,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {params.value}
                    {params.value <= STOCK_BAJO && (
                        <Tooltip title="Stock bajo">
                            <WarningIcon color="warning" />
                        </Tooltip>
                    )}
                </Box>
            )
        },
        {
            field: 'precio_compra_unitario',
            headerName: 'Precio Unitario',
            width: 130,
            renderCell: (params) => {
                return `${params.row.precio_compra_unitario.toFixed(2)} €`;
            }
        },
        {
            field: 'activo',
            headerName: 'Estado',
            width: 130,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Activo' : 'Inactivo'}
                    color={params.value ? 'success' : 'error'}
                    size="small"
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 200,
            renderCell: (params) => (
                <Stack direction="row" spacing={1}>
                    {(userRole === UserRole.ADMINISTRADOR || userRole === UserRole.JUNTA) && (
                        <>
                            <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(params.row)}
                                color="primary"
                            >
                                <EditIcon />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => toggleActiveMutation.mutate(params.row._id)}
                                color={params.row.activo ? 'error' : 'success'}
                            >
                                {params.row.activo ? <CancelIcon /> : <CheckCircleIcon />}
                            </IconButton>
                        </>
                    )}
                    {userRole === UserRole.ADMINISTRADOR && (
                        <IconButton
                            size="small"
                            onClick={() => deleteMutation.mutate(params.row._id)}
                            color="error"
                        >
                            <DeleteIcon />
                        </IconButton>
                    )}
                </Stack>
            )
        }
    ];

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h5" component="h1">
                            Gestión de Inventario
                        </Typography>
                    </Box>
                    {(userRole === UserRole.ADMINISTRADOR || userRole === UserRole.JUNTA) && (
                        <Box sx={{ width: '100%' }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                                <Box sx={{ flex: { sm: 2, md: 4 } }}>
                                    <TextField
                                        fullWidth
                                        variant="outlined"
                                        label="Buscar productos"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon />
                                                </InputAdornment>
                                            ),
                                            endAdornment: searchQuery && (
                                                <InputAdornment position="end">
                                                    <IconButton size="small" onClick={clearSearch}>
                                                        <ClearIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />
                                </Box>
                                <Box sx={{ flex: { sm: 1, md: 2 } }}>
                                    <FormControl fullWidth>
                                        <InputLabel>Buscar por</InputLabel>
                                        <Select
                                            value={searchField}
                                            label="Buscar por"
                                            onChange={handleSearchFieldChange}
                                        >
                                            <MenuItem value="nombre">Nombre</MenuItem>
                                            <MenuItem value="tipo">Tipo</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                                <Box sx={{ flex: { sm: 1, md: 2 } }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        startIcon={<AddIcon />}
                                        onClick={() => handleOpenDialog()}
                                    >
                                        Nuevo Producto
                                    </Button>
                                </Box>
                                <Box sx={{ flex: { sm: 1, md: 2 } }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<FileUploadIcon />}
                                        component="label"
                                    >
                                        Importar Excel
                                        <input
                                            type="file"
                                            hidden
                                            accept=".xlsx,.xls"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    importMutation.mutate(file);
                                                }
                                            }}
                                        />
                                    </Button>
                                </Box>
                                <Box sx={{ flex: { sm: 1, md: 2 } }}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<FileDownloadIcon />}
                                        onClick={handleExport}
                                    >
                                        Exportar Excel
                                    </Button>
                                </Box>
                            </Stack>
                        </Box>
                    )}
                </Box>

                <DataGrid
                    rows={products}
                    columns={columns}
                    getRowId={(row) => row._id}
                    autoHeight
                    loading={loading}
                    disableRowSelectionOnClick
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                        sorting: {
                            sortModel: [{ field: 'nombre', sort: 'asc' }],
                        },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                />

                <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                    <form onSubmit={handleSubmit}>
                        <DialogTitle>
                            {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Nombre"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />
                                <Box>
                                    <FormControl fullWidth>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={isNewType}
                                                    onChange={(e) => setIsNewType(e.target.checked)}
                                                />
                                            }
                                            label="Crear nuevo tipo"
                                        />
                                    </FormControl>
                                    {isNewType ? (
                                        <TextField
                                            fullWidth
                                            label="Nuevo tipo de producto"
                                            value={newType}
                                            onChange={(e) => {
                                                setNewType(e.target.value);
                                                setFormData({ ...formData, tipo: e.target.value as ProductType });
                                            }}
                                            required
                                        />
                                    ) : (
                                        <Autocomplete
                                            fullWidth
                                            options={productTypes}
                                            value={formData.tipo}
                                            onChange={(_, newValue) => {
                                                setFormData({ ...formData, tipo: newValue as ProductType });
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Tipo de producto"
                                                    required
                                                />
                                            )}
                                            freeSolo
                                        />
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField
                                            fullWidth
                                            label="Unidad de Medida"
                                            value={formData.unidad_medida}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    unidad_medida: e.target.value
                                                })
                                            }
                                            required
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Stock Actual"
                                            value={formData.stock_actual}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    stock_actual: Number(e.target.value)
                                                })
                                            }
                                            required
                                        />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Precio Unitario"
                                            value={formData.precio_compra_unitario}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(',', '.');
                                                setFormData({
                                                    ...formData,
                                                    precio_compra_unitario: Number(value)
                                                });
                                            }}
                                            required
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancelar</Button>
                            <Button type="submit" variant="contained">
                                {selectedProduct ? 'Guardar' : 'Crear'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Paper>
        </Box>
    );
}; 