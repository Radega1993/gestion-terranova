import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    IconButton,
    Grid,
    FormControlLabel,
    Checkbox,
    Chip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Reserva, Servicio, Suplemento, LiquidacionData } from './types';

interface LiquidacionDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    liquidacionData: LiquidacionData;
    setLiquidacionData: (data: LiquidacionData) => void;
    selectedReservaLiquidacion: Reserva | null;
    servicios: Servicio[];
    suplementosList: Suplemento[];
}

export const LiquidacionDialog: React.FC<LiquidacionDialogProps> = ({
    open,
    onClose,
    onSubmit,
    liquidacionData,
    setLiquidacionData,
    selectedReservaLiquidacion,
    servicios,
    suplementosList
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReservaLiquidacion) return;

        const precioTotal = selectedReservaLiquidacion.precio;
        const montoPendiente = precioTotal - (selectedReservaLiquidacion.montoAbonado || 0);

        if (liquidacionData.montoAbonado !== montoPendiente) {
            alert(`Debe abonar el monto total pendiente (${montoPendiente.toFixed(2)}€)`);
            return;
        }

        if (!liquidacionData.metodoPago) {
            alert('Debe seleccionar un método de pago');
            return;
        }

        const datosLiquidacion = {
            suplementos: liquidacionData.suplementos,
            pagos: [
                {
                    monto: selectedReservaLiquidacion.montoAbonado || 0,
                    metodoPago: selectedReservaLiquidacion.metodoPago || '',
                    fecha: selectedReservaLiquidacion.fecha
                },
                {
                    monto: liquidacionData.montoAbonado,
                    metodoPago: liquidacionData.metodoPago,
                    fecha: new Date().toISOString()
                }
            ],
            observaciones: liquidacionData.observaciones,
            estado: 'COMPLETADA'
        };

        onSubmit(datosLiquidacion);
    };

    const handleSuplementoChange = (suplementoId: string, checked: boolean, cantidad?: number) => {
        setLiquidacionData((prev: LiquidacionData) => {
            const suplemento = suplementosList.find(s => s.id === suplementoId);
            if (!suplemento) return prev;

            const suplementos = [...prev.suplementos];
            const existingIndex = suplementos.findIndex(s => s.id === suplementoId);

            if (checked) {
                if (existingIndex === -1) {
                    suplementos.push({
                        id: suplementoId,
                        cantidad: cantidad || 1
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
        setLiquidacionData((prev: LiquidacionData) => {
            const suplemento = suplementosList.find(s => s.id === suplementoId);
            if (!suplemento) return prev;

            const suplementos = prev.suplementos.map(s =>
                s.id === suplementoId ? { ...s, cantidad: Math.max(1, cantidad) } : s
            );
            return { ...prev, suplementos };
        });
    };

    const calcularPrecioTotal = () => {
        if (!selectedReservaLiquidacion) return 0;
        return selectedReservaLiquidacion.precio;
    };

    const renderResumenPrecio = () => {
        if (!selectedReservaLiquidacion) return null;

        const servicio = servicios.find(s => s.nombre.toLowerCase() === selectedReservaLiquidacion.tipoInstalacion.toLowerCase());
        const suplementosPrecios = new Map();

        selectedReservaLiquidacion.suplementos.forEach(sup => {
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

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
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
                    Liquidar Reserva
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
                {selectedReservaLiquidacion && (
                    <Box component="form" onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Información de la Reserva
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1">
                                        Socio: {selectedReservaLiquidacion.socio.nombre.nombre} {selectedReservaLiquidacion.socio.nombre.primerApellido}
                                    </Typography>
                                    <Typography variant="subtitle1">
                                        Servicio: {selectedReservaLiquidacion.tipoInstalacion}
                                    </Typography>
                                    <Typography variant="subtitle1">
                                        Fecha: {new Date(selectedReservaLiquidacion.fecha).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Información de Pago
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Monto Abonado"
                                            value={liquidacionData.montoAbonado}
                                            onChange={(e) => setLiquidacionData({
                                                ...liquidacionData,
                                                montoAbonado: parseFloat(e.target.value) || 0
                                            })}
                                            InputProps={{
                                                startAdornment: '€'
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Método de Pago</InputLabel>
                                            <Select
                                                value={liquidacionData.metodoPago}
                                                label="Método de Pago"
                                                onChange={(e) => setLiquidacionData({
                                                    ...liquidacionData,
                                                    metodoPago: e.target.value as 'efectivo' | 'tarjeta' | ''
                                                })}
                                            >
                                                <MenuItem value="efectivo">Efectivo</MenuItem>
                                                <MenuItem value="tarjeta">Tarjeta</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Suplementos
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {suplementosList.filter(s => s.activo).map((suplemento) => {
                                        const isSelected = liquidacionData.suplementos.some(s => s.id === suplemento.id);
                                        const selectedSuplemento = liquidacionData.suplementos.find(s => s.id === suplemento.id);
                                        return (
                                            <Box key={suplemento.id} sx={{ mb: 2 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={(e) => handleSuplementoChange(suplemento.id, e.target.checked)}
                                                        />
                                                    }
                                                    label={suplemento.nombre}
                                                />
                                                {isSelected && (
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={selectedSuplemento?.cantidad || 1}
                                                        onChange={(e) => handleCantidadChange(suplemento.id, parseInt(e.target.value) || 1)}
                                                        sx={{ ml: 2, width: 80 }}
                                                        InputProps={{
                                                            inputProps: { min: 1 }
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Observaciones"
                                    value={liquidacionData.observaciones}
                                    onChange={(e) => setLiquidacionData({
                                        ...liquidacionData,
                                        observaciones: e.target.value
                                    })}
                                />
                            </Grid>

                            {renderResumenPrecio()}
                        </Grid>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
                <Button onClick={onClose} color="inherit">
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                >
                    Liquidar
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 