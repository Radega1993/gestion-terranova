import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 12,
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
    },
    title: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    sectionTitle: {
        fontSize: 14,
        marginBottom: 10,
        fontWeight: 'bold',
        backgroundColor: '#f0f0f0',
        padding: 5,
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tableRow: {
        margin: 'auto',
        flexDirection: 'row',
    },
    tableCol: {
        width: '25%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    tableCell: {
        margin: 'auto',
        padding: 5,
        fontSize: 10,
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        borderTop: 1,
        paddingTop: 20,
    },
    infoBox: {
        margin: 10,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 5,
    },
    infoText: {
        marginBottom: 5,
        fontSize: 12,
    },
    infoLabel: {
        fontWeight: 'bold',
        marginRight: 5,
    },
    emptyMessage: {
        textAlign: 'center',
        padding: 10,
        fontStyle: 'italic',
        color: '#666',
    },
});

interface InvitacionesPDFProps {
    socio: {
        codigo: string;
        nombre: string;
    };
    ejercicio: number;
    invitacionesDisponibles: number;
    invitaciones: Array<{
        fechaUso: string;
        nombreInvitado: string;
        observaciones?: string;
        usuarioRegistro?: {
            username: string;
        };
        trabajador?: {
            nombre: string;
            identificador: string;
        };
    }>;
    modificaciones: Array<{
        fecha: string;
        invitacionesDisponibles: number;
        observaciones?: string;
        usuarioActualizacion: {
            username: string;
        };
    }>;
}

export const InvitacionesPDF: React.FC<InvitacionesPDFProps> = ({
    socio,
    ejercicio,
    invitacionesDisponibles,
    invitaciones = [],
    modificaciones = []
}) => {
    console.log('Datos recibidos en el PDF:', {
        socio,
        ejercicio,
        invitacionesDisponibles,
        invitaciones,
        modificaciones
    });

    // Ordenar invitaciones por fecha (más recientes primero)
    const invitacionesOrdenadas = [...invitaciones].sort((a, b) =>
        new Date(b.fechaUso).getTime() - new Date(a.fechaUso).getTime()
    );

    console.log('Invitaciones ordenadas:', invitacionesOrdenadas);

    // Ordenar modificaciones por fecha (más recientes primero)
    const modificacionesOrdenadas = [...modificaciones].sort((a, b) =>
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    console.log('Modificaciones ordenadas:', modificacionesOrdenadas);

    return (
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Historial de Invitaciones</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                    </View>

                    {/* Información del Socio */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Socio:</Text> {socio?.nombre || 'No especificado'}
                        </Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Código:</Text> {socio?.codigo || 'No especificado'}
                        </Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Ejercicio:</Text> {ejercicio}-{ejercicio + 1}
                        </Text>
                        <Text style={styles.infoText}>
                            <Text style={styles.infoLabel}>Invitaciones Disponibles:</Text> {invitacionesDisponibles || 0}
                        </Text>
                    </View>

                    {/* Historial de Invitaciones Usadas */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Invitaciones Utilizadas</Text>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Fecha</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Invitado</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Registrado por</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Observaciones</Text>
                                </View>
                            </View>
                            {invitacionesOrdenadas.length > 0 ? (
                                invitacionesOrdenadas.map((invitacion, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>
                                                {format(new Date(invitacion.fechaUso), 'dd/MM/yyyy')}
                                            </Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{invitacion.nombreInvitado}</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>
                                                {invitacion.trabajador 
                                                    ? `${invitacion.trabajador.nombre} (${invitacion.trabajador.identificador})`
                                                    : invitacion.usuarioRegistro?.username || '-'
                                                }
                                            </Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{invitacion.observaciones || '-'}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.tableRow}>
                                    <View style={[styles.tableCol, { width: '100%' }]}>
                                        <Text style={[styles.tableCell, styles.emptyMessage]}>
                                            No hay invitaciones registradas
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Historial de Modificaciones */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Modificaciones de Invitaciones</Text>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Fecha</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Cantidad</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Modificado por</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Motivo</Text>
                                </View>
                            </View>
                            {modificacionesOrdenadas.length > 0 ? (
                                modificacionesOrdenadas.map((mod, index) => (
                                    <View key={index} style={styles.tableRow}>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>
                                                {format(new Date(mod.fecha), 'dd/MM/yyyy')}
                                            </Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{mod.invitacionesDisponibles}</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{mod.usuarioActualizacion?.username || '-'}</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>{mod.observaciones || '-'}</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.tableRow}>
                                    <View style={[styles.tableCol, { width: '100%' }]}>
                                        <Text style={[styles.tableCell, styles.emptyMessage]}>
                                            No hay modificaciones registradas
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text>Documento generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
}; 