import React from 'react';
import {
    Box,
    Typography,
    Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';
import { Socio } from '../../types/socio';
import SociosForm from './SociosForm';
import Swal from 'sweetalert2';

const SociosCreate: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    // Mutación para crear un socio
    const createMutation = useMutation({
        mutationFn: async (data: Partial<Socio>) => {
            const response = await fetch(`${API_BASE_URL}/socios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error('Error al crear el socio');
            }
            return response.json();
        },
        onSuccess: () => {
            Swal.fire({
                icon: 'success',
                title: 'Socio creado',
                text: 'El socio ha sido creado correctamente'
            });
            navigate('/socios');
        },
        onError: (error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo crear el socio'
            });
        },
    });

    const handleSubmit = (data: Partial<Socio>) => {
        createMutation.mutate(data);
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    Crear Nuevo Socio
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/socios')}
                >
                    Volver
                </Button>
            </Box>

            <SociosForm
                onSubmit={handleSubmit}
                isLoading={createMutation.isPending}
            />
        </Box>
    );
};

export default SociosCreate; 