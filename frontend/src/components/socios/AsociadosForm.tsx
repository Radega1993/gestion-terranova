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
import { API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';

interface AsociadosFormProps {
    initialData?: Asociado[];
    onSubmit: (data: Asociado[]) => void;
    isLoading: boolean;
}

const AsociadosForm: React.FC<AsociadosFormProps> = ({ initialData, onSubmit, isLoading }) => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [asociados, setAsociados] = useState<Asociado[]>(initialData || []);

    const handleAddAsociado = () => {
        setAsociados([
            ...asociados,
            {
                codigo: '',
                nombre: '',
                fechaNacimiento: new Date(),
                parentesco: '',
                telefono: '',
                foto: ''
            }
        ]);
    };

    const handleRemoveAsociado = (index: number) => {
        setAsociados(asociados.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof Asociado, value: any) => {
        const newAsociados = [...asociados];
        newAsociados[index] = {
            ...newAsociados[index],
            [field]: value
        };
        setAsociados(newAsociados);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(asociados);
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6">
                                Miembros Asociados
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={handleAddAsociado}
                            >
                                Agregar Miembro
                            </Button>
                        </Box>
                    </Grid>

                    {asociados.map((asociado, index) => (
                        <Grid item xs={12} key={index}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                        <Typography variant="h6">
                                            Miembro {index + 1}
                                        </Typography>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleRemoveAsociado(index)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Código"
                                                value={asociado.codigo}
                                                onChange={(e) => handleChange(index, 'codigo', e.target.value)}
                                                required
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Nombre"
                                                value={asociado.nombre}
                                                onChange={(e) => handleChange(index, 'nombre', e.target.value)}
                                                required
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Fecha de Nacimiento"
                                                type="date"
                                                value={asociado.fechaNacimiento ? new Date(asociado.fechaNacimiento).toISOString().split('T')[0] : ''}
                                                onChange={(e) => handleChange(index, 'fechaNacimiento', new Date(e.target.value))}
                                                required
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Parentesco"
                                                value={asociado.parentesco}
                                                onChange={(e) => handleChange(index, 'parentesco', e.target.value)}
                                                required
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <TextField
                                                fullWidth
                                                label="Teléfono"
                                                value={asociado.telefono}
                                                onChange={(e) => handleChange(index, 'telefono', e.target.value)}
                                            />
                                        </Grid>

                                        <Grid item xs={12} md={6}>
                                            <Box display="flex" alignItems="center">
                                                <Avatar
                                                    src={asociado.foto}
                                                    sx={{ width: 100, height: 100, mr: 2 }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    component="label"
                                                    startIcon={<PhotoCamera />}
                                                >
                                                    Subir Foto
                                                    <input
                                                        type="file"
                                                        hidden
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    handleChange(index, 'foto', reader.result);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </Button>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
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

export default AsociadosForm; 