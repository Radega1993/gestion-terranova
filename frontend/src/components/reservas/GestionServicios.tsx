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
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Paper,
    Snackbar,
    Alert,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ChromePicker } from 'react-color';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';

interface Servicio {
    _id?: string;
    id: string;
    nombre: string;
    precio: number;
    color: string;
    colorConObservaciones: string;
    activo: boolean;
}

interface GestionServiciosProps {
    open: boolean;
    onClose: () => void;
    servicios: Servicio[];
    onSaveServicios: (servicios: Servicio[]) => void;
}

export const GestionServicios: React.FC<GestionServiciosProps> = ({
    open,
    onClose,
    servicios,
    onSaveServicios,
}) => {
    const [serviciosEdit, setServiciosEdit] = useState<Servicio[]>([]);
    const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorType, setColorType] = useState<'normal' | 'observaciones'>('normal');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });
    const { token } = useAuthStore();

    // Actualizar los estados cuando cambian los props
    useEffect(() => {
        if (servicios.length > 0) {
            setServiciosEdit([...servicios]);
        }
    }, [servicios]);

    const handleAddServicio = () => {
        const newServicio: Servicio = {
            id: '',
            nombre: '',
            precio: 0,
            color: '#2196f3',
            colorConObservaciones: '#1565c0',
            activo: true
        };
        setEditingServicio(newServicio);
    };

    const handleEditServicio = (servicio: Servicio) => {
        setEditingServicio({ ...servicio });
    };

    const handleDeleteServicio = async (id: string) => {
        try {
            const servicio = serviciosEdit.find(s => s.id === id);
            if (!servicio || !servicio._id) {
                throw new Error('Servicio no encontrado');
            }

            const response = await fetch(`${API_BASE_URL}/servicios/${servicio._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar servicio');
            }

            // Actualizar la lista de servicios después de eliminar
            const updatedResponse = await fetch(`${API_BASE_URL}/servicios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!updatedResponse.ok) throw new Error('Error al obtener servicios');
            const updatedData = await updatedResponse.json();
            setServiciosEdit(updatedData);

            setSnackbar({
                open: true,
                message: 'Servicio eliminado correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al eliminar servicio:', error);
            setSnackbar({
                open: true,
                message: error instanceof Error ? error.message : 'Error al eliminar el servicio',
                severity: 'error'
            });
        }
    };

    const handleSaveServicio = () => {
        if (!editingServicio) return;


        if (!editingServicio.nombre.trim()) {
            alert('El nombre del servicio es obligatorio');
            return;
        }

        if (editingServicio.precio <= 0) {
            alert('El precio debe ser mayor que 0');
            return;
        }

        // Generar ID si es nuevo servicio
        if (!editingServicio.id) {
            editingServicio.id = editingServicio.nombre.toLowerCase().replace(/\s+/g, '');
        }

        // Verificar si el servicio ya existe
        const existingIndex = serviciosEdit.findIndex(s => s.id === editingServicio.id);
        let updatedServicios;

        if (existingIndex !== -1) {
            // Actualizar servicio existente
            updatedServicios = [...serviciosEdit];
            updatedServicios[existingIndex] = editingServicio;
        } else {
            // Añadir nuevo servicio
            updatedServicios = [...serviciosEdit, editingServicio];
        }

        setServiciosEdit(updatedServicios);
        setEditingServicio(null);
    };

    const handleSaveServicios = async (servicios: Servicio[]) => {
        try {
            for (const servicio of servicios) {
                try {
                    if (servicio._id) {
                        // Si tiene ID, intentar actualizar
                        const response = await fetch(`${API_BASE_URL}/servicios/${servicio._id}`, {
                            method: 'PATCH',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(servicio)
                        });
                        if (!response.ok) throw new Error('Error al actualizar servicio');
                    } else {
                        // Si no tiene ID, crear como nuevo
                        const response = await fetch(`${API_BASE_URL}/servicios`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(servicio)
                        });
                        if (!response.ok) throw new Error('Error al crear servicio');
                    }
                } catch (error) {
                    if (error instanceof Error && error.message.includes('404')) {
                        // Si no existe, crear como nuevo
                        const response = await fetch(`${API_BASE_URL}/servicios`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(servicio)
                        });
                        if (!response.ok) throw new Error('Error al crear servicio');
                    } else {
                        throw error;
                    }
                }
            }
            // Recargar servicios después de guardar
            const updatedResponse = await fetch(`${API_BASE_URL}/servicios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!updatedResponse.ok) throw new Error('Error al obtener servicios');
            const updatedData = await updatedResponse.json();
            setServiciosEdit(updatedData);
        } catch (error) {
            console.error('Error al guardar servicios:', error);
            throw error;
        }
    };

    const handleSave = () => {


        // Filtrar solo los servicios que han sido modificados
        const modifiedServicios = serviciosEdit.filter((servicio) => {
            // Si es un servicio nuevo (no tiene id), incluirlo
            if (!servicio.id) {
                return true;
            }

            // Buscar el servicio original
            const originalServicio = servicios.find(s => s.id === servicio.id);
            if (!originalServicio) {
                return true;
            }

            // Comparar los campos relevantes
            const hasChanges = (
                originalServicio.nombre !== servicio.nombre ||
                originalServicio.precio !== servicio.precio ||
                originalServicio.color !== servicio.color ||
                originalServicio.colorConObservaciones !== servicio.colorConObservaciones ||
                originalServicio.activo !== servicio.activo
            );

            return hasChanges;
        });

        if (modifiedServicios.length > 0) {
            onSaveServicios(modifiedServicios);
        } else {
            console.log('No hay servicios modificados para guardar');
        }
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Gestión de Servicios
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
                            onClick={handleAddServicio}
                        >
                            Nuevo Servicio
                        </Button>
                    </Box>
                    <List>
                        {serviciosEdit.map((servicio) => (
                            <Paper key={servicio.id} sx={{ mb: 1 }}>
                                <ListItem>
                                    <ListItemText
                                        primary={servicio.nombre}
                                        secondary={`Precio: ${servicio.precio}€`}
                                    />
                                    <ListItemSecondaryAction>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: servicio.color,
                                                    borderRadius: '50%',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => {
                                                    setEditingServicio(servicio);
                                                    setColorType('normal');
                                                    setShowColorPicker(true);
                                                }}
                                            />
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: servicio.colorConObservaciones,
                                                    borderRadius: '50%',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() => {
                                                    setEditingServicio(servicio);
                                                    setColorType('observaciones');
                                                    setShowColorPicker(true);
                                                }}
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={servicio.activo}
                                                        onChange={(e) => {
                                                            setServiciosEdit(serviciosEdit.map(s =>
                                                                s.id === servicio.id
                                                                    ? { ...s, activo: e.target.checked }
                                                                    : s
                                                            ));
                                                        }}
                                                    />
                                                }
                                                label="Activo"
                                            />
                                            <IconButton onClick={() => handleEditServicio(servicio)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton onClick={() => handleDeleteServicio(servicio.id)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Box>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            </Paper>
                        ))}
                    </List>
                </Box>

                {editingServicio && (
                    <Dialog open={true} onClose={() => setEditingServicio(null)}>
                        <DialogTitle>
                            {editingServicio.id ? 'Editar Servicio' : 'Nuevo Servicio'}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Nombre"
                                    value={editingServicio.nombre}
                                    onChange={(e) => setEditingServicio({ ...editingServicio, nombre: e.target.value })}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    label="Precio"
                                    type="number"
                                    value={editingServicio.precio}
                                    onChange={(e) => setEditingServicio({ ...editingServicio, precio: Number(e.target.value) })}
                                    sx={{ mb: 2 }}
                                />
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1">Color Normal</Typography>
                                    <Box
                                        sx={{
                                            width: 30,
                                            height: 30,
                                            backgroundColor: editingServicio.color,
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            border: '1px solid #ccc'
                                        }}
                                        onClick={() => {
                                            setColorType('normal');
                                            setShowColorPicker(true);
                                        }}
                                    />
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1">Color con Observaciones</Typography>
                                    <Box
                                        sx={{
                                            width: 30,
                                            height: 30,
                                            backgroundColor: editingServicio.colorConObservaciones,
                                            borderRadius: '50%',
                                            cursor: 'pointer',
                                            border: '1px solid #ccc'
                                        }}
                                        onClick={() => {
                                            setColorType('observaciones');
                                            setShowColorPicker(true);
                                        }}
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditingServicio(null)}>Cancelar</Button>
                            <Button onClick={handleSaveServicio} variant="contained">Guardar</Button>
                        </DialogActions>
                    </Dialog>
                )}

                {showColorPicker && editingServicio && (
                    <Dialog open={true} onClose={() => setShowColorPicker(false)}>
                        <DialogTitle>Seleccionar Color</DialogTitle>
                        <DialogContent>
                            <ChromePicker
                                color={colorType === 'normal' ? editingServicio.color : editingServicio.colorConObservaciones}
                                onChange={(color) => {
                                    setEditingServicio({
                                        ...editingServicio,
                                        [colorType === 'normal' ? 'color' : 'colorConObservaciones']: color.hex
                                    });
                                }}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setShowColorPicker(false)}>Cerrar</Button>
                        </DialogActions>
                    </Dialog>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                    Guardar
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 