import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Button,
    CircularProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';
import { Socio } from '../../types/socio';

const SociosDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();

    // Query para obtener los detalles del socio
    const { data: socio, isLoading } = useQuery({
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

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    Detalles del Socio
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/socios')}
                >
                    Volver
                </Button>
            </Box>

            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Información Personal
                        </Typography>
                        <Typography>
                            <strong>Nombre:</strong> {socio.nombre.nombre} {socio.nombre.primerApellido} {socio.nombre.segundoApellido}
                        </Typography>
                        <Typography>
                            <strong>Número de Socio:</strong> {socio.socio}
                        </Typography>
                        <Typography>
                            <strong>Estado:</strong>{' '}
                            <Chip
                                label={socio.activo ? 'Activo' : 'Inactivo'}
                                color={socio.activo ? 'success' : 'error'}
                                size="small"
                            />
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="h6" gutterBottom>
                            Contacto
                        </Typography>
                        <Typography>
                            <strong>Teléfonos:</strong>{' '}
                            {socio.contacto.telefonos.join(', ')}
                        </Typography>
                        <Typography>
                            <strong>Emails:</strong>{' '}
                            {socio.contacto.email.join(', ')}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Dirección
                        </Typography>
                        <Typography>
                            {socio.direccion.calle}, {socio.direccion.numero}
                        </Typography>
                        <Typography>
                            {socio.direccion.colonia}, {socio.direccion.ciudad}
                        </Typography>
                        <Typography>
                            {socio.direccion.estado}, CP: {socio.direccion.cp}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default SociosDetails; 