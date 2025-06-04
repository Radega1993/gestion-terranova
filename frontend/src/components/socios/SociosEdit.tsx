import React from 'react';
import {
    Box,
    Typography,
    Button,
    CircularProgress,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';
import { Socio, SocioWithId } from '../../types/socio';
import SociosForm from './SociosForm';
import Swal from 'sweetalert2';

const SociosEdit: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();

    // Query para obtener los datos del socio
    const { data: socio, isLoading } = useQuery<SocioWithId>({
        queryKey: ['socio', id],
        queryFn: async () => {
            if (!id) throw new Error('No hay ID de socio');
            const response = await fetch(`${API_BASE_URL}/socios/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al cargar el socio');
            }
            return response.json();
        },
        enabled: !!id && !!token,
    });

    // Mutación para actualizar un socio
    const updateMutation = useMutation({
        mutationFn: async (data: Partial<Socio>) => {
            if (!id) throw new Error('No hay ID de socio');
            const response = await fetch(`${API_BASE_URL}/socios/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                throw new Error('Error al actualizar el socio');
            }
            return response.json();
        },
        onSuccess: () => {
            Swal.fire({
                icon: 'success',
                title: 'Socio actualizado',
                text: 'El socio ha sido actualizado correctamente'
            });
            navigate('/socios');
        },
        onError: (error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar el socio'
            });
        },
    });

    const handleSubmit = (data: Partial<Socio>) => {
        updateMutation.mutate(data);
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!socio) {
        return (
            <Box>
                <Typography variant="h6" color="error">
                    No se encontró el socio
                </Typography>
            </Box>
        );
    }

    // Convertir SocioWithId a Partial<Socio>
    const socioData: Partial<Socio> = {
        ...socio,
        createdAt: socio.createdAt ? new Date(socio.createdAt) : undefined,
        updatedAt: socio.updatedAt ? new Date(socio.updatedAt) : undefined,
        fechaNacimiento: new Date(socio.fechaNacimiento)
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    Editar Socio
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
                initialData={socioData}
                onSubmit={handleSubmit}
                isLoading={updateMutation.isPending}
            />
        </Box>
    );
};

export default SociosEdit; 