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
import { Socio } from '../../types/socio';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';

interface SociosFormProps {
    initialData?: Partial<Socio>;
    onSubmit: (data: Partial<Socio>) => void;
    isLoading: boolean;
}

const SociosForm: React.FC<SociosFormProps> = ({ initialData, onSubmit, isLoading }) => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [formData, setFormData] = useState<Partial<Socio>>(initialData || {
        nombre: {
            nombre: '',
            primerApellido: '',
            segundoApellido: ''
        },
        socio: '',
        fechaNacimiento: new Date(),
        contacto: {
            telefonos: [''],
            email: ['']
        },
        direccion: {
            calle: '',
            numero: '',
            poblacion: '',
            cp: '',
            provincia: ''
        },
        active: true
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Información Personal
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Nombre"
                            value={formData.nombre?.nombre || ''}
                            onChange={(e) => handleChange('nombre', {
                                ...formData.nombre,
                                nombre: e.target.value
                            })}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Primer Apellido"
                            value={formData.nombre?.primerApellido || ''}
                            onChange={(e) => handleChange('nombre', {
                                ...formData.nombre,
                                primerApellido: e.target.value
                            })}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Segundo Apellido"
                            value={formData.nombre?.segundoApellido || ''}
                            onChange={(e) => handleChange('nombre', {
                                ...formData.nombre,
                                segundoApellido: e.target.value
                            })}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Número de Socio"
                            value={formData.socio || ''}
                            onChange={(e) => handleChange('socio', e.target.value)}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Fecha de Nacimiento"
                            type="date"
                            value={formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleChange('fechaNacimiento', new Date(e.target.value))}
                            required
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Contacto
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Teléfono"
                            value={formData.contacto?.telefonos[0] || ''}
                            onChange={(e) => handleChange('contacto', {
                                ...formData.contacto,
                                telefonos: [e.target.value]
                            })}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={formData.contacto?.email[0] || ''}
                            onChange={(e) => handleChange('contacto', {
                                ...formData.contacto,
                                email: [e.target.value]
                            })}
                            required
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Dirección
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Calle"
                            value={formData.direccion?.calle || ''}
                            onChange={(e) => handleChange('direccion', {
                                ...formData.direccion,
                                calle: e.target.value
                            })}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Número"
                            value={formData.direccion?.numero || ''}
                            onChange={(e) => handleChange('direccion', {
                                ...formData.direccion,
                                numero: e.target.value
                            })}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Población"
                            value={formData.direccion?.poblacion || ''}
                            onChange={(e) => handleChange('direccion', {
                                ...formData.direccion,
                                poblacion: e.target.value
                            })}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Código Postal"
                            value={formData.direccion?.cp || ''}
                            onChange={(e) => handleChange('direccion', {
                                ...formData.direccion,
                                cp: e.target.value
                            })}
                            required
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Provincia"
                            value={formData.direccion?.provincia || ''}
                            onChange={(e) => handleChange('direccion', {
                                ...formData.direccion,
                                provincia: e.target.value
                            })}
                            required
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Box display="flex" justifyContent="flex-end" mt={3}>
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? 'Guardando...' : 'Guardar'}
                </Button>
            </Box>
        </Box>
    );
};

export default SociosForm; 