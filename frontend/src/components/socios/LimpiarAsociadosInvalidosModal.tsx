import React, { useState } from 'react';
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
    Checkbox,
    TextField,
    IconButton,
    Chip,
    Box,
    Typography,
    Alert,
    CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';

interface AsociadoInvalido {
    socioId: string;
    socioCodigo: string;
    socioNombre: string;
    asociado: any;
    motivo: string[];
}

interface LimpiarAsociadosInvalidosModalProps {
    open: boolean;
    onClose: () => void;
}

const LimpiarAsociadosInvalidosModal: React.FC<LimpiarAsociadosInvalidosModalProps> = ({
    open,
    onClose
}) => {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<{ [key: string]: { codigo: string; nombre: string } }>({});

    // Query para obtener asociados inválidos
    const { data: asociadosInvalidos = [], isLoading, refetch } = useQuery<AsociadoInvalido[]>({
        queryKey: ['asociados-invalidos'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/socios/asociados-invalidos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error al obtener asociados inválidos');
            }
            return response.json();
        },
        enabled: open && !!token
    });

    // Mutación para actualizar un asociado
    const updateAsociadoMutation = useMutation({
        mutationFn: async ({ socioId, asociadoIndex, data }: { socioId: string; asociadoIndex: number; data: any }) => {
            const response = await fetch(`${API_BASE_URL}/socios/${socioId}/asociados-index/${asociadoIndex}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el asociado');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['asociados-invalidos'] });
            queryClient.invalidateQueries({ queryKey: ['socios'] });
            Swal.fire({
                icon: 'success',
                title: 'Asociado actualizado',
                text: 'El asociado ha sido actualizado correctamente',
                timer: 2000,
                showConfirmButton: false
            });
            setEditingId(null);
            refetch();
        },
        onError: (error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error instanceof Error ? error.message : 'Error al actualizar el asociado'
            });
        }
    });

    // Mutación para limpiar asociados seleccionados
    const limpiarMutation = useMutation({
        mutationFn: async (idsToDelete: Array<{ socioId: string; asociadoId?: string; asociadoCodigo?: string }>) => {
            const response = await fetch(`${API_BASE_URL}/socios/limpiar-asociados-invalidos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ idsToDelete })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al limpiar asociados inválidos');
            }
            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['socios'] });
            queryClient.invalidateQueries({ queryKey: ['asociados-invalidos'] });
            Swal.fire({
                icon: 'success',
                title: 'Limpieza completada',
                html: `
                    <p><strong>${data.sociosActualizados}</strong> socios actualizados</p>
                    <p><strong>${data.asociadosEliminados}</strong> asociados eliminados</p>
                `,
                confirmButtonText: 'Aceptar'
            });
            setSelectedIds(new Set());
            onClose();
        },
        onError: (error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error instanceof Error ? error.message : 'Error al limpiar asociados inválidos'
            });
        }
    });

    const handleSelectAll = () => {
        if (selectedIds.size === asociadosInvalidos.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(asociadosInvalidos.map((item, index) => `${item.socioId}-${index}`)));
        }
    };

    const handleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleEdit = (item: AsociadoInvalido, index: number) => {
        const id = `${item.socioId}-${index}`;
        setEditingId(id);
        setEditedData({
            [id]: {
                codigo: item.asociado.codigo || '',
                nombre: item.asociado.nombre || ''
            }
        });
    };

    const handleSave = async (item: AsociadoInvalido, index: number) => {
        const id = `${item.socioId}-${index}`;
        const data = editedData[id];
        
        if (!data.codigo || data.codigo.trim() === '') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El código es requerido'
            });
            return;
        }

        if (!data.nombre || data.nombre.trim() === '') {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El nombre es requerido'
            });
            return;
        }

        // Encontrar el índice del asociado en el array del socio
        const socioResponse = await fetch(`${API_BASE_URL}/socios/${item.socioId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!socioResponse.ok) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo obtener la información del socio'
            });
            return;
        }
        
        const socio = await socioResponse.json();
        
        // Buscar el asociado en el array del socio usando múltiples criterios
        let asociadoIndex = -1;
        
        // Primero intentar usar el índice original si está disponible
        if (item.asociado._originalIndex !== undefined) {
            asociadoIndex = item.asociado._originalIndex;
        }
        
        // Si no hay índice original, intentar por _id si existe
        if (asociadoIndex === -1 && item.asociado._id) {
            asociadoIndex = socio.asociados.findIndex((a: any) => 
                a._id && a._id.toString() === item.asociado._id.toString()
            );
        }
        
        // Si no se encontró por _id, intentar por código original
        if (asociadoIndex === -1 && item.asociado.codigo) {
            asociadoIndex = socio.asociados.findIndex((a: any) => 
                a.codigo === item.asociado.codigo
            );
        }
        
        // Si aún no se encontró, buscar por posición relativa en el array de inválidos
        // Esto es menos confiable pero necesario cuando no hay identificadores únicos
        if (asociadoIndex === -1) {
            // Contar cuántos asociados inválidos hay antes de este en el mismo socio
            const asociadosInvalidosDelMismoSocio = asociadosInvalidos
                .slice(0, index)
                .filter(inv => inv.socioId === item.socioId);
            
            // Buscar en el socio los asociados inválidos y encontrar la posición
            let invalidosEncontrados = 0;
            for (let i = 0; i < socio.asociados.length; i++) {
                const a = socio.asociados[i];
                const tieneCodigo = a.codigo && typeof a.codigo === 'string' && a.codigo.trim() !== '';
                const tieneNombre = a.nombre && typeof a.nombre === 'string' && a.nombre.trim() !== '';
                
                if (!tieneCodigo || !tieneNombre) {
                    if (invalidosEncontrados === asociadosInvalidosDelMismoSocio.length) {
                        asociadoIndex = i;
                        break;
                    }
                    invalidosEncontrados++;
                }
            }
        }

        if (asociadoIndex === -1) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo encontrar el asociado en el socio. Por favor, recarga la página e intenta de nuevo.'
            });
            return;
        }

        updateAsociadoMutation.mutate({
            socioId: item.socioId,
            asociadoIndex,
            data: {
                codigo: data.codigo.trim(),
                nombre: data.nombre.trim(),
                telefono: item.asociado.telefono || '',
                fechaNacimiento: item.asociado.fechaNacimiento
            }
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditedData({});
    };

    const handleLimpiar = () => {
        if (selectedIds.size === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Sin selección',
                text: 'Por favor, selecciona al menos un asociado para eliminar'
            });
            return;
        }

        Swal.fire({
            title: '¿Eliminar asociados seleccionados?',
            html: `
                <p>Se eliminarán <strong>${selectedIds.size}</strong> asociados inválidos.</p>
                <p><strong>Esta acción no se puede deshacer.</strong></p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const idsToDelete = Array.from(selectedIds).map(id => {
                    const [socioId, index] = id.split('-');
                    const item = asociadosInvalidos[parseInt(index, 10)];
                    return {
                        socioId,
                        asociadoCodigo: item.asociado.codigo,
                        asociadoId: item.asociado._id?.toString()
                    };
                });
                limpiarMutation.mutate(idsToDelete);
            }
        });
    };

    const getUniqueId = (item: AsociadoInvalido, index: number) => {
        return `${item.socioId}-${index}`;
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                Gestionar Asociados Inválidos
            </DialogTitle>
            <DialogContent>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : asociadosInvalidos.length === 0 ? (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        No hay asociados inválidos en la base de datos.
                    </Alert>
                ) : (
                    <>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Se encontraron <strong>{asociadosInvalidos.length}</strong> asociados inválidos. 
                            Puedes editarlos para corregir los datos o seleccionarlos para eliminarlos.
                        </Alert>
                        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                indeterminate={selectedIds.size > 0 && selectedIds.size < asociadosInvalidos.length}
                                                checked={asociadosInvalidos.length > 0 && selectedIds.size === asociadosInvalidos.length}
                                                onChange={handleSelectAll}
                                            />
                                        </TableCell>
                                        <TableCell>Socio</TableCell>
                                        <TableCell>Código</TableCell>
                                        <TableCell>Nombre</TableCell>
                                        <TableCell>Motivo</TableCell>
                                        <TableCell>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {asociadosInvalidos.map((item, index) => {
                                        const id = getUniqueId(item, index);
                                        const isEditing = editingId === id;
                                        const isSelected = selectedIds.has(id);
                                        const editData = editedData[id] || { codigo: item.asociado.codigo || '', nombre: item.asociado.nombre || '' };

                                        return (
                                            <TableRow key={id} selected={isSelected}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onChange={() => handleSelect(id)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {item.socioCodigo}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {item.socioNombre}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <TextField
                                                            size="small"
                                                            value={editData.codigo}
                                                            onChange={(e) => setEditedData({
                                                                ...editedData,
                                                                [id]: { ...editData, codigo: e.target.value }
                                                            })}
                                                            error={!editData.codigo || editData.codigo.trim() === ''}
                                                            helperText={!editData.codigo || editData.codigo.trim() === '' ? 'Requerido' : ''}
                                                        />
                                                    ) : (
                                                        item.asociado.codigo || <Typography color="error" variant="body2">Sin código</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <TextField
                                                            size="small"
                                                            value={editData.nombre}
                                                            onChange={(e) => setEditedData({
                                                                ...editedData,
                                                                [id]: { ...editData, nombre: e.target.value }
                                                            })}
                                                            error={!editData.nombre || editData.nombre.trim() === ''}
                                                            helperText={!editData.nombre || editData.nombre.trim() === '' ? 'Requerido' : ''}
                                                        />
                                                    ) : (
                                                        item.asociado.nombre || <Typography color="error" variant="body2">Sin nombre</Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {item.motivo.map((motivo, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={motivo}
                                                            color="error"
                                                            size="small"
                                                            sx={{ mr: 0.5, mb: 0.5 }}
                                                        />
                                                    ))}
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <IconButton
                                                                size="small"
                                                                color="primary"
                                                                onClick={() => handleSave(item, index)}
                                                                disabled={updateAsociadoMutation.isPending}
                                                            >
                                                                <SaveIcon />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={handleCancel}
                                                            >
                                                                <CancelIcon />
                                                            </IconButton>
                                                        </Box>
                                                    ) : (
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => handleEdit(item, index)}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {selectedIds.size} de {asociadosInvalidos.length} seleccionados
                            </Typography>
                        </Box>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cerrar</Button>
                {asociadosInvalidos.length > 0 && (
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleLimpiar}
                        disabled={selectedIds.size === 0 || limpiarMutation.isPending}
                    >
                        {limpiarMutation.isPending ? 'Eliminando...' : `Eliminar Seleccionados (${selectedIds.size})`}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default LimpiarAsociadosInvalidosModal;

