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
}

export const UsuarioSelector: React.FC<UsuarioSelectorProps> = ({ onUsuarioSeleccionado, value }) => {
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
                    throw new Error('Error al cargar los usuarios');
                }

                const data = await response.json();
                setUsuarios(data);
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