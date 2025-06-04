import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Grid
} from '@mui/material';
import { ProductType } from '../../types/product';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';

interface ProductTypeOption {
    id: string;
    nombre: string;
}

interface ProductFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData, onSubmit, isLoading }) => {
    const { token } = useAuthStore();
    const { register, handleSubmit } = useForm({
        defaultValues: initialData
    });

    // Consulta para obtener tipos de producto
    const { data: productTypes, isLoading: isLoadingTypes } = useQuery<ProductTypeOption[]>({
        queryKey: ['productTypes'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/inventory/types`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al cargar los tipos de producto');
            }
            return response.json();
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Nombre"
                        {...register('nombre')}
                        required
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Descripción"
                        {...register('descripcion')}
                        multiline
                        rows={4}
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel>Tipo de Producto</InputLabel>
                        <Select
                            {...register('tipoId')}
                            label="Tipo de Producto"
                            disabled={isLoadingTypes}
                            required
                        >
                            {productTypes?.map((type) => (
                                <MenuItem key={type.id} value={type.id}>
                                    {type.nombre}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={isLoading}
                    >
                        {isLoading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
}; 