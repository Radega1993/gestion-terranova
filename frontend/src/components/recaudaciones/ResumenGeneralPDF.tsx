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
});

interface ResumenGeneralPDFProps {
    ventas: Array<{
        usuario: string;
        nombreUsuario: string;
        pagado: number;
        productos: Array<{
            nombre: string;
            precioTotal: number;
            categoria?: string;
        }>;
        tipo: 'VENTA' | 'RESERVA';
    }>;
    fechaInicio: Date;
    fechaFin: Date;
}

export const ResumenGeneralPDF: React.FC<ResumenGeneralPDFProps> = ({ ventas, fechaInicio, fechaFin }) => {
    // Agrupar ventas por trabajador
    const ventasPorTrabajador = ventas.reduce((acc: any, venta) => {
        const key = venta.nombreUsuario;
        if (!acc[key]) {
            acc[key] = {
                total: 0,
                categorias: {
                    bebidas: 0,
                    alcohol: 0,
                    aperitivos: 0,
                    chuches: 0,
                    helados: 0,
                    piscina: 0,
                    reservas: 0
                }
            };
        }

        // Sumar al total del trabajador
        acc[key].total += venta.pagado;

        // Clasificar productos por categoría
        if (venta.tipo === 'RESERVA') {
            acc[key].categorias.reservas += venta.pagado;
        } else {
            venta.productos.forEach((producto) => {
                const categoria = producto.categoria?.toLowerCase() || 'otros';
                if (acc[key].categorias[categoria] !== undefined) {
                    acc[key].categorias[categoria] += producto.precioTotal;
                }
            });
        }

        return acc;
    }, {});

    // Calcular totales generales
    const totalesGenerales = Object.values(ventasPorTrabajador).reduce((acc: any, trabajador: any) => {
        acc.total += trabajador.total;
        Object.keys(trabajador.categorias).forEach(categoria => {
            acc.categorias[categoria] = (acc.categorias[categoria] || 0) + trabajador.categorias[categoria];
        });
        return acc;
    }, { total: 0, categorias: {} });

    return (
        <PDFViewer style={{ width: '100%', height: '100vh' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Resumen General de Recaudaciones</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                        <Text>Período: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}</Text>
                    </View>

                    {/* Resumen por Trabajador */}
                    {Object.entries(ventasPorTrabajador).map(([trabajador, datos]: [string, any]) => (
                        <View key={trabajador} style={styles.section}>
                            <Text style={styles.sectionTitle}>Trabajador: {trabajador}</Text>

                            <View style={styles.row}>
                                <Text style={styles.label}>Bebidas:</Text>
                                <Text style={styles.value}>{datos.categorias.bebidas.toFixed(2)}€</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Alcohol:</Text>
                                <Text style={styles.value}>{datos.categorias.alcohol.toFixed(2)}€</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Aperitivos:</Text>
                                <Text style={styles.value}>{datos.categorias.aperitivos.toFixed(2)}€</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Chuches:</Text>
                                <Text style={styles.value}>{datos.categorias.chuches.toFixed(2)}€</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Helados:</Text>
                                <Text style={styles.value}>{datos.categorias.helados.toFixed(2)}€</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Piscina:</Text>
                                <Text style={styles.value}>{datos.categorias.piscina.toFixed(2)}€</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Reservas:</Text>
                                <Text style={styles.value}>{datos.categorias.reservas.toFixed(2)}€</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={styles.label}>Total Trabajador:</Text>
                                <Text style={styles.value}>{datos.total.toFixed(2)}€</Text>
                            </View>
                        </View>
                    ))}

                    {/* Totales Generales */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Totales Generales</Text>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Bebidas:</Text>
                            <Text style={styles.value}>{totalesGenerales.categorias.bebidas.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Alcohol:</Text>
                            <Text style={styles.value}>{totalesGenerales.categorias.alcohol.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Aperitivos:</Text>
                            <Text style={styles.value}>{totalesGenerales.categorias.aperitivos.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Chuches:</Text>
                            <Text style={styles.value}>{totalesGenerales.categorias.chuches.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Helados:</Text>
                            <Text style={styles.value}>{totalesGenerales.categorias.helados.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Piscina:</Text>
                            <Text style={styles.value}>{totalesGenerales.categorias.piscina.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>Total Reservas:</Text>
                            <Text style={styles.value}>{totalesGenerales.categorias.reservas.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.label}>Total General:</Text>
                            <Text style={styles.value}>{totalesGenerales.total.toFixed(2)}€</Text>
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