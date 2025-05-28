import React from 'react';
import {
    Box,
    Paper,
    Typography,
    styled
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reserva, Servicio } from './types';

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

interface ReservasCalendarProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    reservas: Reserva[];
    servicios: Servicio[];
}

export const ReservasCalendar: React.FC<ReservasCalendarProps> = ({
    selectedDate,
    onDateChange,
    reservas,
    servicios
}) => {
    const getReservasForDate = (date: Date) => {
        return reservas.filter(reserva => {
            const reservaDate = new Date(reserva.fecha);
            return isSameDay(reservaDate, date);
        });
    };

    const getReservaColor = (reserva: Reserva) => {
        if (reserva.estado === 'CANCELADA') {
            return '#9e9e9e';
        }

        if (reserva.estado === 'COMPLETADA' && reserva.montoAbonado === reserva.precio) {
            return '#2e7d32';
        }

        if (reserva.estado === 'LISTA_ESPERA') {
            return '#ff9800';
        }

        if (reserva.observaciones) {
            return '#f57c00';
        }

        const servicio = servicios.find(s => s.nombre.toLowerCase() === reserva.tipoInstalacion.toLowerCase());
        return servicio?.color || '#757575';
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
                        title={`${reserva.tipoInstalacion}: ${reserva.socio.nombre.nombre} ${reserva.socio.nombre.primerApellido} - ${reserva.estado}`}
                    />
                ))}
            </Box>
        );
    };

    return (
        <>
            <Paper elevation={3} sx={{ p: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                    <StyledCalendar
                        value={selectedDate}
                        onChange={(newDate) => onDateChange(newDate)}
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
                        {servicios.filter(s => s.activo).map((servicio) => (
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
        </>
    );
}; 