import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Box
} from '@mui/material';
import { Socio } from '../../types/socio';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

interface MiembroFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    miembro?: any;
    socio: Socio;
}

interface FormData {
    nombre: string;
    fechaNacimiento: Date | null;
    telefono: string;
}

interface DataToSubmit {
    nombre: string;
    fechaNacimiento?: Date | string;
    telefono: string;
    [key: string]: any;
}

const MiembroForm: React.FC<MiembroFormProps> = ({
    open,
    onClose,
    onSubmit,
    miembro,
    socio
}) => {
    const [formData, setFormData] = useState<FormData>({
        nombre: '',
        fechaNacimiento: null,
        telefono: ''
    });
    const { token } = useAuthStore();

    useEffect(() => {
        if (miembro) {
            setFormData({
                nombre: miembro.nombre || '',
                fechaNacimiento: miembro.fechaNacimiento ? new Date(miembro.fechaNacimiento) : null,
                telefono: miembro.telefono || ''
            });
        } else {
            setFormData({
                nombre: '',
                fechaNacimiento: null,
                telefono: ''
            });
        }
    }, [miembro]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Preparar los datos para enviar al backend
            const dataToSubmit: DataToSubmit = {
                nombre: formData.nombre,
                telefono: formData.telefono
            };

            // Solo incluir la fecha si existe y es válida
            if (formData.fechaNacimiento) {
                // Asegurarnos de que la fecha sea válida
                const fecha = new Date(formData.fechaNacimiento);
                if (!isNaN(fecha.getTime())) {
                    // Enviar la fecha como string ISO y dejar que el backend la convierta a Date
                    dataToSubmit.fechaNacimiento = fecha.toISOString();
                }
            }

            await onSubmit(dataToSubmit);
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
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                <DatePicker
                                    label="Fecha de Nacimiento"
                                    value={formData.fechaNacimiento}
                                    onChange={(date) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            fechaNacimiento: date
                                        }));
                                    }}
                                    maxDate={new Date()} // No permitir fechas futuras
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            margin: "normal"
                                        }
                                    }}
                                />
                            </LocalizationProvider>
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