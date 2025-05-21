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
    paymentSection: {
        marginTop: 20,
        padding: 10,
        border: 1,
    },
    paymentTitle: {
        fontSize: 14,
        marginBottom: 10,
        fontWeight: 'bold',
    },
});

interface LiquidacionPDFProps {
    reserva: any;
    socio: any;
    servicio: any;
    liquidacionData: any;
}

export const LiquidacionPDF: React.FC<LiquidacionPDFProps> = ({ reserva, socio, servicio, liquidacionData }) => {
    return (
        <PDFViewer style={{ width: '100%', height: '100vh' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Liquidación de Reserva</Text>
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

                        <View style={styles.paymentSection}>
                            <Text style={styles.paymentTitle}>Detalle de Pagos</Text>

                            <View style={styles.row}>
                                <Text style={styles.label}>Pago Inicial:</Text>
                                <Text style={styles.value}>
                                    {reserva.montoAbonado}€ ({reserva.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'})
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Pago Final:</Text>
                                <Text style={styles.value}>
                                    {liquidacionData.montoAbonado}€ ({liquidacionData.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta'})
                                </Text>
                            </View>

                            <View style={styles.row}>
                                <Text style={styles.label}>Total Pagado:</Text>
                                <Text style={styles.value}>
                                    {(reserva.montoAbonado + liquidacionData.montoAbonado).toFixed(2)}€
                                </Text>
                            </View>
                        </View>

                        {liquidacionData.suplementos && liquidacionData.suplementos.length > 0 && (
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.paymentTitle}>Suplementos Adicionales</Text>
                                {liquidacionData.suplementos.map((sup: any, index: number) => (
                                    <View key={index} style={styles.row}>
                                        <Text style={styles.label}>{sup.nombre}:</Text>
                                        <Text style={styles.value}>
                                            {sup.precio}€ {sup.cantidad ? `(${sup.cantidad} horas)` : ''}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {liquidacionData.observaciones && (
                            <View style={{ marginTop: 20 }}>
                                <Text style={styles.label}>Observaciones:</Text>
                                <Text style={styles.value}>{liquidacionData.observaciones}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text>Este documento sirve como comprobante de la liquidación de la reserva.</Text>
                        <Text>Fecha de liquidación: {format(new Date(), 'PPP', { locale: es })}</Text>
                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
}; 