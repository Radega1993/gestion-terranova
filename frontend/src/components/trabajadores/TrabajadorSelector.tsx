import React, { useState, useEffect } from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Button,
    Chip,
    Typography
} from '@mui/material';
import { trabajadoresService, Trabajador } from '../../services/trabajadores';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '../../types/user';
import { tiendasService } from '../../services/tiendas';

interface TrabajadorSelectorProps {
    value?: string;
    onChange: (trabajadorId: string | null) => void;
    required?: boolean;
    variant?: 'select' | 'buttons';  // select = desplegable, buttons = botones
    tiendaId?: string;  // Si no se proporciona, usa la tienda del usuario TIENDA
}

export const TrabajadorSelector: React.FC<TrabajadorSelectorProps> = ({
    value,
    onChange,
    required = false,
    variant = 'select',
    tiendaId
}) => {
    const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, userRole } = useAuthStore();

    useEffect(() => {
        const loadTrabajadores = async () => {
            try {
                setLoading(true);
                setError(null);

                // Si el usuario es TIENDA y no se proporciona tiendaId, usar el endpoint directo
                if (!tiendaId && userRole === UserRole.TIENDA) {
                    try {
                        const data = await trabajadoresService.getMisTrabajadores();
                        const trabajadoresActivos = data.filter(t => t.activo);
                        setTrabajadores(trabajadoresActivos);
                        setError(null);
                        return;
                    } catch (error: any) {
                        console.error('Error al obtener trabajadores de mi tienda:', error);
                        // Si es un error 401 o 400, puede ser que no tenga tienda asignada
                        if (error?.response?.status === 401 || error?.response?.status === 400) {
                            setError('No tiene una tienda asignada. Contacte al administrador.');
                            setTrabajadores([]);
                            setLoading(false);
                            return;
                        }
                        setError('Error al cargar los trabajadores');
                        setTrabajadores([]);
                        setLoading(false);
                        return;
                    }
                }

                // Si se proporciona tiendaId, obtener trabajadores de esa tienda
                if (tiendaId) {
                    const data = await trabajadoresService.getByTienda(tiendaId);
                    setTrabajadores(data.filter(t => t.activo));
                    setError(null);
                } else {
                    // Si no hay tiendaId y no es TIENDA, no hay trabajadores
                    setTrabajadores([]);
                }
            } catch (error) {
                console.error('Error al cargar trabajadores:', error);
                setError('Error al cargar los trabajadores');
                setTrabajadores([]);
            } finally {
                setLoading(false);
            }
        };

        loadTrabajadores();
    }, [tiendaId, userRole]);

    if (variant === 'buttons') {
        return (
            <Box sx={{ mb: 2 }}>
                {error && (
                    <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                        <Typography variant="body2">{error}</Typography>
                    </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {trabajadores.map(trabajador => (
                        <Button
                            key={trabajador._id}
                            variant={value === trabajador._id ? 'contained' : 'outlined'}
                            onClick={() => onChange(trabajador._id)}
                            size="large"
                            sx={{ minWidth: 120 }}
                        >
                            {trabajador.nombre}
                            <Chip
                                label={trabajador.identificador}
                                size="small"
                                sx={{ ml: 1 }}
                            />
                        </Button>
                    ))}
                    {trabajadores.length === 0 && !loading && !error && (
                        <Chip label="No hay trabajadores disponibles" color="warning" />
                    )}
                </Box>
            </Box>
        );
    }

    return (
        <FormControl fullWidth required={required}>
            <InputLabel id="trabajador-select-label">Trabajador</InputLabel>
            <Select
                labelId="trabajador-select-label"
                value={value || ''}
                onChange={(e) => onChange(e.target.value || null)}
                label="Trabajador"
                disabled={loading || trabajadores.length === 0}
            >
                {trabajadores.map(trabajador => (
                    <MenuItem key={trabajador._id} value={trabajador._id}>
                        {trabajador.nombre} ({trabajador.identificador})
                    </MenuItem>
                ))}
            </Select>
            {error && (
                <Box sx={{ mt: 1, color: 'error.main' }}>
                    {error}
                </Box>
            )}
            {trabajadores.length === 0 && !loading && !error && (
                <Box sx={{ mt: 1, color: 'warning.main' }}>
                    No hay trabajadores disponibles
                </Box>
            )}
        </FormControl>
    );
};

