import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';

interface Usuario {
    _id: string;
    username: string;
    nombre: string;
    apellidos: string;
    role: string;
    activo: boolean;
    lastLogin: string;
}

interface UsuarioSelectorProps {
    onUsuarioSeleccionado: (usuario: Usuario | null) => void;
    value: Usuario | null;
    excluirTienda?: boolean; // Si es true, excluye usuarios con rol TIENDA
}

export const UsuarioSelector: React.FC<UsuarioSelectorProps> = ({ onUsuarioSeleccionado, value, excluirTienda = false }) => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuthStore();

    useEffect(() => {
        const fetchUsuarios = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    // Si es 401 o 403, el usuario no tiene permisos para ver usuarios
                    if (response.status === 401 || response.status === 403) {
                        console.warn('No tiene permisos para ver la lista de usuarios');
                        setUsuarios([]);
                        setError(null); // No mostrar error, simplemente no cargar usuarios
                        return;
                    }
                    throw new Error('Error al cargar los usuarios');
                }

                const data = await response.json();
                // Filtrar usuarios TIENDA solo si se solicita
                const usuariosFiltrados = excluirTienda 
                    ? data.filter((user: Usuario) => user.role !== 'TIENDA')
                    : data;
                setUsuarios(usuariosFiltrados);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Error al cargar los usuarios');
            } finally {
                setLoading(false);
            }
        };

        fetchUsuarios();
    }, [token]);

    return (
        <Autocomplete
            options={usuarios}
            getOptionLabel={(option) => `${option.nombre} ${option.apellidos} (${option.username})`}
            value={value}
            onChange={(_, newValue) => onUsuarioSeleccionado(newValue)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Usuario"
                    error={!!error}
                    helperText={error}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            loading={loading}
            isOptionEqualToValue={(option, value) => option._id === value._id}
        />
    );
}; 