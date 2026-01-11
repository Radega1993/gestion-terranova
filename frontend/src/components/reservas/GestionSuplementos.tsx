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
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';

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
        if (suplementos.length > 0) {
            setSuplementosEdit([...suplementos]);
        }
    }, [suplementos]);

    const handleAddSuplemento = () => {
        const newSuplemento: Suplemento = {
            id: '',
            nombre: '',
            precio: 0,
            tipo: 'fijo',
            activo: true
        };
        setEditingSuplemento(newSuplemento);
    };

    const handleEditSuplemento = (suplemento: Suplemento) => {
        setEditingSuplemento({ ...suplemento });
    };

    const handleDeleteSuplemento = async (id: string) => {
        try {
            const suplemento = suplementosEdit.find(s => s.id === id);
            if (!suplemento || !suplemento._id) {
                throw new Error('Suplemento no encontrado');
            }

            const response = await fetch(`${API_BASE_URL}/servicios/suplementos/${suplemento._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar suplemento');
            }

            // Actualizar la lista de suplementos después de eliminar
            const updatedResponse = await fetch(`${API_BASE_URL}/servicios/suplementos`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!updatedResponse.ok) throw new Error('Error al obtener suplementos');
            const updatedData = await updatedResponse.json();
            setSuplementosEdit(updatedData);

            setSnackbar({
                open: true,
                message: 'Suplemento eliminado correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al eliminar suplemento:', error);
            setSnackbar({
                open: true,
                message: error instanceof Error ? error.message : 'Error al eliminar el suplemento',
                severity: 'error'
            });
        }
    };

    const handleSaveSuplemento = () => {
        if (!editingSuplemento) return;


        if (!editingSuplemento.nombre.trim()) {
            alert('El nombre del suplemento es obligatorio');
            return;
        }

        if (editingSuplemento.precio <= 0) {
            alert('El precio debe ser mayor que 0');
            return;
        }

        // Generar ID si es nuevo suplemento
        if (!editingSuplemento.id) {
            editingSuplemento.id = `suplemento-${editingSuplemento.nombre.toLowerCase().replace(/\s+/g, '-')}`;
        }

        // Verificar si el suplemento ya existe
        const existingIndex = suplementosEdit.findIndex(s => s.id === editingSuplemento.id);
        let updatedSuplementos;

        if (existingIndex !== -1) {
            // Actualizar suplemento existente
            updatedSuplementos = [...suplementosEdit];
            updatedSuplementos[existingIndex] = editingSuplemento;
        } else {
            // Añadir nuevo suplemento
            updatedSuplementos = [...suplementosEdit, editingSuplemento];
        }

        setSuplementosEdit(updatedSuplementos);
        setEditingSuplemento(null);
    };

    const handleSave = () => {
        // Filtrar solo los suplementos que han sido modificados
        const modifiedSuplementos = suplementosEdit.filter((suplemento) => {
            // Si es un suplemento nuevo (no tiene _id), incluirlo
            if (!suplemento._id) {
                return true;
            }

            // Buscar el suplemento original
            const originalSuplemento = suplementos.find(s => s._id === suplemento._id);
            if (!originalSuplemento) {
                return true;
            }

            // Comparar los campos relevantes
            const hasChanges = (
                originalSuplemento.nombre !== suplemento.nombre ||
                originalSuplemento.precio !== suplemento.precio ||
                originalSuplemento.tipo !== suplemento.tipo ||
                originalSuplemento.activo !== suplemento.activo
            );

            return hasChanges;
        });

        if (modifiedSuplementos.length > 0) {
            onSaveSuplementos(modifiedSuplementos);
        } else {
        }
        onClose();
    };

    return (
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
                        {suplementosEdit.map((suplemento) => (
                            <Paper key={suplemento.id} sx={{ p: 2 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid sx={{ width: { xs: '100%', sm: '25%' } }}>
                                        <TextField
                                            fullWidth
                                            label="Nombre"
                                            value={suplemento.nombre}
                                            onChange={(e) => {
                                                const updatedSuplemento = { ...suplemento, nombre: e.target.value };
                                                setSuplementosEdit(suplementosEdit.map(s =>
                                                    s.id === suplemento.id ? updatedSuplemento : s
                                                ));
                                            }}
                                        />
                                    </Grid>
                                    <Grid sx={{ width: { xs: '100%', sm: '16.66%' } }}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Precio"
                                            value={suplemento.precio}
                                            onChange={(e) => {
                                                const updatedSuplemento = { ...suplemento, precio: Number(e.target.value) };
                                                setSuplementosEdit(suplementosEdit.map(s =>
                                                    s.id === suplemento.id ? updatedSuplemento : s
                                                ));
                                            }}
                                        />
                                    </Grid>
                                    <Grid sx={{ width: { xs: '100%', sm: '25%' } }}>
                                        <FormControl fullWidth>
                                            <InputLabel>Tipo</InputLabel>
                                            <Select
                                                value={suplemento.tipo}
                                                label="Tipo"
                                                onChange={(e) => {
                                                    const updatedSuplemento = { ...suplemento, tipo: e.target.value as 'fijo' | 'porHora' };
                                                    setSuplementosEdit(suplementosEdit.map(s =>
                                                        s.id === suplemento.id ? updatedSuplemento : s
                                                    ));
                                                }}
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
                                                    onChange={(e) => {
                                                        const updatedSuplemento = { ...suplemento, activo: e.target.checked };
                                                        setSuplementosEdit(suplementosEdit.map(s =>
                                                            s.id === suplemento.id ? updatedSuplemento : s
                                                        ));
                                                    }}
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
                                            onClick={() => handleDeleteSuplemento(suplemento.id)}
                                        >
                                            Eliminar
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}
                    </Box>
                </Box>

                {editingSuplemento && (
                    <Dialog open={true} onClose={() => setEditingSuplemento(null)}>
                        <DialogTitle>
                            {editingSuplemento.id ? 'Editar Suplemento' : 'Nuevo Suplemento'}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Nombre"
                                    value={editingSuplemento.nombre}
                                    onChange={(e) => setEditingSuplemento({ ...editingSuplemento, nombre: e.target.value })}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    label="Precio"
                                    type="number"
                                    value={editingSuplemento.precio}
                                    onChange={(e) => setEditingSuplemento({ ...editingSuplemento, precio: Number(e.target.value) })}
                                    sx={{ mb: 2 }}
                                />
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Tipo</InputLabel>
                                    <Select
                                        value={editingSuplemento.tipo}
                                        label="Tipo"
                                        onChange={(e) => setEditingSuplemento({ ...editingSuplemento, tipo: e.target.value as 'fijo' | 'porHora' })}
                                    >
                                        <MenuItem value="fijo">Fijo</MenuItem>
                                        <MenuItem value="porHora">Por Hora</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditingSuplemento(null)}>Cancelar</Button>
                            <Button onClick={handleSaveSuplemento} variant="contained">Guardar</Button>
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
        </Dialog>
    );
}; 