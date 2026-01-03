import React, { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Avatar,
    Typography
} from '@mui/material';
import { Edit as EditIcon, PhotoCamera as PhotoCameraIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { Socio } from '../../types/socio';
import MiembroForm from './MiembroForm';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';
import '../../styles/sweetalert2.css';

// Configurar Swal para que aparezca por encima de los modales
Swal.mixin({
    customClass: {
        container: 'swal-over-modal'
    }
});

interface GestionarMiembrosModalProps {
    open: boolean;
    onClose: () => void;
    socio: Socio;
    onUpdate?: () => void;
}

const GestionarMiembrosModal: React.FC<GestionarMiembrosModalProps> = ({
    open,
    onClose,
    socio,
    onUpdate
}) => {
    const [openMiembroForm, setOpenMiembroForm] = useState(false);
    const [selectedMiembro, setSelectedMiembro] = useState<any>(null);
    const queryClient = useQueryClient();
    const { token, user } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);



    const { data: asociadosRaw, isLoading } = useQuery({
        queryKey: ['socios', socio._id, 'asociados'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/socios/${socio._id}/asociados`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener los asociados');
            }

            return response.json();
        }
    });

    // Filtrar asociados inválidos (sin código válido o sin nombre válido)
    const asociados = asociadosRaw?.filter((asociado: any) => {
        // Un asociado es válido si tiene código Y nombre válidos
        const tieneCodigo = asociado.codigo && typeof asociado.codigo === 'string' && asociado.codigo.trim() !== '';
        const tieneNombre = asociado.nombre && typeof asociado.nombre === 'string' && asociado.nombre.trim() !== '';
        return tieneCodigo && tieneNombre;
    }) || [];

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch(`${API_BASE_URL}/socios/${socio._id}/asociados`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Error al crear el asociado');
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidar tanto la query de asociados como la lista principal de socios
            queryClient.invalidateQueries({ queryKey: ['socios', socio._id, 'asociados'] });
            queryClient.invalidateQueries({ queryKey: ['socios'] });
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Asociado creado correctamente'
            });
            handleCloseMiembroForm();
            if (typeof onUpdate === 'function') {
                onUpdate();
            }
        },
        onError: () => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al crear el asociado'
            });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ codigo, data }: { codigo: string; data: any }) => {
            if (!codigo) {
                throw new Error('Código del asociado no válido');
            }

            const response = await fetch(`${API_BASE_URL}/socios/${socio._id}/asociados/${codigo}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el asociado');
            }

            return response.json();
        },
        onSuccess: () => {
            // Invalidar tanto la query de asociados como la lista principal de socios
            queryClient.invalidateQueries({ queryKey: ['socios', socio._id, 'asociados'] });
            queryClient.invalidateQueries({ queryKey: ['socios'] });
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Asociado actualizado correctamente'
            });
            handleCloseMiembroForm();
            if (typeof onUpdate === 'function') {
                onUpdate();
            }
        },
        onError: (error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error instanceof Error ? error.message : 'Error al actualizar el asociado'
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (codigo: string) => {
            if (!codigo) {
                throw new Error('Código del asociado no válido');
            }

            const response = await fetch(`${API_BASE_URL}/socios/${socio._id}/asociados/${codigo}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el asociado');
            }

            // No intentar parsear JSON si la respuesta está vacía
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            }
            return null;
        },
        onSuccess: () => {
            // Invalidar tanto la query de asociados como la lista principal de socios
            queryClient.invalidateQueries({ queryKey: ['socios', socio._id, 'asociados'] });
            queryClient.invalidateQueries({ queryKey: ['socios'] });
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Asociado eliminado correctamente'
            });
        },
        onError: (error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error instanceof Error ? error.message : 'Error al eliminar el asociado'
            });
        }
    });

    const handleOpenMiembroForm = (miembro?: any) => {
        if (miembro && !miembro.codigo) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Código del asociado no válido'
            });
            return;
        }
        setSelectedMiembro(miembro);
        setOpenMiembroForm(true);
    };

    const handleCloseMiembroForm = () => {
        setSelectedMiembro(null);
        setOpenMiembroForm(false);
    };

    const handleDeleteMiembro = (codigo: string) => {
        if (!codigo) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Código del asociado no válido'
            });
            return;
        }

        Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMutation.mutate(codigo);
            }
        });
    };

    const handleSubmitMiembro = async (miembroData: any) => {
        if (selectedMiembro) {
            if (!selectedMiembro.codigo) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Código del asociado no válido'
                });
                return;
            }
            updateMutation.mutate({ codigo: selectedMiembro.codigo, data: miembroData });
        } else {
            createMutation.mutate(miembroData);
        }
    };

    const handleFotoUpdate = async (asociado: any, file: File) => {
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

            // Actualizar el asociado con la nueva foto
            const updateResponse = await fetch(`${API_BASE_URL}/socios/${socio._id}/asociados/${asociado.codigo}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ foto: data.filename })
            });

            if (!updateResponse.ok) {
                throw new Error('Error al actualizar la foto del asociado');
            }

            // Actualizar la lista de asociados
            queryClient.invalidateQueries({ queryKey: ['socios', socio._id, 'asociados'] });

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

    const renderFotoButton = (asociado: any) => {
        return (
            <>
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            handleFotoUpdate(asociado, file);
                        }
                    }}
                />
                <IconButton
                    color="secondary"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <PhotoCameraIcon />
                </IconButton>
            </>
        );
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>Gestionar Asociados de {socio.nombre.nombre}</DialogTitle>
                <DialogContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Foto</TableCell>
                                    <TableCell>Código</TableCell>
                                    <TableCell>Nombre Completo</TableCell>
                                    <TableCell>Fecha de Nacimiento(MM/DD/AAAA)</TableCell>
                                    <TableCell>Teléfono</TableCell>
                                    <TableCell>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {asociados && asociados.length > 0 ? (
                                    asociados.map((asociado: any, index: number) => {
                                    // Manejar casos donde nombre puede ser undefined o null
                                    const nombreCompleto = asociado.nombre || 'Sin nombre';
                                    const inicialNombre = nombreCompleto && typeof nombreCompleto === 'string' 
                                        ? nombreCompleto.charAt(0).toUpperCase() 
                                        : '?';
                                    
                                    // Generar una key única usando múltiples campos o índice
                                    const uniqueKey = asociado._id || asociado.codigo || `asociado-${index}`;
                                    
                                    return (
                                    <TableRow key={uniqueKey}>
                                        <TableCell>
                                            <Avatar
                                                src={asociado.foto ? `${API_BASE_URL.replace('/api', '')}/uploads/${asociado.foto}` : undefined}
                                                alt={nombreCompleto}
                                                onClick={() => handleOpenMiembroForm(asociado)}
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        opacity: 0.8
                                                    }
                                                }}
                                            >
                                                {inicialNombre}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>{asociado.codigo || '-'}</TableCell>
                                        <TableCell>{nombreCompleto}</TableCell>
                                        <TableCell>
                                            {asociado.fechaNacimiento
                                                ? new Date(asociado.fechaNacimiento).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell>{asociado.telefono || '-'}</TableCell>
                                        <TableCell>
                                            <IconButton
                                                key={`edit-${uniqueKey}`}
                                                onClick={() => handleOpenMiembroForm(asociado)}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            {renderFotoButton(asociado)}
                                            {(user?.role === 'ADMINISTRADOR' || user?.role === 'JUNTA') && (
                                                <IconButton
                                                    key={`delete-${uniqueKey}`}
                                                    onClick={() => handleDeleteMiembro(asociado.codigo || asociado._id || '')}
                                                    color="error"
                                                    title="Eliminar asociado"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    );
                                })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {asociadosRaw && asociadosRaw.length > 0 
                                                    ? 'No hay asociados válidos. Los asociados sin código o nombre válido han sido filtrados automáticamente.'
                                                    : 'No hay asociados registrados para este socio.'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenMiembroForm()}
                        color="primary"
                    >
                        Añadir Asociado
                    </Button>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogActions>
            </Dialog>

            <MiembroForm
                open={openMiembroForm}
                onClose={handleCloseMiembroForm}
                onSubmit={handleSubmitMiembro}
                miembro={selectedMiembro}
                socio={socio}
            />
        </>
    );
};

export default GestionarMiembrosModal; 