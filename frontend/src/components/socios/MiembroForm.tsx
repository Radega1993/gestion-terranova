import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Box,
    Avatar,
    IconButton
} from '@mui/material';
import { PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import { Socio } from '../../types/socio';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import Swal from 'sweetalert2';

interface MiembroFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    miembro?: any;
    socio: Socio;
}

const MiembroForm: React.FC<MiembroFormProps> = ({
    open,
    onClose,
    onSubmit,
    miembro,
    socio
}) => {
    const [formData, setFormData] = useState({
        nombre: '',
        fechaNacimiento: '',
        telefono: '',
        foto: ''
    });
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const { token } = useAuthStore();

    useEffect(() => {
        if (miembro) {
            setFormData({
                nombre: miembro.nombre || '',
                fechaNacimiento: miembro.fechaNacimiento
                    ? new Date(miembro.fechaNacimiento).toISOString().split('T')[0]
                    : '',
                telefono: miembro.telefono || '',
                foto: miembro.foto || ''
            });
            setPreviewUrl(miembro.foto ? `${API_BASE_URL}/uploads/${miembro.foto}` : '');
        } else {
            setFormData({
                nombre: '',
                fechaNacimiento: '',
                telefono: '',
                foto: ''
            });
            setPreviewUrl('');
        }
    }, [miembro]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, selecciona un archivo de imagen válido'
            });
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'La imagen no debe superar los 5MB'
            });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/uploads/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error al subir la imagen');
            }

            const data = await response.json();
            setFormData(prev => ({
                ...prev,
                foto: data.filename
            }));
            setPreviewUrl(`${API_BASE_URL}/uploads/${data.filename}`);

            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Imagen subida correctamente'
            });
        } catch (error) {
            console.error('Error al subir la imagen:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al subir la imagen'
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Error al guardar el asociado:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {miembro ? 'Editar Asociado' : 'Nuevo Asociado'}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    src={previewUrl}
                                    alt={formData.nombre}
                                    sx={{ width: 100, height: 100 }}
                                />
                                <input
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    id="icon-button-file"
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <label htmlFor="icon-button-file">
                                    <IconButton
                                        color="primary"
                                        aria-label="upload picture"
                                        component="span"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            backgroundColor: 'white',
                                            '&:hover': {
                                                backgroundColor: 'white'
                                            }
                                        }}
                                    >
                                        <PhotoCameraIcon />
                                    </IconButton>
                                </label>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nombre Completo"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Fecha de Nacimiento(MM/DD/AAAA)"
                                name="fechaNacimiento"
                                type="date"
                                value={formData.fechaNacimiento}
                                onChange={handleChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Teléfono"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                    >
                        Guardar
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default MiembroForm; 