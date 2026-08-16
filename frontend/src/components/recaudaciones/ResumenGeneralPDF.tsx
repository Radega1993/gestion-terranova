import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

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
    row: {
        flexDirection: 'row',
        marginBottom: 5,
        borderBottom: 1,
        paddingBottom: 5,
    },
    label: {
        width: '60%',
    },
    value: {
        width: '40%',
        textAlign: 'right',
    },
    totalRow: {
        flexDirection: 'row',
        marginTop: 10,
        paddingTop: 10,
        borderTop: 1,
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
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 5,
        marginBottom: 10,
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
        padding: 3,
        fontSize: 9,
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
});

export interface ResumenGeneralData {
    totalesGenerales: {
        total: number;
        categorias: Record<string, number>;
    };
    totalesPorMetodoPago: { efectivo: number; tarjeta: number };
    porTrabajador: Array<{
        nombre: string;
        efectivo: number;
        tarjeta: number;
        total: number;
    }>;
    productos: Array<{ nombre: string; cantidad: number; total: number }>;
}

interface ResumenGeneralPDFProps {
    resumen: ResumenGeneralData;
    fechaInicio: Date;
    fechaFin: Date;
}

/** PDF de resumen general a partir de datos ya agregados en el servidor. */
export const ResumenGeneralPDF: React.FC<ResumenGeneralPDFProps> = ({
    resumen,
    fechaInicio,
    fechaFin,
}) => {
    const { totalesGenerales, totalesPorMetodoPago, porTrabajador, productos } = resumen;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Resumen general</Text>
                    <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                    <Text>
                        Período: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Totales Generales</Text>
                    {Object.entries(totalesGenerales.categorias)
                        .filter(([, total]) => total > 0)
                        .map(([categoria, total]) => (
                            <View key={categoria} style={styles.row}>
                                <Text style={styles.label}>
                                    Total {categoria.charAt(0).toUpperCase() + categoria.slice(1)}:
                                </Text>
                                <Text style={styles.value}>{(total as number).toFixed(2)}€</Text>
                            </View>
                        ))}
                    <View style={styles.totalRow}>
                        <Text style={styles.label}>Total General:</Text>
                        <Text style={styles.value}>{totalesGenerales.total.toFixed(2)}€</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Totales por Método de Pago</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Efectivo:</Text>
                        <Text style={styles.value}>{totalesPorMetodoPago.efectivo.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Tarjeta:</Text>
                        <Text style={styles.value}>{totalesPorMetodoPago.tarjeta.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.label}>Total:</Text>
                        <Text style={styles.value}>
                            {(totalesPorMetodoPago.efectivo + totalesPorMetodoPago.tarjeta).toFixed(2)}€
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Totales por Trabajador</Text>
                    {porTrabajador.length > 0 ? (
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Trabajador</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Efectivo</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Tarjeta</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Total</Text>
                                </View>
                            </View>
                            {porTrabajador.map((trabajador) => (
                                <View key={trabajador.nombre} style={styles.tableRow}>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{trabajador.nombre}</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>
                                            {trabajador.efectivo.toFixed(2)}€
                                        </Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>
                                            {trabajador.tarjeta.toFixed(2)}€
                                        </Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>
                                            {trabajador.total.toFixed(2)}€
                                        </Text>
                                    </View>
                                </View>
                            ))}
                            <View style={[styles.tableRow, { backgroundColor: '#f0f0f0', fontWeight: 'bold' }]}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>TOTAL</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {porTrabajador
                                            .reduce((sum, t) => sum + t.efectivo, 0)
                                            .toFixed(2)}
                                        €
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {porTrabajador
                                            .reduce((sum, t) => sum + t.tarjeta, 0)
                                            .toFixed(2)}
                                        €
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {porTrabajador.reduce((sum, t) => sum + t.total, 0).toFixed(2)}€
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <Text style={{ fontSize: 10 }}>
                            No hay recaudaciones por trabajador en el período.
                        </Text>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumen de productos vendidos</Text>
                    {productos.length > 0 ? (
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeader]}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Producto</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Cantidad</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>Total</Text>
                                </View>
                            </View>
                            {productos.map((producto, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{producto.nombre}</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{producto.cantidad}</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCell}>{producto.total.toFixed(2)}€</Text>
                                    </View>
                                </View>
                            ))}
                            <View style={[styles.tableRow, { backgroundColor: '#f0f0f0', fontWeight: 'bold' }]}>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>TOTAL</Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {productos.reduce((sum, p) => sum + p.cantidad, 0)}
                                    </Text>
                                </View>
                                <View style={styles.tableCol}>
                                    <Text style={styles.tableCell}>
                                        {productos.reduce((sum, p) => sum + p.total, 0).toFixed(2)}€
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <Text style={{ fontSize: 10 }}>
                            No hay productos vendidos en el período seleccionado.
                        </Text>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text>Documento generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
                </View>
            </Page>
        </Document>
    );
};
