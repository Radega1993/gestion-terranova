import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography
} from '@mui/material';
import { Product } from '../../types/product';

interface AddStockModalProps {
    open: boolean;
    product: Product | null;
    loading: boolean;
    error?: string;
    onClose: () => void;
    onSubmit: (cantidad: number, observaciones: string) => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
    open,
    product,
    loading,
    error,
    onClose,
    onSubmit
}) => {
    const [cantidad, setCantidad] = useState<number>(1);
    const [observaciones, setObservaciones] = useState<string>('');

    useEffect(() => {
        if (open) {
            setCantidad(1);
            setObservaciones('');
        }
    }, [open]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!product) {
            return;
        }
        onSubmit(cantidad, observaciones);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Añadir stock</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <Typography variant="subtitle1">
                            {product ? `${product.nombre} (${product.tipo})` : 'Selecciona un producto'}
                        </Typography>
                        <TextField
                            type="number"
                            label="Cantidad a añadir"
                            value={cantidad}
                            inputProps={{ min: 1 }}
                            onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                            required
                            fullWidth
                        />
                        <TextField
                            label="Observaciones"
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            multiline
                            rows={3}
                            fullWidth
                        />
                        {error && (
                            <Typography color="error" variant="body2">
                                {error}
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Guardando...' : 'Añadir stock'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
