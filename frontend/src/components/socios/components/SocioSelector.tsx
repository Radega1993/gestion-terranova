import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { API_BASE_URL } from '../../../config';
import { useAuthStore } from '../../../stores/authStore';

interface Socio {
    codigo: string;
    nombre: string;
}

interface SocioSelectorProps {
    value: string;
    onChange: (codigo: string) => void;
}

export const SocioSelector: React.FC<SocioSelectorProps> = ({ value, onChange }) => {
    const { token } = useAuthStore();
    const [socios, setSocios] = useState<Socio[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSocios = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE_URL}/socios`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Error al cargar los socios');
                }

                const data = await response.json();
                setSocios(data.map((socio: any) => ({
                    codigo: socio.codigo,
                    nombre: socio.nombre
                })));
            } catch (error) {
                console.error('Error:', error);
                setError(error instanceof Error ? error.message : 'Error al cargar los socios');
            } finally {
                setLoading(false);
            }
        };

        fetchSocios();
    }, [token]);

    const selectedSocio = socios.find(socio => socio.codigo === value);

    return (
        <Autocomplete
            options={socios}
            getOptionLabel={(option) => `${option.nombre} (${option.codigo})`}
            value={selectedSocio || null}
            onChange={(_, newValue) => {
                onChange(newValue?.codigo || '');
            }}
            loading={loading}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Socio"
                    error={!!error}
                    helperText={error}
                />
            )}
            isOptionEqualToValue={(option, value) => option.codigo === value.codigo}
        />
    );
}; 