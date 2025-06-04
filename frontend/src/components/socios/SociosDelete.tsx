import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';

interface SociosDeleteProps {
    open: boolean;
    onClose: () => void;
    socioId: string;
}

const SociosDelete: React.FC<SociosDeleteProps> = ({ open, onClose, socioId }) => {
    const queryClient = useQueryClient();
    const { token } = useAuth();

    // Mutación para eliminar un socio
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${API_BASE_URL}/socios/${socioId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al eliminar el socio');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['socios'] });
            Swal.fire({
                icon: 'success',
                title: 'Socio eliminado',
                text: 'El socio ha sido eliminado correctamente'
            });
            onClose();
        },
        onError: (error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el socio'
            });
        },
    });

    const handleDelete = () => {
        deleteMutation.mutate();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Eliminar Socio</DialogTitle>
            <DialogContent>
                <Typography>
                    ¿Está seguro que desea eliminar este socio? Esta acción no se puede deshacer.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancelar
                </Button>
                <Button
                    onClick={handleDelete}
                    color="error"
                    variant="contained"
                    disabled={deleteMutation.isPending}
                >
                    Eliminar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SociosDelete; 