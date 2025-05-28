import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Stepper,
    Step,
    StepLabel,
    IconButton,
    Typography,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useReservas } from '../hooks/useReservas';
import { useServicios } from '../hooks/useServicios';
import { useSuplementos } from '../hooks/useSuplementos';
import { useSocios } from '../hooks/useSocios';
import { Reserva, Servicio, Suplemento, Socio } from '../types';
import { ReservaFormBasicInfo } from './ReservaFormBasicInfo';
import { ReservaFormSuplementos } from './ReservaFormSuplementos';
import { ReservaFormPayment } from './ReservaFormPayment';
import { ReservaFormSummary } from './ReservaFormSummary';

interface ReservaFormDialogProps {
    open: boolean;
    onClose: () => void;
    reserva?: Reserva;
    selectedDate: Date;
}

const steps = ['Información Básica', 'Suplementos', 'Pago'];

export const ReservaFormDialog: React.FC<ReservaFormDialogProps> = ({
    open,
    onClose,
    reserva,
    selectedDate,
}) => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        fecha: selectedDate,
        servicioId: '',
        socioId: '',
        montoAbonado: 0,
        metodoPago: 'efectivo',
        observaciones: '',
    });
    const [selectedSuplementos, setSelectedSuplementos] = useState<{ id: string; cantidad?: number }[]>([]);

    const { reservaMutation, updateMutation } = useReservas();
    const { servicios } = useServicios();
    const { suplementos } = useSuplementos();
    const { socios } = useSocios();

    useEffect(() => {
        if (reserva) {
            setFormData({
                fecha: new Date(reserva.fecha),
                servicioId: reserva.servicio.id,
                socioId: reserva.socio.id,
                montoAbonado: reserva.montoAbonado,
                metodoPago: reserva.metodoPago,
                observaciones: reserva.observaciones || '',
            });
            setSelectedSuplementos(reserva.suplementos.map(s => ({
                id: s.id,
                cantidad: s.cantidad
            })));
        }
    }, [reserva]);

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmit = () => {
        const selectedServicio = servicios.find(s => s.id === formData.servicioId);
        if (!selectedServicio) return;

        const suplementosPrecios = new Map();
        selectedSuplementos.forEach(sup => {
            const suplemento = suplementos.find(s => s.id === sup.id);
            if (suplemento) {
                const cantidad = sup.cantidad || 1;
                const precio = suplemento.tipo === 'fijo' ? suplemento.precio : suplemento.precio * cantidad;
                suplementosPrecios.set(sup.id, precio);
            }
        });

        const precioTotal = selectedServicio.precio + Array.from(suplementosPrecios.values()).reduce((a, b) => a + b, 0);

        const reservaData = {
            ...formData,
            suplementos: selectedSuplementos,
            precioTotal,
        };

        if (reserva) {
            updateMutation.mutate({ id: reserva.id, ...reservaData });
        } else {
            reservaMutation.mutate(reservaData);
        }
        onClose();
    };

    const handleFormDataChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSuplementoChange = (suplementoId: string, checked: boolean) => {
        setSelectedSuplementos(prev => {
            if (checked) {
                return [...prev, { id: suplementoId }];
            }
            return prev.filter(s => s.id !== suplementoId);
        });
    };

    const handleCantidadChange = (suplementoId: string, cantidad: number) => {
        setSelectedSuplementos(prev =>
            prev.map(s => s.id === suplementoId ? { ...s, cantidad } : s)
        );
    };

    const selectedServicio = servicios.find(s => s.id === formData.servicioId);
    const suplementosPrecios = new Map();
    selectedSuplementos.forEach(sup => {
        const suplemento = suplementos.find(s => s.id === sup.id);
        if (suplemento) {
            const cantidad = sup.cantidad || 1;
            const precio = suplemento.tipo === 'fijo' ? suplemento.precio : suplemento.precio * cantidad;
            suplementosPrecios.set(sup.id, precio);
        }
    });
    const precioTotal = (selectedServicio?.precio || 0) +
        Array.from(suplementosPrecios.values()).reduce((a, b) => a + b, 0);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    minHeight: '80vh',
                    maxHeight: '90vh',
                }
            }}
        >
            <DialogTitle sx={{
                m: 0,
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Typography variant="h6" component="div">
                    {reserva ? 'Editar Reserva' : 'Nueva Reserva'}
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ mt: 2 }}>
                    {activeStep === 0 && (
                        <ReservaFormBasicInfo
                            formData={formData}
                            servicios={servicios}
                            socios={socios}
                            onFormDataChange={handleFormDataChange}
                        />
                    )}

                    {activeStep === 1 && (
                        <ReservaFormSuplementos
                            suplementosList={suplementos}
                            selectedSuplementos={selectedSuplementos}
                            onSuplementoChange={handleSuplementoChange}
                            onCantidadChange={handleCantidadChange}
                        />
                    )}

                    {activeStep === 2 && (
                        <>
                            <ReservaFormPayment
                                formData={formData}
                                onFormDataChange={handleFormDataChange}
                            />
                            <ReservaFormSummary
                                servicio={selectedServicio}
                                suplementos={selectedSuplementos}
                                suplementosList={suplementos}
                                precioTotal={precioTotal}
                            />
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                    onClick={onClose}
                    sx={{ mr: 1 }}
                >
                    Cancelar
                </Button>
                {activeStep > 0 && (
                    <Button
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                    >
                        Atrás
                    </Button>
                )}
                {activeStep < steps.length - 1 ? (
                    <Button
                        onClick={handleNext}
                        variant="contained"
                        disabled={!formData.servicioId || !formData.socioId}
                    >
                        Siguiente
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={!formData.servicioId || !formData.socioId}
                    >
                        {reserva ? 'Actualizar' : 'Crear'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}; 