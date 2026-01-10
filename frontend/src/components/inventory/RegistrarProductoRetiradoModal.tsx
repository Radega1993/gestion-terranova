import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Typography,
    Autocomplete
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config';
import { authenticatedFetchJson } from '../../utils/apiHelper';
import { Product } from '../../types/product';

interface RegistrarProductoRetiradoModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface ProductoRetiradoForm {
    productoId: string;
    cantidad: number;
    motivo: string;
    fechaRetiro: string;
    observaciones: string;
}

const MOTIVOS_COMUNES = [
    'Caducado',
    'Dañado',
    'Defectuoso',
    'Roto',
    'Contaminado',
    'Otro'
];

export const RegistrarProductoRetiradoModal: React.FC<RegistrarProductoRetiradoModalProps> = ({
    open,
    onClose,
    onSuccess
}) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<ProductoRetiradoForm>({
        productoId: '',
        cantidad: 1,
        motivo: '',
        costoTotal: 0,
        fechaRetiro: new Date().toISOString().split('T')[0],
        observaciones: ''
    });
    const [productoSeleccionado, setProductoSeleccionado] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Obtener productos
    const { data: productos } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: () => authenticatedFetchJson<Product[]>(`${API_BASE_URL}/inventory`)
    });

    // Mutación para crear producto retirado
    const crearProductoRetirado = useMutation({
        mutationFn: async (data: ProductoRetiradoForm) => {
            return authenticatedFetchJson(`${API_BASE_URL}/inventory/productos-retirados`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['productos-retirados'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            onSuccess?.();
            handleClose();
        },
        onError: (error: any) => {
            setError(error.message || 'Error al registrar el producto retirado');
        }
    });

    const handleClose = () => {
        setFormData({
            productoId: '',
            cantidad: 1,
            motivo: '',
            fechaRetiro: new Date().toISOString().split('T')[0],
            observaciones: ''
        });
        setProductoSeleccionado(null);
        setError(null);
        onClose();
    };

    const handleSubmit = () => {
        if (!formData.productoId) {
            setError('Debe seleccionar un producto');
            return;
        }
        if (!formData.motivo) {
            setError('Debe especificar el motivo');
            return;
        }
        if (formData.cantidad <= 0) {
            setError('La cantidad debe ser mayor a 0');
            return;
        }
        if (productoSeleccionado && formData.cantidad > productoSeleccionado.stock_actual) {
            setError(`No hay suficiente stock. Stock disponible: ${productoSeleccionado.stock_actual}`);
            return;
        }

        setError(null);
        crearProductoRetirado.mutate(formData);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Registrar Producto Retirado</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <Autocomplete
                            options={productos || []}
                            getOptionLabel={(option) => `${option.nombre} (Stock: ${option.stock_actual} ${option.unidad_medida})`}
                            value={productoSeleccionado}
                            onChange={(_, newValue) => {
                                setProductoSeleccionado(newValue);
                                setFormData(prev => ({
                                    ...prev,
                                    productoId: newValue?._id || ''
                                }));
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Producto"
                                    required
                                    helperText={productoSeleccionado ? `Stock disponible: ${productoSeleccionado.stock_actual} ${productoSeleccionado.unidad_medida}` : ''}
                                />
                            )}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Cantidad"
                            type="number"
                            value={formData.cantidad}
                            onChange={(e) => {
                                const cantidad = parseInt(e.target.value) || 0;
                                setFormData(prev => ({ ...prev, cantidad }));
                            }}
                            inputProps={{ min: 1 }}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Fecha de Retiro"
                            type="date"
                            value={formData.fechaRetiro}
                            onChange={(e) => setFormData(prev => ({ ...prev, fechaRetiro: e.target.value }))}
                            InputLabelProps={{ shrink: true }}
                            required
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <FormControl fullWidth required>
                            <InputLabel>Motivo</InputLabel>
                            <Select
                                value={formData.motivo}
                                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                                label="Motivo"
                            >
                                {MOTIVOS_COMUNES.map((motivo) => (
                                    <MenuItem key={motivo} value={motivo}>
                                        {motivo}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Observaciones"
                            multiline
                            rows={3}
                            value={formData.observaciones}
                            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={crearProductoRetirado.isPending}
                >
                    {crearProductoRetirado.isPending ? 'Registrando...' : 'Registrar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

