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
    ToggleButton,
    ToggleButtonGroup,
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
import { Socio, SocioWithId } from '../../types/socio';
import { useNavigate } from 'react-router-dom';
import { PhotoCamera, FamilyRestroom, Block, FileUpload, FileDownload } from '@mui/icons-material';
import Swal from 'sweetalert2';
import GestionarMiembrosModal from './GestionarMiembrosModal';
import { Edit as EditIconMUI, Delete as DeleteIconMUI, PhotoCamera as PhotoCameraIcon, Add as AddIconMUI, People as PeopleIcon } from '@mui/icons-material';
import VerFamiliaModal from './VerFamiliaModal';
import {
    Block as BlockIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';

interface SociosListProps {
    socios: SocioWithId[];
    isLoading: boolean;
}

const SociosList: React.FC<SociosListProps> = ({ socios, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedSocio, setSelectedSocio] = useState<SocioWithId | null>(null);
    const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});
    const [sociosData, setSociosData] = useState<SocioWithId[]>([]);
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
        active: true as boolean,
    });
    const navigate = useNavigate();
    const { token, user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [openGestionarMiembros, setOpenGestionarMiembros] = useState(false);
    const [socioSeleccionado, setSocioSeleccionado] = useState<SocioWithId | null>(null);
    const [openVerFamilia, setOpenVerFamilia] = useState(false);
    const [openToggleDialog, setOpenToggleDialog] = useState(false);
    const { queryClient } = useQueryClient();

    // Query para obtener la lista de socios
    const { data: sociosDataData = [], isLoading: isLoadingData } = useQuery({
        queryKey: ['socios', searchTerm],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/socios?search=${searchTerm}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al cargar los socios');
            }
            return response.json();
        },
        enabled: !!token,
    });

    // Mutación para eliminar un socio
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`${API_BASE_URL}/socios/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al eliminar el socio');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['socios'] });
            Swal.fire({
                icon: 'success',
                title: 'Socio eliminado',
                text: 'El socio ha sido eliminado correctamente'
            });
            setOpenDeleteDialog(false);
            setSelectedSocio(null);
        },
        onError: (error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el socio'
            });
        },
    });

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
            setSociosData(data);
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
                active: socio.active,
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
                active: true,
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
            active: true,
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

    const handleDelete = (socio: SocioWithId) => {
        setSelectedSocio(socio);
        setOpenDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (selectedSocio) {
            deleteMutation.mutate(selectedSocio._id);
        }
    };

    const handleFotoUpdate = async (socioId: string, file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_BASE_URL}/uploads/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error al subir la imagen');
            }

            const data = await response.json();

            // Actualizar el socio con la nueva foto usando PUT en lugar de PATCH
            const updateResponse = await fetch(`${API_BASE_URL}/socios/${socioId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ foto: data.filename })
            });

            if (!updateResponse.ok) {
                throw new Error('Error al actualizar la foto del socio');
            }

            // Actualizar la lista de socios
            fetchSocios();

            Swal.fire({
                icon: 'success',
                title: 'Foto actualizada correctamente',
                showConfirmButton: false,
                timer: 1500
            });
        } catch (err) {
            console.error('Error al actualizar la foto:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Error al actualizar la foto'
            });
        }
    };

    const handleCreateSocio = () => {
        navigate('/socios/crear');
    };

    const handleEditSocio = (socio: SocioWithId) => {
        navigate(`/socios/editar/${socio._id}`);
    };

    const toggleRowExpand = (id: string) => {
        if (!id) return;
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleManageAsociados = (socio: SocioWithId) => {
        setSocioSeleccionado(socio);
        setOpenGestionarMiembros(true);
    };

    const handleCloseGestionarMiembros = () => {
        setOpenGestionarMiembros(false);
        setSocioSeleccionado(null);
    };

    const handleToggleActive = async (socio: SocioWithId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/socios/${socio._id}/toggle-active`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el estado del socio');
            }

            // Actualizar el estado local inmediatamente
            setSociosData(prevSocios =>
                prevSocios.map(s =>
                    s._id === socio._id
                        ? { ...s, active: !s.active }
                        : s
                )
            );

            // Mostrar notificación de éxito
            Swal.fire({
                icon: 'success',
                title: `Socio ${!socio.active ? 'activado' : 'desactivado'} correctamente`,
                showConfirmButton: false,
                timer: 1500
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar el estado del socio');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Error al actualizar el estado del socio'
            });
        }
    };

    const handleOpenVerFamilia = (socio: SocioWithId) => {
        setSelectedSocio(socio);
        setOpenVerFamilia(true);
    };

    const handleCloseVerFamilia = () => {
        setOpenVerFamilia(false);
        setSelectedSocio(null);
    };

    const handleToggleClick = (socio: SocioWithId) => {
        setSelectedSocio(socio);
        setOpenToggleDialog(true);
    };

    const handleCloseToggleDialog = () => {
        setOpenToggleDialog(false);
        setSelectedSocio(null);
    };

    const handleConfirmToggle = async () => {
        if (selectedSocio) {
            await handleToggleActive(selectedSocio);
            setOpenToggleDialog(false);
            setSelectedSocio(null);
        }
    };

    const handleExportSocios = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/socios/export`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error al exportar socios');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'socios.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al exportar socios');
        }
    };

    const handleImportSocios = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/socios/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                if (data.updates && data.updates.length > 0) {
                    // Mostrar diálogo de confirmación para actualizaciones
                    const result = await Swal.fire({
                        title: 'Socios existentes encontrados',
                        html: `
                            <p>Se encontraron ${data.updates.length} socios que necesitan actualización:</p>
                            <ul style="text-align: left; margin: 1rem 0;">
                                ${data.updates.map((update: any) => `
                                    <li>
                                        Socio ${update.socio}
                                        ${update.changes.socio ? '<br>- Datos del socio modificados' : ''}
                                        ${update.changes.asociados ? '<br>- Asociados modificados' : ''}
                                    </li>
                                `).join('')}
                            </ul>
                            <p>¿Desea actualizar estos socios?</p>
                        `,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sí, actualizar',
                        cancelButtonText: 'No, mantener actuales',
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33'
                    });

                    if (result.isConfirmed) {
                        // Realizar la actualización
                        const updateResponse = await fetch(`${API_BASE_URL}/socios/import/update`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            body: formData
                        });

                        const updateData = await updateResponse.json();

                        if (updateResponse.ok) {
                            Swal.fire({
                                title: 'Actualización completada',
                                text: `Se actualizaron ${updateData.success.length} socios correctamente`,
                                icon: 'success'
                            });
                            fetchSocios(); // Actualizar la lista
                        } else {
                            throw new Error(updateData.message || 'Error al actualizar socios');
                        }
                    }
                }

                if (data.success.length > 0) {
                    Swal.fire({
                        title: 'Importación exitosa',
                        text: `Se importaron ${data.success.length} socios correctamente`,
                        icon: 'success'
                    });
                    fetchSocios(); // Actualizar la lista
                }

                if (data.errors.length > 0) {
                    Swal.fire({
                        title: 'Errores en la importación',
                        html: `
                            <p>Se encontraron los siguientes errores:</p>
                            <ul style="text-align: left; margin: 1rem 0;">
                                ${data.errors.map((error: any) => `
                                    <li>
                                        ${error.socio ? `Socio ${error.socio}: ` : ''}
                                        ${error.asociado ? `Asociado ${error.asociado}: ` : ''}
                                        ${error.error}
                                    </li>
                                `).join('')}
                            </ul>
                        `,
                        icon: 'error'
                    });
                }
            } else {
                throw new Error(data.message || 'Error al importar socios');
            }
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error instanceof Error ? error.message : 'Error al importar socios',
                icon: 'error'
            });
        }

        // Limpiar el input de archivo
        event.target.value = '';
    };

    const renderFotoButton = (socio: SocioWithId) => {
        const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                try {
                    const formData = new FormData();
                    formData.append('file', file);

                    console.log('Subiendo imagen para socio:', socio._id, socio.nombre.nombre);
                    const response = await fetch(`${API_BASE_URL}/uploads/image`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error('Error al subir la imagen');
                    }

                    const data = await response.json();
                    console.log('Imagen subida exitosamente:', data.filename);

                    // Actualizar el socio con la nueva foto
                    const updateResponse = await fetch(`${API_BASE_URL}/socios/${socio._id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...socio,
                            foto: data.filename
                        })
                    });

                    if (!updateResponse.ok) {
                        throw new Error('Error al actualizar la foto del socio');
                    }

                    // Actualizar la lista de socios
                    fetchSocios();

                    Swal.fire({
                        icon: 'success',
                        title: 'Foto actualizada correctamente',
                        showConfirmButton: false,
                        timer: 1500
                    });
                } catch (err) {
                    console.error('Error al actualizar la foto:', err);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: err instanceof Error ? err.message : 'Error al actualizar la foto'
                    });
                }
            }
        };

        return (
            <Box>
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    id={`file-input-${socio._id}`}
                    onChange={handleFileChange}
                />
                <IconButton
                    color="primary"
                    onClick={() => document.getElementById(`file-input-${socio._id}`)?.click()}
                >
                    <PhotoCamera />
                </IconButton>
            </Box>
        );
    };

    const renderFoto = (foto: string | undefined) => {
        if (!foto) return null;
        return (
            <Avatar
                src={`${API_BASE_URL.replace('/api', '')}/uploads/${foto}`}
                alt="Foto socio"
                sx={{ width: 40, height: 40 }}
            />
        );
    };

    const renderFotoAsociado = (foto: string | undefined) => {
        if (!foto) return null;
        return (
            <Avatar
                src={`${API_BASE_URL.replace('/api', '')}/uploads/${foto}`}
                alt="Foto asociado"
                sx={{ width: 30, height: 30 }}
            />
        );
    };

    const handleAsociadoFotoUpdate = async (socioId: string, asociado: any, file: File) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            console.log('Subiendo imagen para asociado:', asociado.codigo);
            const response = await fetch(`${API_BASE_URL}/uploads/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Error al subir la imagen');
            }

            const data = await response.json();
            console.log('Imagen subida exitosamente:', data.filename);

            // Obtener el socio actual
            const socio = sociosData.find(s => s._id === socioId);
            if (!socio) {
                throw new Error('Socio no encontrado');
            }

            // Encontrar el asociado y actualizar su foto
            const asociados = socio.asociados?.map(a => {
                if (a.codigo === asociado.codigo) {
                    return { ...a, foto: data.filename };
                }
                return a;
            }) || [];

            // Actualizar el socio con los asociados modificados
            const updateResponse = await fetch(`${API_BASE_URL}/socios/${socioId}/asociados`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(asociados)
            });

            if (!updateResponse.ok) {
                throw new Error('Error al actualizar la foto del asociado');
            }

            // Actualizar la lista de socios
            fetchSocios();

            Swal.fire({
                icon: 'success',
                title: 'Foto actualizada correctamente',
                showConfirmButton: false,
                timer: 1500
            });
        } catch (err) {
            console.error('Error al actualizar la foto:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err instanceof Error ? err.message : 'Error al actualizar la foto'
            });
        }
    };

    const renderAsociadoFotoButton = (socioId: string, asociado: any) => {
        const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                await handleAsociadoFotoUpdate(socioId, asociado, file);
            }
        };

        return (
            <Box>
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    id={`file-input-asociado-${asociado.codigo}`}
                    onChange={handleFileChange}
                />
                <IconButton
                    size="small"
                    color="primary"
                    onClick={() => document.getElementById(`file-input-asociado-${asociado.codigo}`)?.click()}
                >
                    <PhotoCamera fontSize="small" />
                </IconButton>
            </Box>
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

    const filteredSocios = sociosData.filter(socio =>
        socio.nombre.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        socio.nombre.primerApellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        socio.socio.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Socios
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {(user?.role === 'ADMINISTRADOR' || user?.role === 'JUNTA') && (
                        <>
                            <input
                                type="file"
                                accept=".xlsx"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleImportSocios}
                            />
                            <Button
                                variant="contained"
                                startIcon={<FileUpload />}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Importar
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<FileDownload />}
                                onClick={handleExportSocios}
                            >
                                Exportar
                            </Button>
                        </>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/socios/create')}
                    >
                        Nuevo Socio
                    </Button>
                </Box>
            </Box>

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
                </Box>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell />
                                <TableCell>Foto</TableCell>
                                <TableCell>Nombre Completo</TableCell>
                                <TableCell>Código</TableCell>
                                <TableCell>Fecha Nacimiento (DD/MM/AAAA)</TableCell>
                                <TableCell>Contacto</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredSocios.map((socio) => (
                                <React.Fragment key={socio._id}>
                                    <TableRow
                                        sx={{
                                            backgroundColor: socio.active === false ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                                            '&:hover': {
                                                backgroundColor: socio.active === false ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                                            },
                                        }}
                                    >
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
                                        <TableCell>{socio.fechaNacimiento ? new Date(socio.fechaNacimiento).toLocaleDateString('es-ES', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        }) : 'No disponible'}</TableCell>
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
                                                    <IconButton
                                                        onClick={() => handleOpenVerFamilia(socio)}
                                                        color="primary"
                                                    >
                                                        <PeopleIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                {renderFotoButton(socio)}
                                                <Tooltip title={socio.active ? "Desactivar socio" : "Activar socio"}>
                                                    <IconButton
                                                        onClick={() => handleToggleClick(socio)}
                                                        color={socio.active ? "success" : "error"}
                                                    >
                                                        {socio.active ? <CheckCircleIcon /> : <BlockIcon />}
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
                                                                <TableCell>Fecha Nacimiento (DD/MM/AAAA)</TableCell>
                                                                <TableCell>Código Socio</TableCell>
                                                                <TableCell>Acciones</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {socio.asociados?.map((asociado, index) => (
                                                                <TableRow key={`${socio._id}-asociado-${index}`}>
                                                                    <TableCell>
                                                                        {renderFotoAsociado(asociado.foto)}
                                                                    </TableCell>
                                                                    <TableCell>{asociado.nombre}</TableCell>
                                                                    <TableCell>{asociado.fechaNacimiento ? new Date(asociado.fechaNacimiento).toLocaleDateString('es-ES', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric'
                                                                    }) : 'No disponible'}</TableCell>
                                                                    <TableCell>{asociado.codigo || 'No disponible'}</TableCell>
                                                                    <TableCell>
                                                                        {renderAsociadoFotoButton(socio._id, asociado)}
                                                                    </TableCell>
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
            </Box>

            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas eliminar este socio? Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>

            {socioSeleccionado && (
                <GestionarMiembrosModal
                    open={openGestionarMiembros}
                    onClose={handleCloseGestionarMiembros}
                    socio={socioSeleccionado}
                />
            )}

            {selectedSocio && (
                <VerFamiliaModal
                    open={openVerFamilia}
                    onClose={handleCloseVerFamilia}
                    socio={selectedSocio}
                />
            )}

            <Dialog
                open={openToggleDialog}
                onClose={handleCloseToggleDialog}
                container={document.body}
            >
                <DialogTitle>
                    {selectedSocio?.active ? "Desactivar Socio" : "Activar Socio"}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas {selectedSocio?.active ? "desactivar" : "activar"} al socio {selectedSocio?.nombre.nombre} {selectedSocio?.nombre.primerApellido}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseToggleDialog}>Cancelar</Button>
                    <Button
                        onClick={handleConfirmToggle}
                        color={selectedSocio?.active ? "error" : "success"}
                    >
                        {selectedSocio?.active ? "Desactivar" : "Activar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SociosList; 