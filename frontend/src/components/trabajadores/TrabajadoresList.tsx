import React, { useState, useEffect } from 'react';
import {
    Container,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Chip
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { trabajadoresService, Trabajador, CreateTrabajadorDto } from '../../services/trabajadores';
import { tiendasService, Tienda } from '../../services/tiendas';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types/user';
import Swal from 'sweetalert2';

interface FormData {
    nombre: string;
    identificador: string;
    tienda: string;
    activo: boolean;
}

const TrabajadoresList: React.FC = () => {
    const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
    const [tiendas, setTiendas] = useState<Tienda[]>([]);
    const [miTienda, setMiTienda] = useState<Tienda | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedTrabajador, setSelectedTrabajador] = useState<Trabajador | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        nombre: '',
        identificador: '',
        tienda: '',
        activo: true,
    });
    const { userRole } = useAuthStore();

    useEffect(() => {
        fetchTrabajadores();
        if (userRole === UserRole.ADMINISTRADOR) {
            fetchTiendas();
        } else if (userRole === UserRole.TIENDA) {
            fetchMiTienda();
        }
    }, [userRole]);

    const fetchTrabajadores = async () => {
        try {
            let data: Trabajador[];
            if (userRole === UserRole.TIENDA) {
                data = await trabajadoresService.getMisTrabajadores();
            } else {
                data = await trabajadoresService.getAll();
            }
            setTrabajadores(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener trabajadores');
        }
    };

    const fetchTiendas = async () => {
        try {
            const data = await tiendasService.getActivas();
            setTiendas(data);
        } catch (err) {
            console.error('Error al obtener tiendas:', err);
        }
    };

    const fetchMiTienda = async () => {
        try {
            const data = await tiendasService.getMiTienda();
            setMiTienda(data);
            setFormData(prev => ({ ...prev, tienda: data._id }));
        } catch (err) {
            console.error('Error al obtener mi tienda:', err);
            Swal.fire('Error', 'No tiene una tienda asignada. Contacte al administrador.', 'error');
        }
    };

    const handleOpenDialog = (trabajador?: Trabajador) => {
        if (trabajador) {
            setSelectedTrabajador(trabajador);
            const tiendaId = typeof trabajador.tienda === 'string' 
                ? trabajador.tienda 
                : trabajador.tienda._id;
            setFormData({
                nombre: trabajador.nombre,
                identificador: trabajador.identificador,
                tienda: tiendaId,
                activo: trabajador.activo,
            });
        } else {
            setSelectedTrabajador(null);
            setFormData({
                nombre: '',
                identificador: '',
                tienda: miTienda?._id || '',
                activo: true,
            });
        }
        setError(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTrabajador(null);
        setFormData({
            nombre: '',
            identificador: '',
            tienda: miTienda?._id || '',
            activo: true,
        });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedTrabajador) {
                await trabajadoresService.update(selectedTrabajador._id, {
                    nombre: formData.nombre,
                    identificador: formData.identificador,
                    activo: formData.activo,
                });
            } else {
                if (!formData.tienda && userRole === UserRole.ADMINISTRADOR) {
                    setError('Debe seleccionar una tienda');
                    return;
                }
                await trabajadoresService.create({
                    nombre: formData.nombre,
                    identificador: formData.identificador,
                    tienda: formData.tienda,
                    activo: formData.activo,
                });
            }
            handleCloseDialog();
            fetchTrabajadores();
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: selectedTrabajador ? 'Trabajador actualizado' : 'Trabajador creado',
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al guardar trabajador';
            setError(errorMessage);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await trabajadoresService.delete(id);
                fetchTrabajadores();
                Swal.fire('Eliminado', 'El trabajador ha sido eliminado', 'success');
            } catch (err) {
                Swal.fire('Error', 'No se pudo eliminar el trabajador', 'error');
            }
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            await trabajadoresService.toggleActive(id);
            fetchTrabajadores();
        } catch (err) {
            Swal.fire('Error', 'No se pudo cambiar el estado del trabajador', 'error');
        }
    };

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Gestión de Trabajadores</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenDialog()}
                >
                    Nuevo Trabajador
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Identificador</TableCell>
                            <TableCell>Tienda</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {trabajadores.map(trabajador => {
                            const tiendaNombre = typeof trabajador.tienda === 'string'
                                ? tiendas.find(t => t._id === trabajador.tienda)?.nombre || miTienda?.nombre
                                : trabajador.tienda.nombre;
                            
                            return (
                                <TableRow key={trabajador._id}>
                                    <TableCell>{trabajador.nombre}</TableCell>
                                    <TableCell>{trabajador.identificador}</TableCell>
                                    <TableCell>{tiendaNombre || 'N/A'}</TableCell>
                                    <TableCell>
                                        {trabajador.activo ? (
                                            <Chip label="Activo" color="success" size="small" />
                                        ) : (
                                            <Chip label="Inactivo" color="error" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            onClick={() => handleOpenDialog(trabajador)}
                                            color="primary"
                                            size="small"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleToggleActive(trabajador._id)}
                                            color={trabajador.activo ? "error" : "success"}
                                            size="small"
                                        >
                                            {trabajador.activo ? <BlockIcon /> : <CheckCircleIcon />}
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDelete(trabajador._id)}
                                            color="error"
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedTrabajador ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
                        {!selectedTrabajador && userRole === UserRole.ADMINISTRADOR && (
                            <FormControl fullWidth margin="dense" required>
                                <InputLabel>Tienda</InputLabel>
                                <Select
                                    value={formData.tienda}
                                    onChange={(e) => setFormData({ ...formData, tienda: e.target.value })}
                                    label="Tienda"
                                >
                                    {tiendas.map(tienda => (
                                        <MenuItem key={tienda._id} value={tienda._id}>
                                            {tienda.nombre} ({tienda.codigo})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        {userRole === UserRole.TIENDA && miTienda && (
                            <Box sx={{ mb: 2, p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                                <Typography variant="body2">
                                    Tienda: {miTienda.nombre} ({miTienda.codigo})
                                </Typography>
                            </Box>
                        )}
                        <TextField
                            margin="dense"
                            label="Nombre"
                            type="text"
                            fullWidth
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                        <TextField
                            margin="dense"
                            label="Identificador"
                            type="text"
                            fullWidth
                            value={formData.identificador}
                            onChange={(e) => setFormData({ ...formData, identificador: e.target.value })}
                            required
                            disabled={!!selectedTrabajador}
                            helperText={selectedTrabajador ? "El identificador no se puede modificar" : ""}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {selectedTrabajador ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
};

export default TrabajadoresList;

