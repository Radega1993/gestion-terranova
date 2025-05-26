import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Grid,
    Avatar,
    Typography,
    Box,
    Paper,
    Divider
} from '@mui/material';
import { Socio, Asociado } from '../../types/socio';
import { API_BASE_URL } from '../../config';

interface VerFamiliaModalProps {
    open: boolean;
    onClose: () => void;
    socio: Socio;
}

const VerFamiliaModal: React.FC<VerFamiliaModalProps> = ({
    open,
    onClose,
    socio
}) => {
    const renderMiembro = (miembro: Socio | Asociado, esSocio: boolean = false) => {
        const telefono = esSocio
            ? (miembro as Socio).contacto?.telefonos?.[0]
            : (miembro as Asociado).telefono;
        const fechaNacimiento = miembro.fechaNacimiento;
        const codigo = esSocio
            ? (miembro as Socio).socio
            : (miembro as Asociado).codigo;
        const nombre = esSocio
            ? `${(miembro as Socio).nombre.nombre} ${(miembro as Socio).nombre.primerApellido} ${(miembro as Socio).nombre.segundoApellido || ''}`
            : (miembro as Asociado).nombre;
        const foto = miembro.foto;

        return (
            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    mb: 2,
                    backgroundColor: esSocio ? 'primary.light' : 'background.paper',
                    color: esSocio ? 'primary.contrastText' : 'text.primary'
                }}
            >
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Avatar
                            src={foto ? `${API_BASE_URL}/uploads/${foto}` : undefined}
                            alt={nombre}
                            sx={{
                                width: 150,
                                height: 150,
                                border: '4px solid',
                                borderColor: esSocio ? 'primary.main' : 'secondary.main'
                            }}
                        >
                            {nombre.charAt(0)}
                        </Avatar>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <Typography variant="h5" gutterBottom>
                            {nombre}
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            Código: {codigo}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Fecha de Nacimiento(MM/DD/AAAA): {fechaNacimiento ? new Date(fechaNacimiento).toLocaleDateString() : 'No especificada'}
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                color: telefono ? 'inherit' : 'error.main',
                                fontWeight: telefono ? 'normal' : 'bold'
                            }}
                        >
                            Teléfono: {telefono || 'Falta teléfono'}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            container={document.body}
            PaperProps={{
                sx: {
                    minHeight: '80vh',
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" component="div">
                        Familia {`${socio.nombre.nombre} ${socio.nombre.primerApellido} ${socio.nombre.segundoApellido || ''}`}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {renderMiembro(socio, true)}
                    <Divider sx={{ my: 3 }}>
                        <Typography variant="h6" color="text.secondary">
                            Miembros de la Familia
                        </Typography>
                    </Divider>
                    {socio.asociados?.map((asociado) => (
                        <React.Fragment key={asociado.codigo}>
                            {renderMiembro(asociado)}
                        </React.Fragment>
                    ))}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default VerFamiliaModal; 