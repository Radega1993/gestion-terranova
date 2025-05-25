import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Switch,
    FormControlLabel,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import axiosInstance from '../../config/axios';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import { AxiosError } from 'axios';

interface Suplemento {
    _id?: string;
    id: string;
    nombre: string;
    precio: number;
    tipo: 'fijo' | 'porHora';
    activo: boolean;
}

interface GestionSuplementosProps {
    open: boolean;
    onClose: () => void;
    suplementos: Suplemento[];
    onSaveSuplementos: (suplementos: Suplemento[]) => void;
}

export const GestionSuplementos: React.FC<GestionSuplementosProps> = ({
    open,
    onClose,
    suplementos,
    onSaveSuplementos,
}) => {
    const [suplementosEdit, setSuplementosEdit] = useState<Suplemento[]>([]);
    const [editingSuplemento, setEditingSuplemento] = useState<Suplemento | null>(null);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });
    const { token } = useAuthStore();

    // Actualizar los estados cuando cambian los props
    useEffect(() => {
        console.log('Actualizando estados con nuevos props de suplementos:', suplementos);
        if (suplementos.length > 0) {
            // Asegurarnos de que los suplementos tengan todos los campos necesarios
            const suplementosCompletos = suplementos.map(sup => ({
                ...sup,
                activo: Boolean(sup.activo),
                tipo: sup.tipo || 'fijo',
                precio: Number(sup.precio)
            }));
            setSuplementosEdit(suplementosCompletos);
        }
    }, [suplementos]);

    const handleAddSuplemento = () => {
        console.log('Añadiendo nuevo suplemento');
        const newSuplemento: Suplemento = {
            id: '',
            nombre: '',
            precio: 0,
            tipo: 'fijo',
            activo: true
        };
        setSuplementosEdit([...suplementosEdit, newSuplemento]);
        setEditingSuplemento(newSuplemento);
    };

    const handleEditSuplemento = (suplemento: Suplemento) => {
        console.log('Editando suplemento:', suplemento);
        setEditingSuplemento({ ...suplemento });
    };

    const handleDeleteSuplemento = (suplemento: Suplemento) => {
        console.log('Eliminando suplemento:', suplemento);
        if (suplemento._id) {
            // Si tiene _id, es un suplemento existente que hay que eliminar del backend
            axios.delete(`${API_BASE_URL}/servicios/suplementos/${suplemento._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then(() => {
                // Actualizar la lista local
                setSuplementosEdit(suplementosEdit.filter(s => s._id !== suplemento._id));
                setSnackbar({
                    open: true,
                    message: 'Suplemento eliminado correctamente',
                    severity: 'success'
                });
            }).catch(error => {
                console.error('Error al eliminar suplemento:', error);
                setSnackbar({
                    open: true,
                    message: 'Error al eliminar suplemento: ' + error.message,
                    severity: 'error'
                });
            });
        } else {
            // Si no tiene _id, es un suplemento nuevo que solo hay que eliminar de la lista local
            setSuplementosEdit(suplementosEdit.filter(s => s !== suplemento));
        }
    };

    const handleSaveSuplemento = (index: number, field: string, value: any) => {
        console.log('Guardando suplemento:', { index, field, value });
        const updatedSuplementos = [...suplementosEdit];
        const suplemento = updatedSuplementos[index];

        if (field === 'nombre') {
            // Generar ID basado en el nombre
            const newId = `suplemento-${value.toLowerCase().replace(/\s+/g, '-')}`;
            suplemento.id = newId;
            suplemento.nombre = value;
        } else if (field === 'activo') {
            // Asegurarnos de que activo sea un booleano
            suplemento.activo = Boolean(value);
        } else if (field === 'tipo') {
            suplemento.tipo = value;
        } else if (field === 'precio') {
            suplemento.precio = Number(value);
        }

        // Asegurarnos de que el suplemento tenga todos los campos necesarios
        suplemento.activo = Boolean(suplemento.activo);
        suplemento.tipo = suplemento.tipo || 'fijo';
        suplemento.precio = Number(suplemento.precio);

        console.log('Suplemento actualizado:', suplemento);
        setSuplementosEdit(updatedSuplementos);
    };

    const handleSaveSuplementos = async (suplementos: Suplemento[]) => {
        console.log('Guardando suplementos:', suplementos);
        try {
            for (const suplemento of suplementos) {
                try {
                    if (suplemento.id) {
                        // Si tiene ID, intentar actualizar
                        console.log('Actualizando suplemento:', suplemento);
                        await axiosInstance.patch(`/servicios/suplementos/${suplemento.id}`, suplemento);
                    } else {
                        // Si no tiene ID, crear como nuevo
                        console.log('Creando nuevo suplemento:', suplemento);
                        await axiosInstance.post('/servicios/suplementos', suplemento);
                    }
                } catch (error) {
                    if (error instanceof AxiosError && error.response?.status === 404) {
                        // Si no existe, crear como nuevo
                        console.log('Suplemento no encontrado, creando como nuevo:', suplemento);
                        await axiosInstance.post('/servicios/suplementos', suplemento);
                    } else {
                        throw error;
                    }
                }
            }
            // Recargar suplementos después de guardar
            await fetchSuplementos();
        } catch (error) {
            console.error('Error al guardar suplementos:', error);
            throw error;
        }
    };

    const handleSave = () => {
        console.log('Iniciando guardado de suplementos');
        console.log('Suplementos originales:', suplementos);
        console.log('Suplementos editados:', suplementosEdit);

        // Filtrar solo los suplementos que han sido modificados
        const modifiedSuplementos = suplementosEdit.filter((suplemento) => {
            // Si es un suplemento nuevo (no tiene _id), incluirlo
            if (!suplemento._id) {
                console.log('Suplemento nuevo detectado:', suplemento);
                return true;
            }

            // Buscar el suplemento original
            const originalSuplemento = suplementos.find(s => s._id === suplemento._id);
            if (!originalSuplemento) {
                console.log('Suplemento original no encontrado:', suplemento);
                return true;
            }

            // Comparar los campos relevantes
            const hasChanges = (
                originalSuplemento.nombre !== suplemento.nombre ||
                originalSuplemento.precio !== suplemento.precio ||
                originalSuplemento.tipo !== suplemento.tipo ||
                originalSuplemento.activo !== suplemento.activo
            );

            if (hasChanges) {
                console.log('Cambios detectados en suplemento:', {
                    original: originalSuplemento,
                    modified: suplemento,
                    changes: {
                        nombre: originalSuplemento.nombre !== suplemento.nombre,
                        precio: originalSuplemento.precio !== suplemento.precio,
                        tipo: originalSuplemento.tipo !== suplemento.tipo,
                        activo: originalSuplemento.activo !== suplemento.activo
                    }
                });
            }

            return hasChanges;
        });

        console.log('Suplementos modificados:', modifiedSuplementos);
        if (modifiedSuplementos.length > 0) {
            onSaveSuplementos(modifiedSuplementos);
        } else {
            console.log('No hay suplementos modificados para guardar');
        }
        onClose();
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    Gestión de Suplementos
                    <IconButton
                        onClick={onClose}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddSuplemento}
                            >
                                Nuevo Suplemento
                            </Button>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {suplementosEdit.map((suplemento, index) => (
                                <Paper key={index} sx={{ p: 2 }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid sx={{ width: { xs: '100%', sm: '25%' } }}>
                                            <TextField
                                                fullWidth
                                                label="Nombre"
                                                value={suplemento.nombre}
                                                onChange={(e) => handleSaveSuplemento(index, 'nombre', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid sx={{ width: { xs: '100%', sm: '16.66%' } }}>
                                            <TextField
                                                fullWidth
                                                type="number"
                                                label="Precio"
                                                value={suplemento.precio}
                                                onChange={(e) => handleSaveSuplemento(index, 'precio', Number(e.target.value))}
                                            />
                                        </Grid>
                                        <Grid sx={{ width: { xs: '100%', sm: '25%' } }}>
                                            <FormControl fullWidth>
                                                <InputLabel>Tipo</InputLabel>
                                                <Select
                                                    value={suplemento.tipo}
                                                    label="Tipo"
                                                    onChange={(e) => handleSaveSuplemento(index, 'tipo', e.target.value)}
                                                >
                                                    <MenuItem value="fijo">Fijo</MenuItem>
                                                    <MenuItem value="porHora">Por Hora</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid sx={{ width: { xs: '100%', sm: '16.66%' } }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={Boolean(suplemento.activo)}
                                                        onChange={(e) => handleSaveSuplemento(index, 'activo', e.target.checked)}
                                                    />
                                                }
                                                label="Activo"
                                            />
                                        </Grid>
                                        <Grid sx={{ width: { xs: '100%', sm: '16.66%' } }}>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<DeleteIcon />}
                                                onClick={() => handleDeleteSuplemento(suplemento)}
                                            >
                                                Eliminar
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}; 