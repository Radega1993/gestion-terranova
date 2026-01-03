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
    Chip,
    Checkbox,
    FormControlLabel,
    Divider,
    Tabs,
    Tab
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
    Visibility as VisibilityIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import { tiendasService, Tienda, CreateTiendaDto } from '../../services/tiendas';
import { trabajadoresService, Trabajador, CreateTrabajadorDto } from '../../services/trabajadores';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../services/api';
import { UserRole } from '../../types/user';
import Swal from 'sweetalert2';

interface FormData {
    nombre: string;
    codigo: string;
    descripcion: string;
    activa: boolean;
    usuarioAsignado: string;
    crearUsuario: boolean;
    username: string;
    password: string;
    nombreUsuario: string;
}

const TiendasList: React.FC = () => {
    const [tiendas, setTiendas] = useState<Tienda[]>([]);
    const [usuariosTienda, setUsuariosTienda] = useState<any[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
    const [selectedTienda, setSelectedTienda] = useState<Tienda | null>(null);
    const [usuarioTienda, setUsuarioTienda] = useState<any | null>(null);
    const [trabajadoresTienda, setTrabajadoresTienda] = useState<Trabajador[]>([]);
    const [openTrabajadorDialog, setOpenTrabajadorDialog] = useState(false);
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [selectedTrabajador, setSelectedTrabajador] = useState<Trabajador | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const [passwordFormData, setPasswordFormData] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [formData, setFormData] = useState<FormData>({
        nombre: '',
        codigo: '',
        descripcion: '',
        activa: true,
        usuarioAsignado: '',
        crearUsuario: false,
        username: '',
        password: '',
        nombreUsuario: '',
    });
    const [trabajadorFormData, setTrabajadorFormData] = useState({
        nombre: '',
        identificador: '',
    });
    useEffect(() => {
        fetchTiendas();
        fetchUsuariosTienda();
    }, []);

    const fetchTiendas = async () => {
        try {
            const data = await tiendasService.getAll();
            setTiendas(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener tiendas');
        }
    };

    const fetchUsuariosTienda = async () => {
        try {
            const response = await api.get('/users');
            const users = response.data;
            const tiendasUsers = users.filter((u: any) => u.role === UserRole.TIENDA);
            setUsuariosTienda(tiendasUsers);
        } catch (err) {
            console.error('Error al obtener usuarios TIENDA:', err);
        }
    };

    const handleOpenDialog = (tienda?: Tienda) => {
        if (tienda) {
            setSelectedTienda(tienda);
            const usuarioId = typeof tienda.usuarioAsignado === 'string'
                ? tienda.usuarioAsignado
                : tienda.usuarioAsignado?._id || '';
            setFormData({
                nombre: tienda.nombre,
                codigo: tienda.codigo,
                descripcion: tienda.descripcion || '',
                activa: tienda.activa,
                usuarioAsignado: usuarioId,
                crearUsuario: false,
                username: '',
                password: '',
                nombreUsuario: '',
            });
        } else {
            setSelectedTienda(null);
            setFormData({
                nombre: '',
                codigo: '',
                descripcion: '',
                activa: true,
                usuarioAsignado: '',
                crearUsuario: false,
                username: '',
                password: '',
                nombreUsuario: '',
            });
        }
        setError(null);
        setOpenDialog(true);
    };

    const handleOpenDetailsDialog = async (tienda: Tienda) => {
        setSelectedTienda(tienda);
        setTabValue(0);
        try {
            const trabajadores = await trabajadoresService.getByTienda(tienda._id);
            setTrabajadoresTienda(trabajadores);
            
            // Obtener información del usuario de la tienda
            if (tienda.usuarioAsignado) {
                const usuarioId = typeof tienda.usuarioAsignado === 'string'
                    ? tienda.usuarioAsignado
                    : tienda.usuarioAsignado._id;
                try {
                    const response = await api.get(`/users/${usuarioId}`);
                    setUsuarioTienda(response.data);
                } catch (err) {
                    console.error('Error al obtener usuario:', err);
                    setUsuarioTienda(null);
                }
            } else {
                setUsuarioTienda(null);
            }
        } catch (err) {
            console.error('Error al obtener trabajadores:', err);
            setTrabajadoresTienda([]);
        }
        setOpenDetailsDialog(true);
    };

    const handleCloseDetailsDialog = () => {
        setOpenDetailsDialog(false);
        setSelectedTienda(null);
        setTrabajadoresTienda([]);
        setUsuarioTienda(null);
        setTabValue(0);
    };

    const handleOpenPasswordDialog = () => {
        setPasswordFormData({
            newPassword: '',
            confirmPassword: '',
        });
        setOpenPasswordDialog(true);
    };

    const handleClosePasswordDialog = () => {
        setOpenPasswordDialog(false);
        setPasswordFormData({
            newPassword: '',
            confirmPassword: '',
        });
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!usuarioTienda) {
            Swal.fire('Error', 'No hay usuario asignado a esta tienda', 'error');
            return;
        }

        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
            Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
            return;
        }

        if (passwordFormData.newPassword.length < 4) {
            Swal.fire('Error', 'La contraseña debe tener al menos 4 caracteres', 'error');
            return;
        }

        try {
            await api.put(`/users/${usuarioTienda._id}`, {
                password: passwordFormData.newPassword
            });
            handleClosePasswordDialog();
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Contraseña actualizada correctamente',
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al cambiar la contraseña';
            Swal.fire('Error', errorMessage, 'error');
        }
    };

    const handleOpenTrabajadorDialog = (trabajador?: Trabajador) => {
        if (trabajador) {
            setSelectedTrabajador(trabajador);
            setTrabajadorFormData({
                nombre: trabajador.nombre,
                identificador: trabajador.identificador,
            });
        } else {
            setSelectedTrabajador(null);
            setTrabajadorFormData({
                nombre: '',
                identificador: '',
            });
        }
        setOpenTrabajadorDialog(true);
    };

    const handleCloseTrabajadorDialog = () => {
        setOpenTrabajadorDialog(false);
        setSelectedTrabajador(null);
        setTrabajadorFormData({
            nombre: '',
            identificador: '',
        });
    };

    const handleSubmitTrabajador = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTienda) return;

        try {
            if (selectedTrabajador) {
                await trabajadoresService.update(selectedTrabajador._id, {
                    nombre: trabajadorFormData.nombre,
                });
            } else {
                await trabajadoresService.create({
                    nombre: trabajadorFormData.nombre,
                    identificador: trabajadorFormData.identificador,
                    tienda: selectedTienda._id,
                    activo: true,
                });
            }
            handleCloseTrabajadorDialog();
            // Refrescar trabajadores
            const trabajadores = await trabajadoresService.getByTienda(selectedTienda._id);
            setTrabajadoresTienda(trabajadores);
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: selectedTrabajador ? 'Trabajador actualizado' : 'Trabajador creado',
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al guardar trabajador';
            Swal.fire('Error', errorMessage, 'error');
        }
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedTienda(null);
        setFormData({
            nombre: '',
            codigo: '',
            descripcion: '',
            activa: true,
            usuarioAsignado: '',
        });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Si es una nueva tienda, validar que siempre se proporcione un usuario
            if (!selectedTienda) {
                if (!formData.crearUsuario && !formData.usuarioAsignado) {
                    setError('Debe crear un usuario nuevo o asignar un usuario existente a la tienda');
                    return;
                }

                // Validar que no se intente crear usuario y asignar uno existente al mismo tiempo
                if (formData.crearUsuario && formData.usuarioAsignado) {
                    setError('No puede crear un usuario nuevo y asignar uno existente al mismo tiempo');
                    return;
                }
            }

            // Validar que si crearUsuario es true, se proporcionen los datos necesarios
            if (formData.crearUsuario && (!formData.username || !formData.password || !formData.nombreUsuario)) {
                setError('Para crear un usuario automáticamente debe proporcionar username, password y nombre');
                return;
            }

            const tiendaData: CreateTiendaDto = {
                nombre: formData.nombre,
                codigo: formData.codigo,
                descripcion: formData.descripcion || undefined,
                activa: formData.activa,
                usuarioAsignado: formData.crearUsuario ? undefined : (formData.usuarioAsignado || undefined),
                crearUsuario: formData.crearUsuario,
                username: formData.crearUsuario ? formData.username : undefined,
                password: formData.crearUsuario ? formData.password : undefined,
                nombreUsuario: formData.crearUsuario ? formData.nombreUsuario : undefined,
            };

            if (selectedTienda) {
                await tiendasService.update(selectedTienda._id, tiendaData);
            } else {
                await tiendasService.create(tiendaData);
            }
            handleCloseDialog();
            fetchTiendas();
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: selectedTienda ? 'Tienda actualizada' : 'Tienda creada',
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Error al guardar tienda';
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
                await tiendasService.delete(id);
                fetchTiendas();
                Swal.fire('Eliminado', 'La tienda ha sido eliminada', 'success');
            } catch (err) {
                Swal.fire('Error', 'No se pudo eliminar la tienda', 'error');
            }
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            await tiendasService.toggleActive(id);
            fetchTiendas();
        } catch (err) {
            Swal.fire('Error', 'No se pudo cambiar el estado de la tienda', 'error');
        }
    };

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Gestión de Tiendas</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenDialog()}
                >
                    Nueva Tienda
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
                            <TableCell>Código</TableCell>
                            <TableCell>Descripción</TableCell>
                            <TableCell>Usuario Asignado</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tiendas.map(tienda => {
                            const usuarioNombre = typeof tienda.usuarioAsignado === 'string'
                                ? usuariosTienda.find(u => u._id === tienda.usuarioAsignado)?.username
                                : tienda.usuarioAsignado?.username;
                            
                            return (
                                <TableRow key={tienda._id}>
                                    <TableCell>{tienda.nombre}</TableCell>
                                    <TableCell>{tienda.codigo}</TableCell>
                                    <TableCell>{tienda.descripcion || '-'}</TableCell>
                                    <TableCell>{usuarioNombre || 'Sin asignar'}</TableCell>
                                    <TableCell>
                                        {tienda.activa ? (
                                            <Chip label="Activa" color="success" size="small" />
                                        ) : (
                                            <Chip label="Inactiva" color="error" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            onClick={() => handleOpenDetailsDialog(tienda)}
                                            color="info"
                                            size="small"
                                            title="Ver detalles y gestionar trabajadores"
                                        >
                                            <VisibilityIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleOpenDialog(tienda)}
                                            color="primary"
                                            size="small"
                                            title="Editar tienda"
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleToggleActive(tienda._id)}
                                            color={tienda.activa ? "error" : "success"}
                                            size="small"
                                            title={tienda.activa ? "Desactivar" : "Activar"}
                                        >
                                            {tienda.activa ? <BlockIcon /> : <CheckCircleIcon />}
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDelete(tienda._id)}
                                            color="error"
                                            size="small"
                                            title="Eliminar tienda"
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
                    {selectedTienda ? 'Editar Tienda' : 'Nueva Tienda'}
                </DialogTitle>
                <form onSubmit={handleSubmit}>
                    <DialogContent>
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
                            label="Código"
                            type="text"
                            fullWidth
                            value={formData.codigo}
                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                            required
                            disabled={!!selectedTienda}
                            helperText={selectedTienda ? "El código no se puede modificar" : ""}
                        />
                        <TextField
                            margin="dense"
                            label="Descripción"
                            type="text"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.descripcion}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        />
                        
                        {!selectedTienda && (
                            <>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'error.main' }}>
                                    * Usuario de la Tienda (Obligatorio)
                                </Typography>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formData.crearUsuario}
                                            onChange={(e) => {
                                                const crearUsuario = e.target.checked;
                                                setFormData({ 
                                                    ...formData, 
                                                    crearUsuario,
                                                    usuarioAsignado: crearUsuario ? '' : formData.usuarioAsignado,
                                                    username: crearUsuario ? formData.username : '',
                                                    password: crearUsuario ? formData.password : '',
                                                    nombreUsuario: crearUsuario ? formData.nombreUsuario : ''
                                                });
                                            }}
                                        />
                                    }
                                    label="Crear usuario automáticamente para esta tienda"
                                />
                            </>
                        )}

                        {formData.crearUsuario && !selectedTienda && (
                            <>
                                <TextField
                                    margin="dense"
                                    label="Username *"
                                    type="text"
                                    fullWidth
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                                <TextField
                                    margin="dense"
                                    label="Password *"
                                    type="password"
                                    fullWidth
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    helperText="Mínimo 4 caracteres"
                                />
                                <TextField
                                    margin="dense"
                                    label="Nombre del Usuario *"
                                    type="text"
                                    fullWidth
                                    value={formData.nombreUsuario}
                                    onChange={(e) => setFormData({ ...formData, nombreUsuario: e.target.value })}
                                    required
                                />
                            </>
                        )}

                        {!formData.crearUsuario && (
                            <FormControl fullWidth margin="dense" required={!selectedTienda}>
                                <InputLabel>Usuario TIENDA Asignado {!selectedTienda && '*'}</InputLabel>
                                <Select
                                    value={formData.usuarioAsignado}
                                    onChange={(e) => setFormData({ ...formData, usuarioAsignado: e.target.value })}
                                    label={`Usuario TIENDA Asignado ${!selectedTienda ? '*' : ''}`}
                                    required={!selectedTienda}
                                >
                                    {selectedTienda ? (
                                        <>
                                            <MenuItem value="">Sin asignar</MenuItem>
                                            {usuariosTienda.map(usuario => (
                                                <MenuItem key={usuario._id} value={usuario._id}>
                                                    {usuario.username} - {usuario.nombre}
                                                </MenuItem>
                                            ))}
                                        </>
                                    ) : (
                                        usuariosTienda.map(usuario => (
                                            <MenuItem key={usuario._id} value={usuario._id}>
                                                {usuario.username} - {usuario.nombre}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                                {!selectedTienda && usuariosTienda.length === 0 && (
                                    <Alert severity="info" sx={{ mt: 1 }}>
                                        No hay usuarios TIENDA disponibles. Debe crear un usuario nuevo marcando la opción anterior.
                                    </Alert>
                                )}
                            </FormControl>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {selectedTienda ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialog de Detalles de Tienda con Gestión de Trabajadores */}
            <Dialog open={openDetailsDialog} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">
                            {selectedTienda?.nombre} - Gestión
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<PeopleIcon />}
                            onClick={() => handleOpenTrabajadorDialog()}
                        >
                            Nuevo Trabajador
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {selectedTienda && (
                        <>
                            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
                                <Tab label="Información" />
                                <Tab label="Trabajadores" />
                            </Tabs>

                            {tabValue === 0 && (
                                <Box>
                                    <Typography variant="subtitle1" gutterBottom><strong>Código:</strong> {selectedTienda.codigo}</Typography>
                                    <Typography variant="subtitle1" gutterBottom><strong>Descripción:</strong> {selectedTienda.descripcion || 'Sin descripción'}</Typography>
                                    <Typography variant="subtitle1" gutterBottom>
                                        <strong>Estado:</strong> 
                                        <Chip 
                                            label={selectedTienda.activa ? "Activa" : "Inactiva"} 
                                            color={selectedTienda.activa ? "success" : "error"} 
                                            size="small" 
                                            sx={{ ml: 1 }}
                                        />
                                    </Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        Usuario de la Tienda
                                    </Typography>
                                    {usuarioTienda ? (
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                <strong>Username:</strong> {usuarioTienda.username}
                                            </Typography>
                                            <Typography variant="subtitle1" gutterBottom>
                                                <strong>Nombre:</strong> {usuarioTienda.nombre} {usuarioTienda.apellidos || ''}
                                            </Typography>
                                            <Typography variant="subtitle1" gutterBottom>
                                                <strong>Estado:</strong> 
                                                <Chip 
                                                    label={usuarioTienda.isActive ? "Activo" : "Inactivo"} 
                                                    color={usuarioTienda.isActive ? "success" : "error"} 
                                                    size="small" 
                                                    sx={{ ml: 1 }}
                                                />
                                            </Typography>
                                            <Box sx={{ mt: 2 }}>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={handleOpenPasswordDialog}
                                                >
                                                    Cambiar Contraseña
                                                </Button>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Alert severity="warning">
                                            No hay usuario asignado a esta tienda
                                        </Alert>
                                    )}
                                </Box>
                            )}

                            {tabValue === 1 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Trabajadores ({trabajadoresTienda.length})
                                    </Typography>
                                    {trabajadoresTienda.length === 0 ? (
                                        <Alert severity="info">
                                            No hay trabajadores asignados a esta tienda. Crea uno nuevo usando el botón "Nuevo Trabajador".
                                        </Alert>
                                    ) : (
                                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Nombre</TableCell>
                                                        <TableCell>Identificador</TableCell>
                                                        <TableCell>Estado</TableCell>
                                                        <TableCell>Acciones</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {trabajadoresTienda.map(trabajador => (
                                                        <TableRow key={trabajador._id}>
                                                            <TableCell>{trabajador.nombre}</TableCell>
                                                            <TableCell>{trabajador.identificador}</TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={trabajador.activo ? "Activo" : "Inactivo"} 
                                                                    color={trabajador.activo ? "success" : "error"} 
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <IconButton
                                                                    onClick={() => handleOpenTrabajadorDialog(trabajador)}
                                                                    color="primary"
                                                                    size="small"
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                                <IconButton
                                                                    onClick={async () => {
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
                                                                                await trabajadoresService.delete(trabajador._id);
                                                                                const trabajadores = await trabajadoresService.getByTienda(selectedTienda!._id);
                                                                                setTrabajadoresTienda(trabajadores);
                                                                                Swal.fire('Eliminado', 'El trabajador ha sido eliminado', 'success');
                                                                            } catch (err) {
                                                                                Swal.fire('Error', 'No se pudo eliminar el trabajador', 'error');
                                                                            }
                                                                        }
                                                                    }}
                                                                    color="error"
                                                                    size="small"
                                                                >
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDetailsDialog}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog para crear/editar trabajador */}
            <Dialog open={openTrabajadorDialog} onClose={handleCloseTrabajadorDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {selectedTrabajador ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                </DialogTitle>
                <form onSubmit={handleSubmitTrabajador}>
                    <DialogContent>
                        <TextField
                            margin="dense"
                            label="Nombre"
                            type="text"
                            fullWidth
                            value={trabajadorFormData.nombre}
                            onChange={(e) => setTrabajadorFormData({ ...trabajadorFormData, nombre: e.target.value })}
                            required
                        />
                        <TextField
                            margin="dense"
                            label="Identificador"
                            type="text"
                            fullWidth
                            value={trabajadorFormData.identificador}
                            onChange={(e) => setTrabajadorFormData({ ...trabajadorFormData, identificador: e.target.value })}
                            required
                            disabled={!!selectedTrabajador}
                            helperText={selectedTrabajador ? "El identificador no se puede modificar" : "Código único del trabajador"}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseTrabajadorDialog}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {selectedTrabajador ? 'Actualizar' : 'Crear'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialog para cambiar contraseña */}
            <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Cambiar Contraseña</DialogTitle>
                <form onSubmit={handleChangePassword}>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Usuario: <strong>{usuarioTienda?.username}</strong>
                        </Typography>
                        <TextField
                            margin="dense"
                            label="Nueva Contraseña"
                            type="password"
                            fullWidth
                            value={passwordFormData.newPassword}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                            required
                            helperText="Mínimo 4 caracteres"
                        />
                        <TextField
                            margin="dense"
                            label="Confirmar Contraseña"
                            type="password"
                            fullWidth
                            value={passwordFormData.confirmPassword}
                            onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })}
                            required
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClosePasswordDialog}>Cancelar</Button>
                        <Button type="submit" variant="contained" color="primary">
                            Cambiar Contraseña
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
};

export default TiendasList;

