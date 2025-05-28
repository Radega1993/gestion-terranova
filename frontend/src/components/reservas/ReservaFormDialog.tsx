import React from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Paper,
    Typography,
    Grid,
    Checkbox,
    IconButton,
    Autocomplete,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Servicio, Suplemento, Socio, FormData } from './types';

interface ReservaFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => void;
    selectedReserva: any | null;
    servicios: Servicio[];
    socios: Socio[];
    suplementosList: Suplemento[];
    initialDate?: Date;
}

export const ReservaFormDialog: React.FC<ReservaFormDialogProps> = ({
    open,
    onClose,
    onSubmit,
    selectedReserva,
    servicios,
    socios,
    suplementosList,
    initialDate
}) => {
    const [formData, setFormData] = React.useState<FormData>({
        fecha: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        servicio: '',
        socio: '',
        suplementos: [],
        observaciones: '',
        montoAbonado: 0,
        metodoPago: ''
    });

    React.useEffect(() => {
        if (selectedReserva) {
            const servicioSeleccionado = servicios.find(s =>
                s.nombre.toLowerCase() === selectedReserva.tipoInstalacion.toLowerCase()
            );

            setFormData({
                servicio: servicioSeleccionado?.id || '',
                fecha: new Date(selectedReserva.fecha).toISOString().split('T')[0],
                socio: selectedReserva.socio._id,
                suplementos: selectedReserva.suplementos,
                observaciones: selectedReserva.observaciones || '',
                montoAbonado: selectedReserva.montoAbonado || 0,
                metodoPago: selectedReserva.metodoPago || ''
            });
        } else {
            const fechaInicial = initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            setFormData({
                servicio: '',
                fecha: fechaInicial,
                socio: '',
                suplementos: [],
                observaciones: '',
                montoAbonado: 0,
                metodoPago: ''
            });
        }
    }, [selectedReserva, servicios, initialDate]);

    const handleSuplementoChange = (suplementoId: string, checked: boolean, cantidad?: number) => {
        setFormData(prev => {
            const suplemento = suplementosList.find(s => s.id === suplementoId);
            if (!suplemento) return prev;

            const suplementos = [...prev.suplementos];
            const existingIndex = suplementos.findIndex(s => s.id === suplementoId);

            if (checked) {
                if (suplemento.tipo === 'fijo' && existingIndex !== -1) {
                    return prev;
                }
                if (existingIndex === -1) {
                    suplementos.push({
                        id: suplementoId,
                        cantidad: suplemento.tipo === 'porHora' ? (cantidad || 1) : 1
                    });
                }
            } else {
                if (existingIndex !== -1) {
                    suplementos.splice(existingIndex, 1);
                }
            }
            return { ...prev, suplementos };
        });
    };

    const handleCantidadChange = (suplementoId: string, cantidad: number) => {
        setFormData(prev => {
            const suplemento = suplementosList.find(s => s.id === suplementoId);
            if (!suplemento || suplemento.tipo !== 'porHora') return prev;

            const suplementos = prev.suplementos.map(s =>
                s.id === suplementoId ? { ...s, cantidad: Math.max(1, cantidad) } : s
            );
            return { ...prev, suplementos };
        });
    };

    const calcularPrecioTotal = () => {
        let precioTotal = 0;
        const servicio = servicios.find(s => s.id === formData.servicio);
        if (servicio) {
            precioTotal += servicio.precio;
        }

        const suplementosPrecios = new Map();
        formData.suplementos.forEach(sup => {
            const suplemento = suplementosList.find(s => s.id === sup.id);
            if (suplemento) {
                const cantidad = sup.cantidad || 1;
                const precio = suplemento.tipo === 'fijo' ? suplemento.precio : suplemento.precio * cantidad;
                suplementosPrecios.set(sup.id, {
                    nombre: suplemento.nombre,
                    precio: precio,
                    cantidad: cantidad,
                    tipo: suplemento.tipo
                });
            }
        });

        suplementosPrecios.forEach(({ precio }) => {
            precioTotal += precio;
        });

        return precioTotal;
    };

    const renderResumenPrecio = () => {
        const servicio = servicios.find(s => s.id === formData.servicio);
        const suplementosPrecios = new Map();

        formData.suplementos.forEach(sup => {
            const suplemento = suplementosList.find(s => s.id === sup.id);
            if (suplemento) {
                const cantidad = sup.cantidad || 1;
                const precio = suplemento.tipo === 'fijo' ? suplemento.precio : suplemento.precio * cantidad;
                suplementosPrecios.set(sup.id, {
                    nombre: suplemento.nombre,
                    precio: precio,
                    cantidad: cantidad,
                    tipo: suplemento.tipo
                });
            }
        });

        return (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>Resumen del Precio</Typography>
                {servicio && (
                    <Typography sx={{ mb: 1 }}>
                        Servicio: {servicio.precio}€
                    </Typography>
                )}
                {Array.from(suplementosPrecios.values()).map(({ nombre, precio, cantidad, tipo }, index) => (
                    <Typography key={index} sx={{ mb: 1 }}>
                        {nombre}{tipo === 'porHora' && cantidad > 1 ? ` (${cantidad})` : ''}: {precio}€
                    </Typography>
                ))}
                <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
                    Total: {calcularPrecioTotal()}€
                </Typography>
            </Box>
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '80vh',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle sx={{
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                pb: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'primary.main',
                color: 'white'
            }}>
                <Typography variant="h5" component="div">
                    {selectedReserva ? 'Editar Reserva' : 'Nueva Reserva'}
                </Typography>
                <IconButton
                    onClick={onClose}
                    size="large"
                    sx={{ color: 'white' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ mt: 2, p: 3 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    {/* Sección de Información Principal */}
                    <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                            Información Principal
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Fecha"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            fontSize: '1.1rem',
                                            padding: '12px 14px'
                                        },
                                        '& .MuiInputLabel-root': {
                                            fontSize: '1.1rem'
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ fontSize: '1.2rem' }}>Servicio</InputLabel>
                                    <Select
                                        value={formData.servicio}
                                        label="Servicio"
                                        onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                                        sx={{
                                            '& .MuiSelect-select': {
                                                fontSize: '1.2rem',
                                                padding: '11px 14px',
                                                minHeight: '48px',
                                                minWidth: '200px'
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderWidth: '2px'
                                            }
                                        }}
                                    >
                                        {servicios.filter(s => s.activo).map((servicio) => (
                                            <MenuItem key={servicio.id} value={servicio.id} sx={{ fontSize: '1.2rem', py: 1 }}>
                                                {servicio.nombre} - {servicio.precio}€
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <Autocomplete
                                    options={socios.filter(s => s.active)}
                                    getOptionLabel={(option) => `${option.nombre.nombre} ${option.nombre.primerApellido} (${option.socio})`}
                                    value={socios.find(s => s._id === formData.socio) || null}
                                    onChange={(_, newValue) => {
                                        setFormData({ ...formData, socio: newValue?._id || '' });
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Socio"
                                            fullWidth
                                            sx={{
                                                '& .MuiInputBase-root': {
                                                    fontSize: '1.2rem',
                                                    minHeight: '48px'
                                                },
                                                '& .MuiInputLabel-root': {
                                                    fontSize: '1.2rem'
                                                },
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderWidth: '2px'
                                                }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Sección de Suplementos */}
                    <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                            Suplementos Disponibles
                        </Typography>
                        <Grid container spacing={2}>
                            {suplementosList.filter(s => s.activo).map((suplemento) => (
                                <Grid item xs={12} sm={6} md={4} key={suplemento.id}>
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            p: 2,
                                            border: formData.suplementos.some(s => s.id === suplemento.id)
                                                ? '2px solid'
                                                : '1px solid',
                                            borderColor: formData.suplementos.some(s => s.id === suplemento.id)
                                                ? 'primary.main'
                                                : 'divider',
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                                bgcolor: 'action.hover'
                                            }
                                        }}
                                        onClick={() => handleSuplementoChange(suplemento.id, !formData.suplementos.some(s => s.id === suplemento.id))}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <Checkbox
                                                checked={formData.suplementos.some(s => s.id === suplemento.id)}
                                                onChange={(e) => handleSuplementoChange(suplemento.id, e.target.checked)}
                                                sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                                            />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                    {suplemento.nombre}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {suplemento.precio}€ {suplemento.tipo === 'porHora' ? '/hora' : ''}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {suplemento.tipo === 'porHora' && formData.suplementos.some(s => s.id === suplemento.id) && (
                                            <TextField
                                                type="number"
                                                size="small"
                                                label="Cantidad de horas"
                                                value={formData.suplementos.find(s => s.id === suplemento.id)?.cantidad || 1}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleCantidadChange(suplemento.id, parseInt(e.target.value) || 1);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{
                                                    width: '100%',
                                                    mt: 1,
                                                    '& .MuiInputBase-input': {
                                                        fontSize: '1rem',
                                                        padding: '8px 14px'
                                                    }
                                                }}
                                            />
                                        )}
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>

                    {/* Sección de Pago y Observaciones */}
                    <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 3 }}>
                            Pago y Observaciones
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Monto Abonado"
                                    value={formData.montoAbonado}
                                    onChange={(e) => setFormData({ ...formData, montoAbonado: parseFloat(e.target.value) || 0 })}
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem' }}>€</Typography>,
                                    }}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            fontSize: '1.1rem',
                                            padding: '12px 14px'
                                        },
                                        '& .MuiInputLabel-root': {
                                            fontSize: '1.1rem'
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel sx={{ fontSize: '1.2rem' }}>Método de Pago</InputLabel>
                                    <Select
                                        value={formData.metodoPago}
                                        label="Método de Pago"
                                        onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as 'efectivo' | 'tarjeta' | '' })}
                                        sx={{
                                            '& .MuiSelect-select': {
                                                fontSize: '1.2rem',
                                                minHeight: '48px',
                                                minWidth: '200px'
                                            },
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderWidth: '2px'
                                            }
                                        }}
                                    >
                                        <MenuItem value="efectivo" sx={{ fontSize: '1.2rem', py: 1 }}>Efectivo</MenuItem>
                                        <MenuItem value="tarjeta" sx={{ fontSize: '1.2rem', py: 1 }}>Tarjeta</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Observaciones"
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    sx={{
                                        '& .MuiInputBase-input': {
                                            fontSize: '1.1rem',
                                            padding: '12px 14px'
                                        },
                                        '& .MuiInputLabel-root': {
                                            fontSize: '1.1rem'
                                        }
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Resumen de Precio */}
                    {renderResumenPrecio()}

                    {/* Botones de Acción */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                        pt: 3
                    }}>
                        <Button
                            onClick={onClose}
                            variant="outlined"
                            sx={{
                                fontSize: '1.1rem',
                                px: 3,
                                py: 1
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{
                                fontSize: '1.1rem',
                                px: 3,
                                py: 1
                            }}
                        >
                            {selectedReserva ? 'Guardar Cambios' : 'Crear Reserva'}
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}; 