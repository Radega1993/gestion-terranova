import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    IconButton,
    TextField,
    InputAdornment,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    Tooltip,
    Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useAuthStore } from '../../stores/authStore';
import { API_BASE_URL } from '../../config';
import { Socio } from '../../types/socio';
import { useNavigate } from 'react-router-dom';

const SociosList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
    const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});
    const [socios, setSocios] = useState<Socio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        apellidos: '',
        email: '',
        telefono: '',
        direccion: '',
        fechaAlta: new Date().toISOString().split('T')[0],
        isActive: true,
    });
    const navigate = useNavigate();
    const { token } = useAuthStore();

    const fetchSocios = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/socios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar socios');
            }

            const data = await response.json();
            setSocios(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar socios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSocios();
    }, [token]);

    const handleOpenDialog = (socio?: Socio) => {
        if (socio) {
            setSelectedSocio(socio);
            setFormData({
                nombre: socio.nombre,
                apellidos: socio.apellidos,
                email: socio.email,
                telefono: socio.telefono,
                direccion: socio.direccion,
                fechaAlta: new Date(socio.fechaAlta).toISOString().split('T')[0],
                isActive: socio.isActive,
            });
        } else {
            setSelectedSocio(null);
            setFormData({
                nombre: '',
                apellidos: '',
                email: '',
                telefono: '',
                direccion: '',
                fechaAlta: new Date().toISOString().split('T')[0],
                isActive: true,
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedSocio(null);
        setFormData({
            nombre: '',
            apellidos: '',
            email: '',
            telefono: '',
            direccion: '',
            fechaAlta: new Date().toISOString().split('T')[0],
            isActive: true,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = selectedSocio
                ? `${API_BASE_URL}/socios/${selectedSocio._id}`
                : `${API_BASE_URL}/socios`;

            const method = selectedSocio ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Error al guardar socio');
            }

            handleCloseDialog();
            fetchSocios();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar socio');
        }
    };

    const handleDelete = async (socioId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este socio?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/socios/${socioId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al eliminar socio');
            }

            fetchSocios();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar socio');
        }
    };

    // Filtrar socios según término de búsqueda
    const filteredSocios = socios?.filter((socio: Socio) => {
        const nombreCompleto = `${socio.nombre.nombre} ${socio.nombre.primerApellido} ${socio.nombre.segundoApellido || ''}`.toLowerCase();
        const codigoSocio = socio.socio.toLowerCase();
        const dni = socio.dni?.toLowerCase() || '';
        const searchTermLower = searchTerm.toLowerCase();

        return (
            nombreCompleto.includes(searchTermLower) ||
            codigoSocio.includes(searchTermLower) ||
            dni.includes(searchTermLower)
        );
    });

    // Navegar a la página de creación de socio
    const handleCreateSocio = () => {
        navigate('/socios/crear');
    };

    // Navegar a la página para añadir miembro a un socio existente
    const handleAddMember = (socio: Socio) => {
        console.log("Añadir miembro al socio:", socio._id);
        console.log("Token disponible:", !!token);

        // Verificar que el token esté disponible
        if (!token) {
            console.error("No hay token disponible");
            // Guardar el ID del socio para redirigir después del login
            localStorage.setItem('redirect_after_login', `/socios/editar/${socio._id}?addMember=true`);
            navigate('/login');
            return;
        }

        // Redirigir a la página de edición con parámetro para abrir directamente la sección de miembros
        navigate(`/socios/editar/${socio._id}?addMember=true`);
    };

    // Navegar a la página de edición de socio
    const handleEditSocio = (socio: Socio) => {
        console.log("Editar socio:", socio._id);
        console.log("Token disponible:", !!token);

        // Verificar que el token esté disponible
        if (!token) {
            console.error("No hay token disponible");
            // Guardar el ID del socio para redirigir después del login
            localStorage.setItem('redirect_after_login', `/socios/editar/${socio._id}`);
            navigate('/login');
            return;
        }

        navigate(`/socios/editar/${socio._id}`);
    };

    // Abrir diálogo para confirmar eliminación
    const handleDeleteClick = (socio: Socio) => {
        setSelectedSocio(socio);
        setOpenDeleteDialog(true);
    };

    // Cancelar eliminación
    const handleCancelDelete = () => {
        setOpenDeleteDialog(false);
        setSelectedSocio(null);
    };

    // Confirmar eliminación
    const handleConfirmDelete = async () => {
        if (!selectedSocio) return;

        try {
            await handleDelete(selectedSocio._id);
            setOpenDeleteDialog(false);
            setSelectedSocio(null);
        } catch (error) {
            console.error('Error al eliminar socio:', error);
        }
    };

    // Alternar expansión de filas para mostrar miembros
    const toggleRowExpand = (id: string) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Cargando socios...
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Gestión de Socios</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateSocio}
                >
                    Nuevo Socio
                </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    label="Buscar por nombre, código o DNI"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: '56px' }} />
                            <TableCell>Código</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Casa</TableCell>
                            <TableCell>DNI</TableCell>
                            <TableCell>Miembros</TableCell>
                            <TableCell>Cuota</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSocios?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No se encontraron socios
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSocios?.map((socio: Socio, index: number) => (
                                <React.Fragment key={socio._id}>
                                    <TableRow>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleRowExpand(socio._id || `row-${index}`)}
                                            >
                                                {expandedRows[socio._id || `row-${index}`] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>{socio.socio}</TableCell>
                                        <TableCell>
                                            {socio.nombre.nombre} {socio.nombre.primerApellido} {socio.nombre.segundoApellido}
                                        </TableCell>
                                        <TableCell>{socio.casa}</TableCell>
                                        <TableCell>{socio.dni}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${socio.numPersonas} ${socio.numPersonas === 1 ? 'miembro' : 'miembros'}`}
                                                color="primary"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{socio.cuota.toFixed(2)} €</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Añadir miembro">
                                                <IconButton onClick={() => handleAddMember(socio)} color="primary">
                                                    <PersonAddIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Editar socio">
                                                <IconButton onClick={() => handleEditSocio(socio)} color="secondary">
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Eliminar socio">
                                                <IconButton onClick={() => handleDeleteClick(socio)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ py: 0 }} colSpan={8}>
                                            <Collapse in={expandedRows[socio._id || `row-${index}`]} timeout="auto" unmountOnExit>
                                                <Box sx={{ p: 3 }}>
                                                    <Typography variant="h6" gutterBottom component="div">
                                                        Miembros asociados
                                                    </Typography>
                                                    {socio.asociados && socio.asociados.length > 0 ? (
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell>Nombre</TableCell>
                                                                    <TableCell>Fecha de nacimiento</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {socio.asociados.map((asociado, index) => (
                                                                    <TableRow key={index}>
                                                                        <TableCell>{asociado.nombre}</TableCell>
                                                                        <TableCell>
                                                                            {asociado.fechaNacimiento ?
                                                                                new Date(asociado.fechaNacimiento).toLocaleDateString() :
                                                                                '-'}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            No hay miembros asociados
                                                        </Typography>
                                                    )}

                                                    <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
                                                        Miembros especiales
                                                    </Typography>
                                                    {socio.especiales && socio.especiales.length > 0 ? (
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell>Nombre</TableCell>
                                                                    <TableCell>Fecha de nacimiento</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {socio.especiales.map((especial, index) => (
                                                                    <TableRow key={index}>
                                                                        <TableCell>{especial.nombre}</TableCell>
                                                                        <TableCell>
                                                                            {especial.fechaNacimiento ?
                                                                                new Date(especial.fechaNacimiento).toLocaleDateString() :
                                                                                '-'}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    ) : (
                                                        <Typography variant="body2" color="text.secondary">
                                                            No hay miembros especiales
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Diálogo de confirmación para eliminar */}
            <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        ¿Estás seguro de que deseas eliminar al socio {selectedSocio?.nombre.nombre}{' '}
                        {selectedSocio?.nombre.primerApellido}?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                        Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="error">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>
                    {selectedSocio ? 'Editar Socio' : 'Nuevo Socio'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nombre"
                        type="text"
                        fullWidth
                        value={formData.nombre}
                        onChange={(e) =>
                            setFormData({ ...formData, nombre: e.target.value })
                        }
                    />
                    <TextField
                        margin="dense"
                        label="Apellidos"
                        type="text"
                        fullWidth
                        value={formData.apellidos}
                        onChange={(e) =>
                            setFormData({ ...formData, apellidos: e.target.value })
                        }
                    />
                    <TextField
                        margin="dense"
                        label="Email"
                        type="email"
                        fullWidth
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                    />
                    <TextField
                        margin="dense"
                        label="Teléfono"
                        type="tel"
                        fullWidth
                        value={formData.telefono}
                        onChange={(e) =>
                            setFormData({ ...formData, telefono: e.target.value })
                        }
                    />
                    <TextField
                        margin="dense"
                        label="Dirección"
                        type="text"
                        fullWidth
                        value={formData.direccion}
                        onChange={(e) =>
                            setFormData({ ...formData, direccion: e.target.value })
                        }
                    />
                    <TextField
                        margin="dense"
                        label="Fecha Alta"
                        type="date"
                        fullWidth
                        value={formData.fechaAlta}
                        onChange={(e) =>
                            setFormData({ ...formData, fechaAlta: e.target.value })
                        }
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SociosList; 