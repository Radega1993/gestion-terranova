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
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: '40%',
        fontWeight: 'bold',
    },
    value: {
        width: '60%',
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
    signature: {
        marginTop: 50,
        borderTop: 1,
        paddingTop: 10,
        textAlign: 'center',
    },
});

interface ReservaPDFProps {
    reserva: any;
    socio: any;
    servicio: any;
}

export const ReservaPDF: React.FC<ReservaPDFProps> = ({ reserva, socio, servicio }) => {
    return (
        <PDFViewer style={{ width: '100%', height: '100vh' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Reserva de Instalación</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Número de Socio:</Text>
                            <Text style={styles.value}>{socio.numeroSocio}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Nombre:</Text>
                            <Text style={styles.value}>{`${socio.nombre} ${socio.apellidos}`}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Instalación:</Text>
                            <Text style={styles.value}>{servicio.nombre}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Fecha:</Text>
                            <Text style={styles.value}>{format(new Date(reserva.fecha), 'PPP', { locale: es })}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Precio Base:</Text>
                            <Text style={styles.value}>{servicio.precio}€</Text>
                        </View>

                        {reserva.suplementos && reserva.suplementos.length > 0 && (
                            <>
                                <Text style={{ marginTop: 10, marginBottom: 5 }}>Suplementos:</Text>
                                {reserva.suplementos.map((sup: any, index: number) => (
                                    <View key={index} style={styles.row}>
                                        <Text style={styles.label}>{sup.nombre}:</Text>
                                        <Text style={styles.value}>
                                            {sup.precio}€ {sup.cantidad ? `(${sup.cantidad} horas)` : ''}
                                        </Text>
                                    </View>
                                ))}
                            </>
                        )}

                        <View style={styles.row}>
                            <Text style={styles.label}>Precio Total:</Text>
                            <Text style={styles.value}>{reserva.precio}€</Text>
                        </View>

                        {reserva.montoAbonado > 0 && (
                            <>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Monto Abonado:</Text>
                                    <Text style={styles.value}>{reserva.montoAbonado}€</Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Método de Pago:</Text>
                                    <Text style={styles.value}>{reserva.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}</Text>
                                </View>
                            </>
                        )}

                        {reserva.observaciones && (
                            <View style={{ marginTop: 10 }}>
                                <Text style={styles.label}>Observaciones:</Text>
                                <Text style={styles.value}>{reserva.observaciones}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.signature}>
                        <Text>Firma del Socio</Text>
                        <Text style={{ marginTop: 50 }}>_________________________</Text>
                    </View>

                    <View style={styles.footer}>
                        <Text>Este documento sirve como comprobante de la reserva realizada.</Text>
                        <Text>Por favor, conserve este documento hasta el día de la reserva.</Text>
                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
}; 