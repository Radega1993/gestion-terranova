import React, { useState, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    CircularProgress,
    Typography,
    Chip,
    OutlinedInput
} from '@mui/material';
import { trabajadoresService, Trabajador } from '../../services/trabajadores';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types/user';
import { API_BASE_URL } from '../../config';

interface Usuario {
    _id: string;
    username: string;
    nombre: string;
    apellidos: string;
    role: string;
    activo: boolean;
}

interface UsuarioTrabajadorSelectorProps {
    value?: string | string[];
    onChange: (ids: string[], tipos: Array<'usuario' | 'trabajador'>) => void;
    required?: boolean;
    multiple?: boolean;
}

export const UsuarioTrabajadorSelector: React.FC<UsuarioTrabajadorSelectorProps> = ({
    value,
    onChange,
    required = false,
    multiple = false
}) => {
    const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token, userRole } = useAuthStore();

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Cargar trabajadores si el usuario es TIENDA
                if (userRole === UserRole.TIENDA) {
                    try {
                        const trabajadoresData = await trabajadoresService.getMisTrabajadores();
                        setTrabajadores(trabajadoresData.filter(t => t.activo));
                    } catch (error: any) {
                        if (error?.response?.status === 401 || error?.response?.status === 400) {
                            console.warn('No tiene una tienda asignada');
                            setTrabajadores([]);
                        } else {
                            console.error('Error al obtener trabajadores:', error);
                        }
                    }
                }

                // Cargar usuarios (excluyendo TIENDA)
                try {
                    const response = await fetch(`${API_BASE_URL}/users`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        // Filtrar usuarios TIENDA
                        const usuariosFiltrados = data.filter((user: Usuario) => user.role !== 'TIENDA');
                        setUsuarios(usuariosFiltrados);
                    } else if (response.status === 401 || response.status === 403) {
                        console.warn('No tiene permisos para ver la lista de usuarios');
                        setUsuarios([]);
                    }
                } catch (error) {
                    console.error('Error al cargar usuarios:', error);
                }
            } catch (error) {
                console.error('Error al cargar datos:', error);
                setError('Error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [token, userRole]);

    // Crear lista combinada de opciones
    const opciones = [
        ...trabajadores.map(t => ({
            id: t._id,
            label: `${t.nombre} (${t.identificador})`,
            tipo: 'trabajador' as const
        })),
        ...usuarios.map(u => ({
            id: u._id,
            label: `${u.nombre} ${u.apellidos} (${u.username})`,
            tipo: 'usuario' as const
        }))
    ];

    const handleChange = (event: any) => {
        const selectedIds = event.target.value;
        
        if (multiple) {
            // Selección múltiple
            const idsArray = typeof selectedIds === 'string' ? [selectedIds] : selectedIds;
            const tiposArray = idsArray.map((id: string) => {
                const opcion = opciones.find(o => o.id === id);
                return opcion ? opcion.tipo : null;
            }).filter((tipo): tipo is 'usuario' | 'trabajador' => tipo !== null);
            
            onChange(idsArray, tiposArray);
        } else {
            // Selección única
            const selectedId = selectedIds;
            if (!selectedId) {
                onChange([], []);
                return;
            }

            const opcion = opciones.find(o => o.id === selectedId);
            if (opcion) {
                onChange([opcion.id], [opcion.tipo]);
            } else {
                onChange([], []);
            }
        }
    };

    return (
        <FormControl fullWidth required={required}>
            <InputLabel id="usuario-trabajador-select-label">
                {userRole === UserRole.TIENDA ? 'Trabajador/Usuario' : 'Usuario'}
            </InputLabel>
            <Select
                labelId="usuario-trabajador-select-label"
                multiple={multiple}
                value={multiple ? (Array.isArray(value) ? value : value ? [value] : []) : (value || '')}
                onChange={handleChange}
                label={userRole === UserRole.TIENDA ? 'Trabajador/Usuario' : 'Usuario'}
                disabled={loading || opciones.length === 0}
                input={multiple ? <OutlinedInput label={userRole === UserRole.TIENDA ? 'Trabajador/Usuario' : 'Usuario'} /> : undefined}
                renderValue={(selected) => {
                    if (multiple) {
                        const selectedArray = selected as string[];
                        if (selectedArray.length === 0) return <em>Seleccionar...</em>;
                        return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selectedArray.map((id) => {
                                    const opcion = opciones.find(o => o.id === id);
                                    return opcion ? (
                                        <Chip key={id} label={opcion.label} size="small" />
                                    ) : null;
                                })}
                            </Box>
                        );
                    } else {
                        const selectedId = selected as string;
                        if (!selectedId) return '';
                        const opcion = opciones.find(o => o.id === selectedId);
                        return opcion ? opcion.label : '';
                    }
                }}
            >
                {trabajadores.length > 0 && (
                    <MenuItem disabled>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Trabajadores
                        </Typography>
                    </MenuItem>
                )}
                {trabajadores.map(trabajador => (
                    <MenuItem key={`trabajador-${trabajador._id}`} value={trabajador._id}>
                        {trabajador.nombre} ({trabajador.identificador})
                    </MenuItem>
                ))}
                {usuarios.length > 0 && trabajadores.length > 0 && (
                    <MenuItem disabled>
                        <Box sx={{ height: 1, borderTop: '1px solid', borderColor: 'divider', my: 0.5 }} />
                    </MenuItem>
                )}
                {usuarios.length > 0 && (
                    <MenuItem disabled>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Usuarios
                        </Typography>
                    </MenuItem>
                )}
                {usuarios.map(usuario => (
                    <MenuItem key={`usuario-${usuario._id}`} value={usuario._id}>
                        {usuario.nombre} {usuario.apellidos} ({usuario.username})
                    </MenuItem>
                ))}
            </Select>
            {error && (
                <Box sx={{ mt: 1, color: 'error.main' }}>
                    {error}
                </Box>
            )}
            {opciones.length === 0 && !loading && !error && (
                <Box sx={{ mt: 1, color: 'warning.main' }}>
                    No hay opciones disponibles
                </Box>
            )}
        </FormControl>
    );
};

