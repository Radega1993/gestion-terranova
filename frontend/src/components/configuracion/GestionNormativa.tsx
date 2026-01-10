import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Container,
    ButtonGroup,
    Tooltip
} from '@mui/material';
import { Save as SaveIcon, FormatBold, FormatItalic, FormatUnderlined } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { configuracionService } from '../../services/configuracion';
import { useAuthStore } from '../../stores/authStore';
import Swal from 'sweetalert2';

export const GestionNormativa: React.FC = () => {
    const { token } = useAuthStore();
    const queryClient = useQueryClient();
    const [texto, setTexto] = useState<string>('');
    const textFieldRef = useRef<HTMLTextAreaElement>(null);

    // Consulta para obtener la normativa
    const { data: normativaTexto, isLoading, error } = useQuery({
        queryKey: ['normativa'],
        queryFn: async () => {
            if (!token) throw new Error('No hay token');
            return await configuracionService.obtenerNormativa(token);
        },
        enabled: !!token
    });

    // Sincronizar el estado del texto con los datos cargados
    useEffect(() => {
        if (normativaTexto) {
            // Actualizar el texto cuando se carga la normativa
            setTexto(normativaTexto);
        }
    }, [normativaTexto]);

    // Mutación para actualizar la normativa
    const updateMutation = useMutation({
        mutationFn: async (nuevoTexto: string) => {
            if (!token) throw new Error('No hay token');
            await configuracionService.actualizarNormativa(token, nuevoTexto);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['normativa'] });
            Swal.fire({
                icon: 'success',
                title: 'Normativa actualizada',
                text: 'La normativa se ha actualizado correctamente.',
                confirmButtonColor: '#3085d6'
            });
        },
        onError: (error: Error) => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al actualizar la normativa',
                confirmButtonColor: '#d33'
            });
        }
    });

    const insertarFormato = (marcadorInicio: string, marcadorFin: string = marcadorInicio) => {
        const textField = textFieldRef.current;
        if (!textField) return;

        const inicio = textField.selectionStart;
        const fin = textField.selectionEnd;
        const textoSeleccionado = texto.substring(inicio, fin);
        
        let nuevoTexto: string;
        if (textoSeleccionado) {
            // Si hay texto seleccionado, aplicar formato al texto seleccionado
            nuevoTexto = texto.substring(0, inicio) + 
                        marcadorInicio + textoSeleccionado + marcadorFin + 
                        texto.substring(fin);
        } else {
            // Si no hay texto seleccionado, insertar los marcadores en la posición del cursor
            nuevoTexto = texto.substring(0, inicio) + 
                        marcadorInicio + marcadorFin + 
                        texto.substring(fin);
        }
        
        setTexto(nuevoTexto);
        
        // Restaurar el foco y la posición del cursor
        setTimeout(() => {
            textField.focus();
            const nuevaPosicion = textoSeleccionado 
                ? inicio + marcadorInicio.length + textoSeleccionado.length + marcadorFin.length
                : inicio + marcadorInicio.length;
            textField.setSelectionRange(nuevaPosicion, nuevaPosicion);
        }, 0);
    };

    const aplicarNegrita = () => {
        insertarFormato('**', '**');
    };

    const aplicarCursiva = () => {
        insertarFormato('*', '*');
    };

    const aplicarSubrayado = () => {
        insertarFormato('__', '__');
    };

    const handleGuardar = () => {
        if (!texto.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Texto vacío',
                text: 'El texto de la normativa no puede estar vacío.',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        Swal.fire({
            title: '¿Confirmar actualización?',
            text: 'Se actualizará el texto de la normativa que aparecerá en los PDFs de reserva.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, actualizar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                updateMutation.mutate(texto);
            }
        });
    };

    if (isLoading) {
        return (
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg">
                <Alert severity="error" sx={{ mt: 2 }}>
                    Error al cargar la normativa: {error instanceof Error ? error.message : 'Error desconocido'}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                    Gestión de Normativa de Reservas
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                        Este texto aparecerá en el PDF de reserva que se genera para cada socio. 
                        Puede modificar el contenido cuando la normativa cambie. El texto se mostrará 
                        junto con la reserva para que el socio lo tenga y lo firme.
                    </Typography>
                </Alert>

                <Paper elevation={3} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Texto de la Normativa
                        </Typography>
                        <ButtonGroup size="small" variant="outlined">
                            <Tooltip title="Negrita (**texto**)">
                                <Button onClick={aplicarNegrita}>
                                    <FormatBold />
                                </Button>
                            </Tooltip>
                            <Tooltip title="Cursiva (*texto*)">
                                <Button onClick={aplicarCursiva}>
                                    <FormatItalic />
                                </Button>
                            </Tooltip>
                            <Tooltip title="Subrayado (__texto__)">
                                <Button onClick={aplicarSubrayado}>
                                    <FormatUnderlined />
                                </Button>
                            </Tooltip>
                        </ButtonGroup>
                    </Box>

                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                            <strong>Formato de texto:</strong> Seleccione el texto y use los botones de formato, o use los marcadores manualmente:
                            <br />• <strong>**texto**</strong> para negrita
                            <br />• <em>*texto*</em> para cursiva
                            <br />• <u>__texto__</u> para subrayado
                        </Typography>
                    </Alert>

                    <TextField
                        inputRef={textFieldRef}
                        fullWidth
                        multiline
                        rows={25}
                        value={texto || normativaTexto || ''}
                        onChange={(e) => setTexto(e.target.value)}
                        placeholder={isLoading ? "Cargando normativa..." : "Introduzca el texto de la normativa aquí..."}
                        sx={{
                            '& .MuiInputBase-input': {
                                fontSize: '0.95rem',
                                fontFamily: 'monospace',
                                lineHeight: 1.6
                            }
                        }}
                    />

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => setTexto(normativaTexto || '')}
                            disabled={updateMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={updateMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                            onClick={handleGuardar}
                            disabled={updateMutation.isPending || texto === normativaTexto}
                        >
                            {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </Box>
                </Paper>

                <Paper elevation={1} sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Información
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • El texto se guardará y aparecerá en todos los PDFs de reserva generados a partir de ahora.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • Los cambios no afectarán a los PDFs ya generados anteriormente.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        • Puede usar saltos de línea para formatear el texto.
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
};

