import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Paper,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Switch,
    Divider,
    Autocomplete,
    Grid,
    Chip,
    TableCell,
    Snackbar,
    Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Settings as SettingsIcon, Cancel as CancelIcon, Close as CloseIcon, Print as PrintIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { styled } from '@mui/material/styles';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { API_BASE_URL } from '../../config';
import Swal from 'sweetalert2';
import { ReservaPDF } from './ReservaPDF';
import { LiquidacionPDF } from './LiquidacionPDF';
import { GestionServicios } from './GestionServicios';
import { GestionSuplementos } from './GestionSuplementos';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReservas } from './hooks/useReservas';
import { useServicios } from './hooks/useServicios';
import { useSuplementos } from './hooks/useSuplementos';
import { useSocios } from './hooks/useSocios';
import { useLiquidacion } from './hooks/useLiquidacion';
import { LiquidacionDialog } from './LiquidacionDialog';
import { CancelacionDialog } from './CancelacionDialog';
import { TrabajadorSelector } from '../trabajadores/TrabajadorSelector';
import { UserRole } from '../../types/user';

interface Servicio {
    id: string;
    nombre: string;
    precio: number;
    color: string;
    colorConObservaciones: string;
    activo: boolean;
}

interface Suplemento {
    _id?: string;
    id: string;
    nombre: string;
    precio: number;
    tipo: 'fijo' | 'porHora';
    activo: boolean;
}

interface Socio {
    _id: string;
    socio: string;
    nombre: {
        nombre: string;
        primerApellido: string;
        segundoApellido?: string;
    };
    contacto: {
        telefonos: string[];
        emails: string[];
    };
    active: boolean;
}

interface Reserva {
    _id: string;
    fecha: string;
    tipoInstalacion: string;
    socio: {
        _id: string;
        nombre: {
            nombre: string;
            primerApellido: string;
            segundoApellido?: string;
        };
    };
    usuarioCreacion: {
        _id: string;
        username: string;
    };
    suplementos: {
        id: string;
        cantidad?: number;
        precio?: number;
    }[];
    precio: number;
    estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'LISTA_ESPERA';
    confirmadoPor?: {
        _id: string;
        username: string;
    };
    fechaConfirmacion?: string;
    motivoCancelacion?: string;
    observaciones?: string;
    montoAbonado?: number;
    metodoPago?: 'efectivo' | 'tarjeta' | '';
}

interface FormData {
    fecha: string;
    servicio: string;
    socio: string;
    suplementos: { id: string; cantidad?: number }[];
    observaciones: string;
    montoAbonado: number;
    metodoPago: 'efectivo' | 'tarjeta' | '';
}

interface LiquidacionData {
    suplementos: { id: string; cantidad?: number }[];
    montoAbonado: number;
    metodoPago: 'efectivo' | 'tarjeta' | '';
    observaciones: string;
}

interface CancelacionData {
    motivo: 'CLIMA' | 'ANTICIPADA' | 'OTRO';
    observaciones?: string;
    montoDevuelto?: number;
    pendienteRevisionJunta?: boolean;
}

const StyledCalendar = styled(DateCalendar)(({ theme }) => ({
    '& .MuiPickersDay-root.Mui-selected': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
        },
    },
}));

const ReservaIndicator = styled(Box)(({ color }: { color: string }) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    margin: '0 2px',
}));

interface ReservasListProps {
    // ... existing code ...
}

export const ReservasList: React.FC<ReservasListProps> = () => {
    const { user, token } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Custom hooks
    const {
        reservas,
        isLoadingReservas,
        selectedReserva,
        setSelectedReserva,
        reservaMutation,
        deleteMutation,
        liquidarMutation,
        cancelarMutation
    } = useReservas();

    const {
        servicios,
        isLoadingServicios,
        saveServiciosMutation,
        deleteServicioMutation,
        updateServicios
    } = useServicios();

    const {
        suplementos: suplementosList,
        isLoadingSuplementos,
        saveSuplementosMutation,
        deleteSuplementoMutation
    } = useSuplementos();

    const {
        socios,
        isLoadingSocios,
        buscarSocio
    } = useSocios();

    const {
        pdfUrl,
        generarPdfMutation,
        limpiarPdf
    } = useLiquidacion();

    const [openDialog, setOpenDialog] = useState(false);
    const [openServiciosDialog, setOpenServiciosDialog] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [reservaExistente, setReservaExistente] = useState(false); // Estado para controlar si hay conflicto
    const [formData, setFormData] = useState<FormData>({
        fecha: new Date().toISOString().split('T')[0],
        servicio: '',
        socio: '',
        suplementos: [],
        observaciones: '',
        montoAbonado: 0,
        metodoPago: '',
        trabajadorId: undefined,
        normativaAceptada: false,
        firmaSocio: undefined
    });
    const [searchSocio, setSearchSocio] = useState('');
    const [filteredSocios, setFilteredSocios] = useState<Socio[]>([]);
    const [openLiquidacionDialog, setOpenLiquidacionDialog] = useState(false);
    const [selectedReservaLiquidacion, setSelectedReservaLiquidacion] = useState<Reserva | null>(null);
    const [liquidacionData, setLiquidacionData] = useState<LiquidacionData>({
        suplementos: [],
        montoAbonado: 0,
        metodoPago: '',
        observaciones: ''
    });
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [selectedReservaForCancel, setSelectedReservaForCancel] = useState<Reserva | null>(null);
    const [cancelacionData, setCancelacionData] = useState<CancelacionData>({
        motivo: 'OTRO',
        observaciones: '',
        montoDevuelto: 0
    });
    const [showReservaPDF, setShowReservaPDF] = useState(false);
    const [showLiquidacionPDF, setShowLiquidacionPDF] = useState(false);
    const [selectedReservaForPDF, setSelectedReservaForPDF] = useState<any>(null);
    const [selectedLiquidacionData, setSelectedLiquidacionData] = useState<any>(null);
    const [openGestionServicios, setOpenGestionServicios] = useState(false);
    const [openGestionSuplementos, setOpenGestionSuplementos] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [openPDF, setOpenPDF] = useState(false);

    // Detectar conflictos de reserva cuando cambian la fecha o el servicio
    useEffect(() => {
        if (!openDialog || !formData.fecha || !formData.servicio || selectedReserva) {
            // Si el diálogo está cerrado, no hay fecha/servicio seleccionado, o estamos editando, no verificar
            setReservaExistente(false);
            return;
        }

        const servicioSeleccionado = servicios.find(s => s.id === formData.servicio);
        if (!servicioSeleccionado) {
            setReservaExistente(false);
            return;
        }

        const fecha = new Date(formData.fecha);
        if (isNaN(fecha.getTime())) {
            setReservaExistente(false);
            return;
        }

        // Verificar si ya existe una reserva para el mismo servicio y fecha
        const reservaExistenteEncontrada = reservas.find(r =>
            r.tipoInstalacion.toLowerCase() === servicioSeleccionado.nombre.toLowerCase() &&
            isSameDay(new Date(r.fecha), fecha) &&
            r.estado !== 'CANCELADA'
        );

        if (reservaExistenteEncontrada) {
            setReservaExistente(true);
            // Limpiar los campos de pago automáticamente
            setFormData(prev => ({ ...prev, montoAbonado: 0, metodoPago: '' }));
        } else {
            setReservaExistente(false);
        }
    }, [formData.fecha, formData.servicio, openDialog, reservas, servicios, selectedReserva]);

    const handleOpenDialog = (reserva?: Reserva) => {
        if (reserva) {
            setSelectedReserva(reserva);
            // Buscar el servicio correspondiente en la lista de servicios del backend
            const servicioSeleccionado = servicios.find(s =>
                s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase()
            );

            // Calcular el precio total de la reserva original
            const precioOriginal = reserva.precio;
            const montoYaAbonado = reserva.montoAbonado || 0;
            
            setFormData({
                servicio: servicioSeleccionado?.id || '',
                fecha: new Date(reserva.fecha).toISOString().split('T')[0],
                socio: reserva.socio._id,
                suplementos: reserva.suplementos,
                observaciones: reserva.observaciones || '',
                montoAbonado: 0, // En edición, empezamos en 0 para añadir solo el pendiente
                metodoPago: reserva.metodoPago || '',
                trabajadorId: undefined, // No se edita el trabajador en edición
                montoYaAbonado: montoYaAbonado, // Guardar el monto ya pagado
                precioOriginal: precioOriginal // Guardar el precio original
            });
        } else {
            setSelectedReserva(null);
            const fechaInicial = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            setFormData({
                servicio: '',
                fecha: fechaInicial,
                socio: '',
                suplementos: [],
                observaciones: '',
                montoAbonado: 0,
                metodoPago: '',
                trabajadorId: undefined
            });
            setReservaExistente(false);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedReserva(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            setSnackbar({
                open: true,
                message: 'Debes iniciar sesión para crear una reserva',
                severity: 'error'
            });
            return;
        }

        try {
            const servicioSeleccionado = servicios.find(s => s.id === formData.servicio);
            if (!servicioSeleccionado) {
                setSnackbar({
                    open: true,
                    message: 'Por favor, selecciona un servicio válido',
                    severity: 'error'
                });
                return;
            }

            const fecha = new Date(formData.fecha);
            if (isNaN(fecha.getTime())) {
                setSnackbar({
                    open: true,
                    message: 'Por favor, selecciona una fecha válida',
                    severity: 'error'
                });
                return;
            }

            // Verificar si ya existe una reserva para el mismo servicio y fecha
            const reservaExistenteEncontrada = reservas.find(r =>
                r.tipoInstalacion.toLowerCase() === servicioSeleccionado.nombre.toLowerCase() &&
                isSameDay(new Date(r.fecha), fecha) &&
                r.estado !== 'CANCELADA'
            );

            if (reservaExistenteEncontrada) {
                const result = await Swal.fire({
                    title: 'Reserva existente',
                    text: 'Ya existe una reserva para este servicio en esta fecha. ¿Deseas añadir esta reserva a la lista de espera?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Sí, añadir a lista de espera',
                    cancelButtonText: 'No, cancelar'
                });

                if (!result.isConfirmed) {
                    return;
                }
                
                // Si confirma, establecer el estado y limpiar el pago
                setReservaExistente(true);
                setFormData(prev => ({ ...prev, montoAbonado: 0, metodoPago: '' }));
            } else {
                setReservaExistente(false);
            }

            const suplementosUnicos = formData.suplementos.reduce((acc: any[], current) => {
                const existingIndex = acc.findIndex(item => item.id === current.id);
                const suplementoInfo = suplementosList.find(s => s.id === current.id);

                if (!suplementoInfo) {
                    console.warn(`Suplemento no encontrado: ${current.id}`);
                    return acc;
                }

                if (existingIndex === -1) {
                    acc.push({
                        id: current.id,
                        nombre: suplementoInfo.nombre,
                        precio: suplementoInfo.precio,
                        cantidad: current.cantidad || 1,
                        tipo: suplementoInfo.tipo
                    });
                } else {
                    acc[existingIndex].cantidad = (acc[existingIndex].cantidad || 1) + (current.cantidad || 1);
                }
                return acc;
            }, []);

            // Validar trabajador si el usuario es TIENDA
            if (user.role === UserRole.TIENDA && !formData.trabajadorId) {
                setSnackbar({
                    open: true,
                    message: 'Debe seleccionar un trabajador para realizar la reserva',
                    severity: 'error'
                });
                return;
            }

            // Si estamos editando y hay monto ya abonado, sumar el adicional
            // PERO: Si está en lista de espera, no permitir pago
            const montoTotalAbonado = reservaExistente ? 0 : Number((selectedReserva && formData.montoYaAbonado !== undefined
                ? formData.montoYaAbonado + (formData.montoAbonado || 0)
                : formData.montoAbonado || 0).toFixed(2));

            const precioTotal = calcularPrecioTotal();

            const reservaData: any = {
                fecha: fecha.toISOString(),
                tipoInstalacion: servicioSeleccionado.nombre.toUpperCase(),
                socio: formData.socio,
                usuarioCreacion: user._id,
                suplementos: suplementosUnicos,
                precio: precioTotal,
                observaciones: formData.observaciones,
                // Si está en lista de espera, no enviar montoAbonado ni metodoPago
                montoAbonado: reservaExistente ? 0 : montoTotalAbonado,
                metodoPago: reservaExistente ? undefined : (formData.metodoPago || ''),
                // Solo enviar estado si es LISTA_ESPERA (reserva existente), dejar que el backend determine el estado basado en el pago
                estado: reservaExistente ? 'LISTA_ESPERA' : undefined,
                normativaAceptada: formData.normativaAceptada || false,
                firmaSocio: formData.firmaSocio,
                fechaAceptacionNormativa: formData.normativaAceptada ? new Date() : undefined
            };

            // Añadir trabajadorId si el usuario es TIENDA (obligatorio)
            if (user.role === UserRole.TIENDA && formData.trabajadorId) {
                reservaData.trabajadorId = formData.trabajadorId;
            }

            await reservaMutation.mutateAsync(reservaData);

            // Mostrar confirmación y cerrar el modal
            await Swal.fire({
                title: '¡Reserva creada!',
                text: reservaExistente ? 'La reserva ha sido añadida a la lista de espera.' : 'La reserva ha sido creada correctamente.',
                icon: 'success',
                confirmButtonColor: '#3085d6'
            });

            handleCloseDialog();
        } catch (error: any) {
            console.error('Error preparing reserva data:', error);
            let errorMessage = 'Ha ocurrido un error al crear la reserva';

            // Intentar obtener el mensaje de error del backend
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setSnackbar({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        }
    };

    const handleExportReservas = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/reservas/export`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error al exportar reservas');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reservas_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setSnackbar({
                open: true,
                message: 'Reservas exportadas correctamente',
                severity: 'success'
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: err instanceof Error ? err.message : 'Error al exportar reservas',
                severity: 'error'
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
            return;
        }
        deleteMutation.mutate(id);
    };

    const handleSuplementoChange = (suplementoId: string, checked: boolean, cantidad?: number) => {
        setFormData(prev => {
            const suplemento = suplementosList.find(s => s.id === suplementoId);
            if (!suplemento) return prev;

            const suplementos = [...prev.suplementos];
            const existingIndex = suplementos.findIndex(s => s.id === suplementoId);

            if (checked) {
                // Si es un suplemento fijo y ya existe, no lo añadimos
                if (suplemento.tipo === 'fijo' && existingIndex !== -1) {
                    return prev;
                }
                // Si no existe, lo añadimos
                if (existingIndex === -1) {
                    suplementos.push({
                        id: suplementoId,
                        cantidad: suplemento.tipo === 'porHora' ? (cantidad || 1) : 1
                    });
                }
            } else {
                // Si existe, lo eliminamos
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
            precioTotal += Number(servicio.precio);
        }

        // Calcular precio de suplementos sin duplicados
        const suplementosPrecios = new Map();
        formData.suplementos.forEach(sup => {
            const suplemento = suplementosList.find(s => s.id === sup.id);
            if (suplemento) {
                const cantidad = sup.cantidad || 1;
                const precio = suplemento.tipo === 'fijo'
                    ? Number(suplemento.precio)
                    : Number(suplemento.precio) * cantidad;
                suplementosPrecios.set(sup.id, {
                    nombre: suplemento.nombre,
                    precio: Number(precio.toFixed(2)),
                    cantidad: cantidad,
                    tipo: suplemento.tipo
                });
            }
        });

        // Sumar los precios únicos
        suplementosPrecios.forEach(({ precio }) => {
            precioTotal += Number(precio);
        });

        return Number(precioTotal.toFixed(2));
    };

    const getReservasForDate = (date: Date) => {
        const reservasDelDia = reservas.filter(reserva => {
            const reservaDate = new Date(reserva.fecha);
            const esMismoDia = isSameDay(reservaDate, date);

            return esMismoDia;
        });
        return reservasDelDia;
    };

    const getReservaColor = (reserva: Reserva) => {
        // Si la reserva está cancelada
        if (reserva.estado === 'CANCELADA') {
            return '#9e9e9e'; // Gris para canceladas
        }

        // Si la reserva está completada y pagada
        const montoAbonadoRedondeado = Number((reserva.montoAbonado || 0).toFixed(2));
        const precioRedondeado = Number(reserva.precio.toFixed(2));
        if (reserva.estado === 'COMPLETADA' && Math.abs(montoAbonadoRedondeado - precioRedondeado) < 0.01) {
            return '#2e7d32'; // Verde oscuro
        }

        // Si está en lista de espera
        if (reserva.estado === 'LISTA_ESPERA') {
            return '#ff9800'; // Naranja
        }

        // Si tiene observaciones
        if (reserva.observaciones) {
            const servicio = servicios.find(s => s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase());
            return servicio?.colorConObservaciones || '#f57c00'; // Color del servicio con observaciones
        }

        // Color por defecto según el tipo de instalación
        const servicio = servicios.find(s => s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase());
        return servicio?.color || '#757575'; // Color del servicio o gris por defecto
    };

    const renderDayContent = (day: Date) => {
        const reservasDelDia = getReservasForDate(day);

        if (reservasDelDia.length === 0) return null;

        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                {reservasDelDia.map((reserva) => (
                    <ReservaIndicator
                        key={reserva._id}
                        color={getReservaColor(reserva)}
                        title={`${reserva.tipoInstalacion}: ${reserva.socio ? `${reserva.socio.nombre.nombre} ${reserva.socio.nombre.primerApellido}` : 'Socio no disponible'} - ${reserva.estado}`}
                    />
                ))}
            </Box>
        );
    };

    const handleOpenLiquidacionDialog = (reserva: Reserva) => {
        if (!reserva) return;
        setSelectedReservaLiquidacion(reserva);
        setLiquidacionData({
            suplementos: reserva.suplementos,
            montoAbonado: 0,
            metodoPago: '',
            observaciones: ''
        });
        setOpenLiquidacionDialog(true);
    };

    const handleCloseLiquidacionDialog = () => {
        setOpenLiquidacionDialog(false);
        setSelectedReservaLiquidacion(null);
    };

    const calcularPrecioTotalLiquidacion = () => {
        if (!selectedReservaLiquidacion) return 0;
        return selectedReservaLiquidacion.precio;
    };

    const handleLiquidacionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReservaLiquidacion) return;

        try {
            const precioTotal = Number(selectedReservaLiquidacion.precio.toFixed(2));
            const montoYaAbonado = Number((selectedReservaLiquidacion.montoAbonado || 0).toFixed(2));
            const montoPendiente = Number((precioTotal - montoYaAbonado).toFixed(2));
            const montoAbonadoRedondeado = Number(liquidacionData.montoAbonado.toFixed(2));

            if (Math.abs(montoAbonadoRedondeado - montoPendiente) > 0.01) {
                setSnackbar({
                    open: true,
                    message: `Debe abonar el monto total pendiente (${montoPendiente.toFixed(2)}€)`,
                    severity: 'error'
                });
                return;
            }

            if (!liquidacionData.metodoPago) {
                setSnackbar({
                    open: true,
                    message: 'Debe seleccionar un método de pago',
                    severity: 'error'
                });
                return;
            }

            const datosLiquidacion = {
                suplementos: liquidacionData.suplementos,
                pagos: [
                    {
                        monto: Number((selectedReservaLiquidacion.montoAbonado || 0).toFixed(2)),
                        metodoPago: selectedReservaLiquidacion.metodoPago || '',
                        fecha: selectedReservaLiquidacion.fecha
                    },
                    {
                        monto: Number(liquidacionData.montoAbonado.toFixed(2)),
                        metodoPago: liquidacionData.metodoPago,
                        fecha: new Date().toISOString()
                    }
                ],
                observaciones: liquidacionData.observaciones,
                estado: 'COMPLETADA'
            };

            liquidarMutation.mutate(datosLiquidacion);
        } catch (error) {
            console.error('Error preparing liquidacion data:', error);
            setSnackbar({
                open: true,
                message: 'Error al preparar los datos de liquidación',
                severity: 'error'
            });
        }
    };

    const handleCancelClick = (reserva: Reserva) => {
        setSelectedReservaForCancel(reserva);
        setCancelacionData({
            motivo: 'OTRO',
            observaciones: '',
            montoDevuelto: 0,
            pendienteRevisionJunta: false
        });
        setOpenCancelDialog(true);
    };

    const handleCancelSubmit = async () => {
        if (!selectedReservaForCancel) return;

        try {
            if (cancelacionData.motivo === 'CLIMA') {
                const fechaReserva = new Date(selectedReservaForCancel.fecha);
                const fechaActual = new Date();
                if (!isSameDay(fechaReserva, fechaActual)) {
                    setSnackbar({
                        open: true,
                        message: 'Solo se puede cancelar por condiciones climáticas el mismo día de la reserva',
                        severity: 'error'
                    });
                    return;
                }
            } else if (cancelacionData.motivo === 'ANTICIPADA') {
                const fechaReserva = new Date(selectedReservaForCancel.fecha);
                const fechaActual = new Date();
                const diasDiferencia = Math.ceil((fechaReserva.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));

                if (diasDiferencia < 9) {
                    if (!cancelacionData.observaciones) {
                        setSnackbar({
                            open: true,
                            message: 'Debe especificar el motivo de la cancelación para que la Junta pueda valorar la devolución',
                            severity: 'error'
                        });
                        return;
                    }

                    const result = await Swal.fire({
                        title: 'Cancelación con menos de 9 días',
                        text: 'Se puede anular, pero para devolución de dinero se valorará con Junta una vez conocidos los motivos. ¿Quieres seguir adelante?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'Sí, continuar',
                        cancelButtonText: 'No, volver'
                    });

                    if (!result.isConfirmed) {
                        return;
                    }

                    setCancelacionData(prev => ({
                        ...prev,
                        montoDevuelto: 0,
                        observaciones: `[PENDIENTE REVISIÓN JUNTA] ${prev.observaciones}`,
                        pendienteRevisionJunta: true
                    }));
                } else {
                    if ((selectedReservaForCancel.montoAbonado || 0) > 0) {
                        if (!cancelacionData.montoDevuelto) {
                            setSnackbar({
                                open: true,
                                message: 'Debe especificar el monto a devolver',
                                severity: 'error'
                            });
                            return;
                        }

                        if (cancelacionData.montoDevuelto > (selectedReservaForCancel.montoAbonado || 0)) {
                            setSnackbar({
                                open: true,
                                message: 'El monto a devolver no puede ser mayor al monto abonado',
                                severity: 'error'
                            });
                            return;
                        }

                        const result = await Swal.fire({
                            title: 'Cancelación con más de 9 días',
                            text: `Se devolverá el dinero de la fianza (${cancelacionData.montoDevuelto}€). ¿Quieres continuar con la cancelación?`,
                            icon: 'info',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Sí, continuar',
                            cancelButtonText: 'No, volver'
                        });

                        if (!result.isConfirmed) {
                            return;
                        }
                    }
                }
            }

            const result = await Swal.fire({
                title: '¿Estás seguro?',
                text: 'Esta acción no se puede deshacer',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, cancelar reserva',
                cancelButtonText: 'No, volver'
            });

            if (result.isConfirmed) {
                // Calcular automáticamente el importe pendiente si no se especificó montoDevuelto
                const montoAbonado = selectedReservaForCancel.montoAbonado || 0;
                const importePendiente = selectedReservaForCancel.precio - montoAbonado;
                
                const datosCancelacion = {
                    ...cancelacionData,
                    // Si no se especificó montoDevuelto o es 0, usar el importe pendiente
                    montoDevuelto: cancelacionData.montoDevuelto > 0 
                        ? cancelacionData.montoDevuelto 
                        : importePendiente
                };

                cancelarMutation.mutate({
                    id: selectedReservaForCancel._id,
                    datosCancelacion
                });
            }
        } catch (error) {
            console.error('Error preparing cancelacion data:', error);
            setSnackbar({
                open: true,
                message: 'Error al preparar los datos de cancelación',
                severity: 'error'
            });
        }
    };

    const handlePrintReserva = (reserva: any) => {
        setSelectedReservaForPDF(reserva);
        setShowReservaPDF(true);
    };

    const handlePrintLiquidacion = (reserva: any, liquidacionData: any) => {
        setSelectedReservaForPDF(reserva);
        setSelectedLiquidacionData(liquidacionData);
        setShowLiquidacionPDF(true);
    };

    const handleSaveServicios = async (servicios: Servicio[]) => {
        try {
            const response = await fetch(`${API_BASE_URL}/servicios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(servicios)
            });
            if (!response.ok) throw new Error('Error al guardar servicios');

            const updatedResponse = await fetch(`${API_BASE_URL}/servicios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!updatedResponse.ok) throw new Error('Error al obtener servicios');
            updateServicios(await updatedResponse.json());

            setSnackbar({
                open: true,
                message: 'Servicios guardados correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al guardar servicios:', error);
            setSnackbar({
                open: true,
                message: error instanceof Error ? error.message : 'Error al guardar los servicios',
                severity: 'error'
            });
        }
    };

    const handleSaveSuplementos = async (suplementos: Suplemento[]) => {
        try {
            await saveSuplementosMutation.mutateAsync(suplementos);
            setSnackbar({
                open: true,
                message: 'Suplementos guardados correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al guardar suplementos:', error);
            setSnackbar({
                open: true,
                message: error instanceof Error ? error.message : 'Error al guardar los suplementos',
                severity: 'error'
            });
        }
    };

    const handleDeleteServicio = async (id: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar servicio');
            }

            const updatedResponse = await fetch(`${API_BASE_URL}/servicios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!updatedResponse.ok) throw new Error('Error al obtener servicios');
            const updatedData = await updatedResponse.json();
            updateServicios(updatedData);

            setSnackbar({
                open: true,
                message: 'Servicio eliminado correctamente',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error al eliminar servicio:', error);
            setSnackbar({
                open: true,
                message: error instanceof Error ? error.message : 'Error al eliminar el servicio',
                severity: 'error'
            });
        }
    };

    const renderResumenPrecio = () => {
        const servicio = servicios.find(s => s.id === formData.servicio);
        const suplementosPrecios = new Map();

        // Calcular precios de suplementos sin duplicados
        formData.suplementos.forEach(sup => {
            const suplemento = suplementosList.find(s => s.id === sup.id);
            if (suplemento) {
                const cantidad = sup.cantidad || 1;
                const precio = suplemento.tipo === 'fijo' ? suplemento.precio : suplemento.precio * cantidad;
                suplementosPrecios.set(sup.id, {
                    nombre: suplemento.nombre,
                    precio: Number(precio.toFixed(2)),
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
                        Servicio: {Number(servicio.precio).toFixed(2)}€
                    </Typography>
                )}
                {Array.from(suplementosPrecios.values()).map(({ nombre, precio, cantidad, tipo }, index) => (
                    <Typography key={index} sx={{ mb: 1 }}>
                        {nombre}{tipo === 'porHora' && cantidad > 1 ? ` (${cantidad})` : ''}: {Number(precio).toFixed(2)}€
                    </Typography>
                ))}
                <Typography variant="h6" sx={{ mt: 2, color: 'primary.main' }}>
                    Total: {Number(calcularPrecioTotal()).toFixed(2)}€
                </Typography>
            </Box>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Reservas
                </Typography>
                <Box>
                    {user && user.role === 'ADMINISTRADOR' && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={() => setOpenGestionServicios(true)}
                                sx={{ mr: 2 }}
                            >
                                Gestionar Servicios
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={() => setOpenGestionSuplementos(true)}
                                sx={{ mr: 2 }}
                            >
                                Gestionar Suplementos
                            </Button>
                        </>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Nueva Reserva
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ width: { xs: '100%', md: '33%' } }}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                            <StyledCalendar
                                value={selectedDate}
                                onChange={(newDate) => setSelectedDate(newDate)}
                                slots={{
                                    day: (props) => (
                                        <Box>
                                            <PickersDay {...props} />
                                            {renderDayContent(props.day as Date)}
                                        </Box>
                                    )
                                }}
                            />
                        </LocalizationProvider>
                    </Paper>
                    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Leyenda
                        </Typography>
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                {servicios.filter((s: Servicio) => s.activo).map((servicio: Servicio) => (
                                    <Box key={servicio.id} sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: servicio.color,
                                                    borderRadius: '50%'
                                                }}
                                            />
                                            <Typography variant="body2">
                                                {servicio.nombre}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                                            <Box
                                                sx={{
                                                    width: 20,
                                                    height: 20,
                                                    backgroundColor: servicio.colorConObservaciones,
                                                    borderRadius: '50%'
                                                }}
                                            />
                                            <Typography variant="body2">
                                                {servicio.nombre} (con observaciones)
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                backgroundColor: '#ff9800',
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <Typography variant="body2">
                                            Lista de espera
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                backgroundColor: '#2e7d32',
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <Typography variant="body2">
                                            Completada y pagada
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 8px)' } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 20,
                                                height: 20,
                                                backgroundColor: '#9e9e9e',
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <Typography variant="body2">
                                            Cancelada
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                <Box sx={{ width: { xs: '100%', md: '67%' } }}>
                    {selectedDate && (
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Reservas para {format(selectedDate, 'PPP', { locale: es })}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {getReservasForDate(selectedDate).map((reserva) => (
                                    <Card key={reserva._id} sx={{
                                        borderLeft: 4,
                                        borderColor: getReservaColor(reserva)
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <Typography variant="h6">
                                                    {servicios.find(s => s.id === reserva.tipoInstalacion.toLowerCase())?.nombre}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {isSameDay(new Date(), parseISO(reserva.fecha)) &&
                                                        reserva.estado !== 'COMPLETADA' && (
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() => handleOpenLiquidacionDialog(reserva)}
                                                            >
                                                                Liquidar
                                                            </Button>
                                                        )}
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<EditIcon />}
                                                        onClick={() => handleOpenDialog(reserva)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    {(user?.role === 'ADMINISTRADOR' || user?.role === 'JUNTA') && (
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<DeleteIcon />}
                                                            onClick={() => handleDelete(reserva._id)}
                                                        >
                                                            Eliminar
                                                        </Button>
                                                    )}
                                                    {reserva.estado !== 'COMPLETADA' && reserva.estado !== 'CANCELADA' && (
                                                        <Button
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<CancelIcon />}
                                                            onClick={() => handleCancelClick(reserva)}
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<PrintIcon />}
                                                        onClick={() => handlePrintReserva(reserva)}
                                                    >
                                                        Imprimir Reserva
                                                    </Button>
                                                    {reserva.estado === 'COMPLETADA' && (
                                                        <Button
                                                            variant="outlined"
                                                            color="success"
                                                            startIcon={<PrintIcon />}
                                                            onClick={() => handlePrintLiquidacion(reserva, {
                                                                montoAbonado: reserva.montoAbonado,
                                                                metodoPago: reserva.metodoPago,
                                                                suplementos: reserva.suplementos,
                                                                observaciones: reserva.observaciones
                                                            })}
                                                        >
                                                            Imprimir Liquidación
                                                        </Button>
                                                    )}
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Socio
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {reserva.socio ? `${reserva.socio.nombre.nombre} ${reserva.socio.nombre.primerApellido} ${reserva.socio.nombre.segundoApellido || ''}` : 'Socio no disponible'}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Servicio
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {servicios.find(s => s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase())?.nombre}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Fecha y Hora
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {format(parseISO(reserva.fecha), 'PPP', { locale: es })}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Estado
                                                        </Typography>
                                                        <Chip
                                                            label={reserva.estado}
                                                            color={
                                                                reserva.estado === 'COMPLETADA' ? 'success' :
                                                                    reserva.estado === 'CANCELADA' ? 'error' :
                                                                        reserva.estado === 'LISTA_ESPERA' ? 'warning' :
                                                                            'primary'
                                                            }
                                                            size="small"
                                                        />
                                                    </Box>
                                                </Box>
                                                <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Precio Total
                                                        </Typography>
                                                        <Typography variant="body1">
                                                            {reserva.precio.toFixed(2)}€
                                                        </Typography>
                                                    </Box>
                                                    {reserva.montoAbonado !== undefined && (
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="subtitle2" color="text.secondary">
                                                                Monto Abonado
                                                            </Typography>
                                                            <Typography variant="body1">
                                                                {reserva.montoAbonado.toFixed(2)}€
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {reserva.montoAbonado !== undefined && (
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="subtitle2" color="text.secondary">
                                                                Restante a Abonar
                                                            </Typography>
                                                            <Typography variant="body1" color="error.main" fontWeight="bold">
                                                                {(reserva.precio - (reserva.montoAbonado || 0)).toFixed(2)}€
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {reserva.metodoPago && (
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="subtitle2" color="text.secondary">
                                                                Método de Pago
                                                            </Typography>
                                                            <Typography variant="body1">
                                                                {reserva.metodoPago.charAt(0).toUpperCase() + reserva.metodoPago.slice(1)}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                                {reserva.suplementos && reserva.suplementos.length > 0 && (
                                                    <Box sx={{ width: '100%' }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Suplementos
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                            {reserva.suplementos.reduce((acc: any[], sup) => {
                                                                const existingIndex = acc.findIndex(item => item.id === sup.id);
                                                                if (existingIndex === -1) {
                                                                    acc.push({ ...sup, cantidad: sup.cantidad || 1 });
                                                                } else {
                                                                    acc[existingIndex].cantidad = (acc[existingIndex].cantidad || 1) + (sup.cantidad || 1);
                                                                }
                                                                return acc;
                                                            }, []).map((sup, index) => {
                                                                const suplemento = suplementosList.find(s => s.id === sup.id);
                                                                return suplemento ? (
                                                                    <Chip
                                                                        key={index}
                                                                        label={`${suplemento.nombre}${sup.cantidad > 1 ? ` (${sup.cantidad})` : ''}`}
                                                                        size="small"
                                                                    />
                                                                ) : null;
                                                            })}
                                                        </Box>
                                                    </Box>
                                                )}
                                                {reserva.observaciones && (
                                                    <Box sx={{ width: '100%' }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Observaciones
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {reserva.observaciones}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Modal para PDF de Reserva */}
            <Dialog
                open={showReservaPDF}
                onClose={() => setShowReservaPDF(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Comprobante de Reserva
                    <IconButton
                        onClick={() => setShowReservaPDF(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedReservaForPDF && (
                        <ReservaPDF
                            reserva={selectedReservaForPDF}
                            socio={selectedReservaForPDF.socio ? socios.find(s => s._id === selectedReservaForPDF.socio._id) : null}
                            servicio={servicios.find(s => s.nombre.toLowerCase() === selectedReservaForPDF.tipoInstalacion.toLowerCase())}
                            suplementosList={suplementosList}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal para PDF de Liquidación */}
            <Dialog
                open={showLiquidacionPDF}
                onClose={() => setShowLiquidacionPDF(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Comprobante de Liquidación
                    <IconButton
                        onClick={() => setShowLiquidacionPDF(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedReservaForPDF && selectedLiquidacionData && (
                        <LiquidacionPDF
                            reserva={selectedReservaForPDF}
                            socio={selectedReservaForPDF.socio ? socios.find(s => s._id === selectedReservaForPDF.socio._id) : null}
                            servicio={servicios.find(s => s.id === selectedReservaForPDF.tipoInstalacion.toLowerCase())}
                            liquidacionData={selectedLiquidacionData}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Gestión de Servicios */}
            <GestionServicios
                open={openGestionServicios}
                onClose={() => setOpenGestionServicios(false)}
                servicios={servicios}
                onSaveServicios={handleSaveServicios}
                onDeleteServicio={handleDeleteServicio}
            />

            {/* Modal de Gestión de Suplementos */}
            <GestionSuplementos
                open={openGestionSuplementos}
                onClose={() => setOpenGestionSuplementos(false)}
                suplementos={suplementosList}
                onSaveSuplementos={handleSaveSuplementos}
            />

            {/* Modal de Nueva/Editar Reserva */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
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
                        onClick={handleCloseDialog}
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
                            {reservaExistente && !selectedReserva && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    <Typography variant="body1" fontWeight="bold">
                                        ⚠️ Lista de Espera
                                    </Typography>
                                    <Typography variant="body2">
                                        Ya existe una reserva para este servicio en esta fecha. Esta reserva se añadirá a la lista de espera y no se podrá realizar el pago hasta que se confirme la disponibilidad.
                                    </Typography>
                                </Alert>
                            )}
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Fecha"
                                        value={formData.fecha}
                                        onChange={(e) => {
                                            setFormData({ ...formData, fecha: e.target.value });
                                            // Resetear reservaExistente cuando cambia la fecha
                                            setReservaExistente(false);
                                        }}
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
                                            onChange={(e) => {
                                                setFormData({ ...formData, servicio: e.target.value });
                                                // Resetear reservaExistente cuando cambia el servicio
                                                setReservaExistente(false);
                                            }}
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
                                <Grid item xs={12} sm={user && user.role === UserRole.TIENDA ? 6 : 12}>
                                    <Autocomplete
                                        options={socios.filter(s => s.active)}
                                        getOptionLabel={(option) => {
                                            return `${option.nombre.nombre} ${option.nombre.primerApellido} (${option.socio})`;
                                        }}
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
                                                    },
                                                    '& .MuiAutocomplete-input': {
                                                        padding: '11px 14px'
                                                    },
                                                    '& .MuiAutocomplete-endAdornment': {
                                                        top: 'calc(50% - 14px)',
                                                        right: '14px'
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                </Grid>
                                {/* Selector de Trabajador - Solo visible para usuarios TIENDA */}
                                {user && user.role === UserRole.TIENDA && (
                                    <Grid item xs={12} sm={6}>
                                        <TrabajadorSelector
                                            value={formData.trabajadorId}
                                            onChange={(trabajadorId) => {
                                                setFormData({ ...formData, trabajadorId: trabajadorId || undefined });
                                            }}
                                            required={true}
                                            variant="select"
                                        />
                                    </Grid>
                                )}
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
                                {/* Si estamos editando una reserva, mostrar información del pago ya realizado */}
                                {selectedReserva && formData.montoYaAbonado !== undefined && formData.montoYaAbonado > 0 && (
                                    <>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Monto Ya Abonado"
                                                value={formData.montoYaAbonado.toFixed(2)}
                                                InputProps={{
                                                    startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem' }}>€</Typography>,
                                                    readOnly: true
                                                }}
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        fontSize: '1.1rem',
                                                        padding: '12px 14px',
                                                        backgroundColor: 'action.disabledBackground'
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        fontSize: '1.1rem'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Monto Pendiente"
                                                value={Number((calcularPrecioTotal() - Number((formData.montoYaAbonado || 0).toFixed(2))).toFixed(2)).toFixed(2)}
                                                InputProps={{
                                                    startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem' }}>€</Typography>,
                                                    readOnly: true
                                                }}
                                                sx={{
                                                    '& .MuiInputBase-input': {
                                                        fontSize: '1.1rem',
                                                        padding: '12px 14px',
                                                        backgroundColor: 'action.disabledBackground',
                                                        color: 'error.main',
                                                        fontWeight: 'bold'
                                                    },
                                                    '& .MuiInputLabel-root': {
                                                        fontSize: '1.1rem'
                                                    }
                                                }}
                                            />
                                        </Grid>
                                    </>
                                )}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label={selectedReserva && formData.montoYaAbonado !== undefined && formData.montoYaAbonado > 0 
                                            ? "Monto Adicional a Abonar" 
                                            : "Monto Abonado"}
                                        value={formData.montoAbonado}
                                        onChange={(e) => {
                                            // Si está en lista de espera, no permitir cambios
                                            if (reservaExistente) {
                                                return;
                                            }
                                            const nuevoMonto = Number((parseFloat(e.target.value) || 0).toFixed(2));
                                            // Si estamos editando y hay monto ya abonado, validar que no exceda el pendiente
                                            if (selectedReserva && formData.montoYaAbonado !== undefined) {
                                                const precioTotal = calcularPrecioTotal();
                                                const montoYaAbonadoRedondeado = Number(formData.montoYaAbonado.toFixed(2));
                                                const montoPendiente = Number((precioTotal - montoYaAbonadoRedondeado).toFixed(2));
                                                if (nuevoMonto > montoPendiente) {
                                                    setSnackbar({
                                                        open: true,
                                                        message: `El monto adicional no puede exceder el pendiente (${montoPendiente.toFixed(2)}€)`,
                                                        severity: 'error'
                                                    });
                                                    return;
                                                }
                                            }
                                            setFormData({ ...formData, montoAbonado: nuevoMonto });
                                        }}
                                        disabled={reservaExistente}
                                        InputProps={{
                                            startAdornment: <Typography sx={{ mr: 1, fontSize: '1.1rem' }}>€</Typography>,
                                        }}
                                        helperText={reservaExistente 
                                            ? 'Las reservas en lista de espera no pueden tener pago'
                                            : (selectedReserva && formData.montoYaAbonado !== undefined && formData.montoYaAbonado > 0
                                                ? `Máximo: ${Number((calcularPrecioTotal() - Number((formData.montoYaAbonado || 0).toFixed(2))).toFixed(2)).toFixed(2)}€`
                                                : '')}
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
                                            disabled={reservaExistente}
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
                                onClick={handleCloseDialog}
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

            {/* Modal de Liquidación */}
            {selectedReservaLiquidacion && (
                <LiquidacionDialog
                    open={openLiquidacionDialog}
                    onClose={handleCloseLiquidacionDialog}
                    reserva={selectedReservaLiquidacion}
                />
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity as 'success' | 'error'}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog
                open={openPDF}
                onClose={() => setOpenPDF(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogContent>
                    {selectedReserva && (
                        <ReservaPDF
                            reserva={selectedReserva}
                            socio={socios.find(s => s._id === selectedReserva.socio._id)}
                            servicio={servicios.find(s => s.nombre.toLowerCase() === selectedReserva.tipoInstalacion.toLowerCase())}
                            suplementosList={suplementosList}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal de Cancelación */}
            {selectedReservaForCancel && (
                <CancelacionDialog
                    open={openCancelDialog}
                    onClose={() => setOpenCancelDialog(false)}
                    reserva={selectedReservaForCancel}
                />
            )}
        </Box>
    );
}; 