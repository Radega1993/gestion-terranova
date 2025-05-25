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
import GroupIcon from '@mui/icons-material/Group';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useAuthStore } from '../../stores/authStore';
import { API_BASE_URL } from '../../config';
import { Socio } from '../../types/socio';
import { useNavigate } from 'react-router-dom';
import { PhotoCamera, FamilyRestroom, Block } from '@mui/icons-material';
import Swal from 'sweetalert2';

interface SocioWithId extends Omit<Socio, 'createdAt'> {
    _id: string;
    createdAt: string;
    isActive: boolean;
}

const SociosList: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedSocio, setSelectedSocio] = useState<SocioWithId | null>(null);
    const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});
    const [socios, setSocios] = useState<SocioWithId[]>([]);
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
        isActive: true as boolean,
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

    const handleOpenDialog = (socio?: SocioWithId) => {
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
                throw new Error('Error al actualizar la foto');
            }

            fetchSocios();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar la foto');
        }
    };

    const handleCreateSocio = () => {
        navigate('/socios/crear');
    };

    const handleEditSocio = (socio: SocioWithId) => {
        navigate(`/socios/editar/${socio._id}`);
    };

    const handleDeleteClick = (socio: SocioWithId) => {
        setSelectedSocio(socio);
        setOpenDeleteDialog(true);
    };

    const handleCancelDelete = () => {
        setOpenDeleteDialog(false);
        setSelectedSocio(null);
    };

    const handleConfirmDelete = async () => {
        if (selectedSocio?._id) {
            await handleDelete(selectedSocio._id);
            setOpenDeleteDialog(false);
            setSelectedSocio(null);
        }
    };

    const toggleRowExpand = (id: string) => {
        if (!id) return;
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleManageAsociados = (socio: SocioWithId) => {
        navigate(`/socios/${socio._id}/asociados`);
    };

    const handleToggleActive = async (socio: SocioWithId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/socios/${socio._id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive: !socio.isActive }),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el estado del socio');
            }

            fetchSocios();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar el estado del socio');
        }
    };

    const renderFotoButton = (socio: SocioWithId) => {
        const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                await handleFotoUpdate(socio._id, file);
            }
        };

        return (
            <Box>
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                <IconButton
                    color="primary"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <PhotoCamera />
                </IconButton>
            </Box>
        );
    };

    const renderFoto = (foto: string) => {
        if (!foto) return null;
        return (
            <Avatar
                src={`${API_BASE_URL.replace('/api', '')}/uploads/${foto}`}
                alt="Foto socio"
                sx={{ width: 40, height: 40 }}
            />
        );
    };

    const renderFotoAsociado = (foto: string) => {
        if (!foto) return null;
        return (
            <Avatar
                src={`${API_BASE_URL.replace('/api', '')}/uploads/${foto}`}
                alt="Foto asociado"
                sx={{ width: 30, height: 30 }}
            />
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <TextField
                    label="Buscar socio"
                    variant="outlined"
                    size="small"
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
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateSocio}
                >
                    Nuevo Socio
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Foto</TableCell>
                            <TableCell>Nombre Completo</TableCell>
                            <TableCell>Código</TableCell>
                            <TableCell>Fecha Nacimiento</TableCell>
                            <TableCell>Contacto</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {socios
                            .filter(socio =>
                                socio.nombre.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                socio.nombre.primerApellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                socio.socio.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((socio) => (
                                <React.Fragment key={socio._id}>
                                    <TableRow>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => toggleRowExpand(socio._id)}
                                            >
                                                {expandedRows[socio._id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                            </IconButton>
                                        </TableCell>
                                        <TableCell>
                                            {renderFoto(socio.foto)}
                                        </TableCell>
                                        <TableCell>
                                            {`${socio.nombre.nombre} ${socio.nombre.primerApellido} ${socio.nombre.segundoApellido || ''}`}
                                        </TableCell>
                                        <TableCell>{socio.socio}</TableCell>
                                        <TableCell>{new Date(socio.fechaNacimiento).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2">{socio.contacto?.telefonos?.[0] || 'No disponible'}</Typography>
                                                <Typography variant="body2">{socio.contacto?.emails?.[0] || 'No disponible'}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="Editar">
                                                    <IconButton onClick={() => handleEditSocio(socio)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Gestionar Miembros">
                                                    <IconButton onClick={() => handleManageAsociados(socio)}>
                                                        <GroupIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Ver Familia">
                                                    <IconButton>
                                                        <FamilyRestroom />
                                                    </IconButton>
                                                </Tooltip>
                                                {renderFotoButton(socio)}
                                                <Tooltip title={socio.isActive ? "Desactivar" : "Activar"}>
                                                    <IconButton onClick={() => handleToggleActive(socio)}>
                                                        <Block color={socio.isActive ? "error" : "success"} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                                            <Collapse in={expandedRows[socio._id]} timeout="auto" unmountOnExit>
                                                <Box sx={{ margin: 1 }}>
                                                    <Typography variant="h6" gutterBottom component="div">
                                                        Miembros Asociados
                                                    </Typography>
                                                    <Table size="small">
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Foto</TableCell>
                                                                <TableCell>Nombre Completo</TableCell>
                                                                <TableCell>Fecha Nacimiento</TableCell>
                                                                <TableCell>Código Socio</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {socio.asociados?.map((asociado) => (
                                                                <TableRow key={asociado._id}>
                                                                    <TableCell>
                                                                        {renderFotoAsociado(asociado.foto)}
                                                                    </TableCell>
                                                                    <TableCell>{asociado.nombre}</TableCell>
                                                                    <TableCell>{asociado.fechaNacimiento ? new Date(asociado.fechaNacimiento).toLocaleDateString() : 'No disponible'}</TableCell>
                                                                    <TableCell>{asociado.socio || 'No disponible'}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </Box>
                                            </Collapse>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={openDeleteDialog} onClose={handleCancelDelete}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas eliminar este socio? Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Cancelar</Button>
                    <Button onClick={handleConfirmDelete} color="error">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SociosList; 