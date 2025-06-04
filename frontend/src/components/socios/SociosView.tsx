import React from 'react';
import { Box, Typography } from '@mui/material';
import SociosList from './SociosList';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';
import { SocioWithId } from '../../types/socio';

const SociosView: React.FC = () => {
    const { token } = useAuth();

    // Query para obtener la lista de socios
    const { data: socios = [], isLoading } = useQuery<SocioWithId[]>({
        queryKey: ['socios'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/socios`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al cargar los socios');
            }
            return response.json();
        },
        enabled: !!token,
    });

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Gestión de Socios
            </Typography>
            <SociosList socios={socios} isLoading={isLoading} />
        </Box>
    );
};

export default SociosView; 