import React from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Paper,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { Reserva, Servicio, Suplemento, FormData } from './types';

interface ReservaFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => void;
    formData: FormData;
    setFormData: (data: FormData) => void;
    servicios: Servicio[];
    socios: any[];
    suplementosList: Suplemento[];
    selectedReserva: Reserva | null;
}

export const ReservaForm: React.FC<ReservaFormProps> = ({
    open,
    onClose,
    onSubmit,
    formData,
    setFormData,
    servicios,
    socios,
    suplementosList,
    selectedReserva,
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleSuplementoChange = (suplemento: Suplemento, checked: boolean) => {
        if (checked) {
            setFormData({
                ...formData,
                suplementos: [...formData.suplementos, suplemento]
            });
        } else {
            setFormData({
                ...formData,
                suplementos: formData.suplementos.filter(s => s._id !== suplemento._id)
            });
        }
    };

    const handleCantidadChange = (suplemento: Suplemento, cantidad: number) => {
        setFormData({
            ...formData,
            suplementos: formData.suplementos.map(s => {
                if (s._id === suplemento._id) {
                    return { ...s, cantidad };
                }
                return s;
            })
        });
    };

    const calcularPrecioTotal = () => {
        const servicio = servicios.find(s => s.id === formData.servicio);
        let total = servicio?.precio || 0;

        formData.suplementos.forEach(suplemento => {
            if (suplemento.tipo === 'fijo') {
                total += suplemento.precio;
            } else if (suplemento.tipo === 'porHora') {
                total += suplemento.precio * (suplemento.cantidad || 1);
            }
        });

        return total;
    };

    const renderResumenPrecio = () => {
        const servicio = servicios.find(s => s.id === formData.servicio);
        const precioServicio = servicio?.precio || 0;
        const precioSuplementos = calcularPrecioTotal() - precioServicio;

        return (
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <Typography variant="subtitle1" gutterBottom>
                    Resumen del Precio
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                            Servicio: {precioServicio}€
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                            Suplementos: {precioSuplementos}€
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6">
                            Total: {calcularPrecioTotal()}€
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
                {selectedReserva ? 'Editar Reserva' : 'Nueva Reserva'}
            </DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                <DatePicker
                                    label="Fecha"
                                    value={formData.fecha}
                                    onChange={(date) => setFormData({ ...formData, fecha: date || new Date() })}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Servicio</InputLabel>
                                <Select
                                    value={formData.servicio}
                                    onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                                >
                                    {servicios.map((servicio) => (
                                        <MenuItem key={servicio._id} value={servicio.id}>
                                            {servicio.nombre} ({servicio.precio}€)
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Socio</InputLabel>
                                <Select
                                    value={formData.socio}
                                    onChange={(e) => setFormData({ ...formData, socio: e.target.value })}
                                >
                                    {socios.map((socio) => (
                                        <MenuItem key={socio._id} value={socio._id}>
                                            {socio.nombre.nombre} {socio.nombre.primerApellido} {socio.nombre.segundoApellido || ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Suplementos Disponibles
                                </Typography>
                                <Grid container spacing={2}>
                                    {suplementosList.map((suplemento) => (
                                        <Grid item xs={12} key={suplemento._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={formData.suplementos.some(s => s._id === suplemento._id)}
                                                            onChange={(e) => handleSuplementoChange(suplemento, e.target.checked)}
                                                        />
                                                    }
                                                    label={`${suplemento.nombre} (${suplemento.precio}€)`}
                                                />
                                                {suplemento.tipo === 'porHora' && formData.suplementos.some(s => s._id === suplemento._id) && (
                                                    <TextField
                                                        type="number"
                                                        label="Cantidad"
                                                        value={formData.suplementos.find(s => s._id === suplemento._id)?.cantidad || 1}
                                                        onChange={(e) => handleCantidadChange(suplemento, Number(e.target.value))}
                                                        sx={{ width: 100 }}
                                                    />
                                                )}
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Observaciones"
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Monto Abonado"
                                value={formData.montoAbonado}
                                onChange={(e) => setFormData({ ...formData, montoAbonado: Number(e.target.value) })}
                                error={formData.montoAbonado > calcularPrecioTotal()}
                                helperText={
                                    formData.montoAbonado > calcularPrecioTotal()
                                        ? 'El monto abonado no puede ser mayor al total'
                                        : ''
                                }
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Método de Pago</InputLabel>
                                <Select
                                    value={formData.metodoPago}
                                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                                >
                                    <MenuItem value="efectivo">Efectivo</MenuItem>
                                    <MenuItem value="tarjeta">Tarjeta</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            {renderResumenPrecio()}
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={
                        !formData.fecha ||
                        !formData.servicio ||
                        !formData.socio ||
                        !formData.metodoPago ||
                        formData.montoAbonado > calcularPrecioTotal()
                    }
                >
                    {selectedReserva ? 'Actualizar' : 'Crear'} Reserva
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 