import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Grid,
    Paper,
    IconButton,
    Avatar,
    Card,
    CardContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Asociado } from '../../types/socio';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../config/axios';
import Swal from 'sweetalert2';

const AsociadosForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const [asociados, setAsociados] = useState<Asociado[]>([]);

    // Cargar datos del socio y sus asociados
    const { data: socioData, isLoading } = useQuery({
        queryKey: ['socio', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await axiosInstance.get(`/socios/${id}`);
            return response.data;
        },
        enabled: !!id && !!token,
        onSuccess: (data) => {
            if (data?.asociados) {
                setAsociados(data.asociados);
            }
        },
    });

    // Mutación para actualizar los asociados
    const updateMutation = useMutation({
        mutationFn: async (asociados: Asociado[]) => {
            if (!id) throw new Error('No hay ID de socio');
            const response = await axiosInstance.put(`/socios/${id}/asociados`, { asociados });
            return response.data;
        },
        onSuccess: () => {
            Swal.fire({
                icon: 'success',
                title: 'Miembros actualizados',
                text: 'Los miembros asociados han sido actualizados correctamente'
            });
            navigate('/socios');
        },
        onError: (error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron actualizar los miembros asociados'
            });
        },
    });

    // Añadir nuevo asociado
    const handleAddAsociado = () => {
        setAsociados([...asociados, { nombre: '', fechaNacimiento: '' }]);
    };

    // Eliminar asociado
    const handleDeleteAsociado = (index: number) => {
        const newAsociados = [...asociados];
        newAsociados.splice(index, 1);
        setAsociados(newAsociados);
    };

    // Actualizar datos de asociado
    const handleAsociadoChange = (index: number, field: keyof Asociado, value: string) => {
        const newAsociados = [...asociados];
        newAsociados[index] = { ...newAsociados[index], [field]: value };
        setAsociados(newAsociados);
    };

    // Manejar cambio de foto
    const handleFotoChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'La imagen no puede ser mayor a 5MB'
                });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
                    const newAsociados = [...asociados];
                    newAsociados[index] = { ...newAsociados[index], foto: compressedImage };
                    setAsociados(newAsociados);
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    // Guardar cambios
    const handleSubmit = async () => {
        try {
            await updateMutation.mutateAsync(asociados);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Volver a la lista de socios
    const handleCancel = () => {
        navigate('/socios');
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>Cargando...</Typography>
            </Box>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <IconButton onClick={handleCancel}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ ml: 2 }}>
                            Gestión de Miembros Asociados
                        </Typography>
                    </Box>

                    <Typography variant="subtitle1" gutterBottom>
                        Socio: {socioData?.nombre.nombre} {socioData?.nombre.primerApellido}
                    </Typography>

                    <Box sx={{ mt: 3 }}>
                        {asociados.map((asociado, index) => (
                            <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item>
                                        <Box sx={{ position: 'relative' }}>
                                            <Avatar
                                                src={asociado.foto}
                                                sx={{ width: 80, height: 80 }}
                                            />
                                            <input
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                id={`foto-asociado-${index}`}
                                                type="file"
                                                onChange={(e) => handleFotoChange(index, e)}
                                            />
                                            <label htmlFor={`foto-asociado-${index}`}>
                                                <IconButton
                                                    color="primary"
                                                    component="span"
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        right: 0,
                                                        bgcolor: 'background.paper'
                                                    }}
                                                >
                                                    <PhotoCamera />
                                                </IconButton>
                                            </label>
                                        </Box>
                                    </Grid>
                                    <Grid item xs>
                                        <TextField
                                            fullWidth
                                            label="Nombre completo"
                                            value={asociado.nombre}
                                            onChange={(e) => handleAsociadoChange(index, 'nombre', e.target.value)}
                                            required
                                            sx={{ mb: 2 }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Fecha de nacimiento"
                                            type="date"
                                            value={asociado.fechaNacimiento || ''}
                                            onChange={(e) => handleAsociadoChange(index, 'fechaNacimiento', e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDeleteAsociado(index)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}

                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddAsociado}
                            variant="outlined"
                            sx={{ mt: 2 }}
                        >
                            Añadir miembro
                        </Button>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={updateMutation.isLoading}
                            >
                                Guardar cambios
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default AsociadosForm; 