import React, { useState } from 'react';
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
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Paper,
    Tabs,
    Tab,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ChromePicker } from 'react-color';

interface Servicio {
    id: string;
    nombre: string;
    precio: number;
    color: string;
    colorConObservaciones: string;
    activo: boolean;
}

interface Suplemento {
    _id?: string;
    id: string;
    nombre: string;
    precio: number;
    tipo: 'fijo' | 'porHora';
    activo: boolean;
}

interface GestionServiciosProps {
    open: boolean;
    onClose: () => void;
    servicios: Servicio[];
    suplementos: Suplemento[];
    onSaveServicios: (servicios: Servicio[]) => void;
    onSaveSuplementos: (suplementos: Suplemento[]) => void;
}

export const GestionServicios: React.FC<GestionServiciosProps> = ({
    open,
    onClose,
    servicios,
    suplementos,
    onSaveServicios,
    onSaveSuplementos,
}) => {
    const [tabValue, setTabValue] = useState(0);
    const [serviciosEdit, setServiciosEdit] = useState<Servicio[]>([]);
    const [suplementosEdit, setSuplementosEdit] = useState<Suplemento[]>([]);
    const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
    const [editingSuplemento, setEditingSuplemento] = useState<Suplemento | null>(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorType, setColorType] = useState<'normal' | 'observaciones'>('normal');

    // Actualizar los estados cuando cambian los props
    React.useEffect(() => {
        console.log('Actualizando estados con nuevos props:', { servicios, suplementos });
        if (servicios.length > 0) {
            setServiciosEdit([...servicios]);
        }
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
    }, [servicios, suplementos]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleAddServicio = () => {
        console.log('Añadiendo nuevo servicio');
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
        console.log('Editando servicio:', servicio);
        setEditingServicio({ ...servicio });
    };

    const handleDeleteServicio = (id: string) => {
        console.log('Eliminando servicio con ID:', id);
        setServiciosEdit(serviciosEdit.filter(s => s.id !== id));
    };

    const handleSaveServicio = () => {
        if (!editingServicio) return;

        console.log('Guardando servicio:', editingServicio);

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

        console.log('Servicios actualizados:', updatedServicios);
        setServiciosEdit(updatedServicios);
        setEditingServicio(null);
    };

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

    const handleDeleteSuplemento = (index: number) => {
        console.log('Eliminando suplemento con ID:', index);
        setSuplementosEdit(suplementosEdit.filter((_, i) => i !== index));
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
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Gestión de Servicios y Suplementos
                <IconButton
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Servicios" />
                        <Tab label="Suplementos" />
                    </Tabs>
                </Box>

                {tabValue === 0 && (
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
                )}

                {tabValue === 1 && (
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
                                                onClick={() => handleDeleteSuplemento(index)}
                                            >
                                                Eliminar
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            ))}
                        </Box>
                    </Box>
                )}

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

                {editingSuplemento && (
                    <Dialog open={!!editingSuplemento} onClose={() => setEditingSuplemento(null)}>
                        <DialogTitle>
                            {editingSuplemento.id ? 'Editar Suplemento' : 'Nuevo Suplemento'}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Nombre"
                                    value={editingSuplemento.nombre}
                                    onChange={(e) => handleSaveSuplemento(suplementosEdit.indexOf(editingSuplemento), 'nombre', e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <TextField
                                    fullWidth
                                    label="Precio"
                                    type="number"
                                    value={editingSuplemento.precio}
                                    onChange={(e) => handleSaveSuplemento(suplementosEdit.indexOf(editingSuplemento), 'precio', Number(e.target.value))}
                                    sx={{ mb: 2 }}
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={editingSuplemento.tipo === 'porHora'}
                                            onChange={(e) => handleSaveSuplemento(suplementosEdit.indexOf(editingSuplemento), 'tipo', e.target.checked ? 'porHora' : 'fijo')}
                                        />
                                    }
                                    label="Precio por hora"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={editingSuplemento.activo}
                                            onChange={(e) => handleSaveSuplemento(suplementosEdit.indexOf(editingSuplemento), 'activo', e.target.checked)}
                                        />
                                    }
                                    label="Activo"
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditingSuplemento(null)}>Cancelar</Button>
                            <Button onClick={() => {
                                setEditingSuplemento(null);
                                onSaveSuplementos(suplementosEdit);
                            }} variant="contained">
                                Guardar
                            </Button>
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