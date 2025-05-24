import React, { useEffect, useState, useRef } from 'react';
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
    Avatar,
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
import { PhotoCamera } from '@mui/icons-material';
import { GridRenderCellParams } from '@mui/x-data-grid';
import Swal from 'sweetalert2';

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
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                nombre: socio.nombre.nombre,
                apellidos: `${socio.nombre.primerApellido} ${socio.nombre.segundoApellido || ''}`,
                email: socio.contacto?.emails?.[0] || '',
                telefono: socio.contacto?.telefonos?.[0] || '',
                direccion: `${socio.direccion.calle} ${socio.direccion.numero}${socio.direccion.piso ? `, ${socio.direccion.piso}` : ''}`,
                fechaAlta: new Date().toISOString().split('T')[0],
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

    const handleFotoUpdate = async (socioId: string, file: File) => {
        try {
            const formData = new FormData();
            formData.append('foto', file);

            const response = await fetch(`${API_BASE_URL}/socios/${socioId}/foto`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar la foto');
            }

            const data = await response.json();
            if (data.success) {
                // Actualizar la lista de socios
                fetchSocios();
                Swal.fire({
                    icon: 'success',
                    title: 'Foto actualizada',
                    text: 'La foto del socio ha sido actualizada correctamente'
                });
            } else {
                throw new Error('Error al actualizar la foto');
            }
        } catch (error) {
            console.error('Error al actualizar la foto:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo actualizar la foto del socio'
            });
        }
    };

    const renderFotoButton = (socio: Socio) => {
        const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('foto', file);

            try {
                const response = await fetch(`${API_BASE_URL}/socios/${socio._id}/foto`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Error updating foto');
                }

                // Actualizar la lista de socios
                fetchSocios();
                Swal.fire({
                    icon: 'success',
                    title: 'Foto actualizada',
                    text: 'La foto del socio ha sido actualizada correctamente'
                });
            } catch (error) {
                console.error('Error al actualizar la foto:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo actualizar la foto del socio'
                });
            }
        };

        return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    size="small"
                    color="primary"
                    title="Cambiar foto"
                >
                    <PhotoCamera />
                </IconButton>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
            </Box>
        );
    };

    // Filtrar socios según término de búsqueda
    const filteredSocios = socios?.filter((socio: Socio) => {
        const nombreCompleto = `${socio.nombre.nombre} ${socio.nombre.primerApellido} ${socio.nombre.segundoApellido || ''}`.toLowerCase();
        const dni = socio.dni?.toLowerCase() || '';
        const searchTermLower = searchTerm.toLowerCase();

        return (
            nombreCompleto.includes(searchTermLower) ||
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
    const toggleRowExpand = (id: string | undefined) => {
        if (!id) return;
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
                    label="Buscar por nombre o DNI"
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
                                <TableCell colSpan={7} align="center">
                                    No se encontraron socios
                                </TableCell>
                            </TableRow>
                        ) :
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
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar
                                                    src={socio.foto ? `${API_BASE_URL.replace('/api', '')}/uploads/${socio.foto}` : undefined}
                                                    sx={{ width: 40, height: 40, mr: 2 }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = ''; // Esto hará que se muestre la inicial
                                                        console.error('Error loading image:', socio.foto);
                                                    }}
                                                    imgProps={{
                                                        crossOrigin: 'anonymous',
                                                        loading: 'lazy',
                                                        referrerPolicy: 'no-referrer'
                                                    }}
                                                >
                                                    {!socio.foto && socio.nombre.nombre.charAt(0)}
                                                </Avatar>
                                                {socio.nombre.nombre} {socio.nombre.primerApellido} {socio.nombre.segundoApellido}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{socio.casa || '-'}</TableCell>
                                        <TableCell>{socio.dni}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${socio.numPersonas || 0} ${socio.numPersonas === 1 ? 'miembro' : 'miembros'}`}
                                                color="primary"
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{socio.cuota ? `${socio.cuota.toFixed(2)} €` : '-'}</TableCell>
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
                                            <Tooltip title="Actualizar foto">
                                                {renderFotoButton(socio)}
                                            </Tooltip>
                                            <Tooltip title="Eliminar socio">
                                                <IconButton onClick={() => handleDeleteClick(socio)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ py: 0 }} colSpan={7}>
                                            <Collapse in={expandedRows[socio._id || `row-${index}`]} timeout="auto" unmountOnExit>
                                                <Box sx={{ p: 3 }}>
                                                    <Typography variant="h6" gutterBottom component="div">
                                                        Miembros asociados
                                                    </Typography>
                                                    {socio.asociados && socio.asociados.length > 0 ? (
                                                        <Table size="small">
                                                            <TableHead>
                                                                <TableRow>
                                                                    <TableCell>Foto</TableCell>
                                                                    <TableCell>Nombre</TableCell>
                                                                    <TableCell>Fecha de nacimiento</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {socio.asociados.map((asociado, index) => (
                                                                    <TableRow key={index}>
                                                                        <TableCell>
                                                                            <Avatar
                                                                                src={asociado.foto ? `${API_BASE_URL.replace('/api', '')}/uploads/${asociado.foto}` : undefined}
                                                                                sx={{ width: 32, height: 32 }}
                                                                                onError={(e) => {
                                                                                    const target = e.target as HTMLImageElement;
                                                                                    target.src = ''; // Esto hará que se muestre la inicial
                                                                                    console.error('Error loading image:', asociado.foto);
                                                                                }}
                                                                                imgProps={{
                                                                                    crossOrigin: 'anonymous',
                                                                                    loading: 'lazy',
                                                                                    referrerPolicy: 'no-referrer'
                                                                                }}
                                                                            >
                                                                                {!asociado.foto && asociado.nombre.charAt(0)}
                                                                            </Avatar>
                                                                        </TableCell>
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
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))
                        }
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