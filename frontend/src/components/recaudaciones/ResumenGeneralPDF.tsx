import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';

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
        _id: string;
        tipo: 'VENTA' | 'RESERVA';
        fecha: string;
        socio: {
            codigo: string;
            nombre: string;
        };
        usuario: {
            _id: string;
            username: string;
        };
        total: number;
        pagado: number;
        estado: string;
        detalles: Array<{
            nombre: string;
            cantidad: number;
            precio: number;
            total: number;
            categoria?: string;
        }>;
    }>;
    fechaInicio: Date;
    fechaFin: Date;
}

export const ResumenGeneralPDF: React.FC<ResumenGeneralPDFProps> = ({ ventas, fechaInicio, fechaFin }) => {
    const [categorias, setCategorias] = useState<string[]>([]);

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const response = await axios.get('/api/inventory/types');
                console.log('Categorías obtenidas:', response.data);
                setCategorias(response.data);
            } catch (error) {
                console.error('Error al obtener categorías:', error);
            }
        };
        fetchCategorias();
    }, []);

    // Agrupar ventas por trabajador
    const ventasPorTrabajador = ventas.reduce((acc: any, venta) => {
        console.log('Procesando venta:', venta);
        const key = venta.usuario.username;
        if (!acc[key]) {
            acc[key] = {
                total: 0,
                categorias: categorias.reduce((catAcc: any, cat) => {
                    catAcc[cat.toLowerCase()] = 0;
                    return catAcc;
                }, { reservas: 0, otros: 0 })
            };
        }

        // Sumar al total del trabajador
        acc[key].total += venta.pagado;

        // Clasificar productos por categoría
        if (venta.tipo === 'RESERVA') {
            acc[key].categorias.reservas += venta.pagado;
        } else {
            console.log('Procesando detalles de venta:', venta.detalles);
            venta.detalles.forEach((producto) => {
                console.log('Producto:', producto);
                const categoria = (producto.categoria || 'OTROS').toLowerCase();
                console.log('Categoría:', categoria);

                if (acc[key].categorias[categoria] !== undefined) {
                    acc[key].categorias[categoria] += producto.total;
                } else {
                    acc[key].categorias.otros += producto.total;
                }
            });
        }

        return acc;
    }, {});

    console.log('Ventas por trabajador:', ventasPorTrabajador);

    // Calcular totales generales
    const totalesGenerales = Object.values(ventasPorTrabajador).reduce((acc: {
        total: number;
        categorias: {
            [key: string]: number;
        };
    }, trabajador: any) => {
        acc.total += trabajador.total;
        Object.keys(trabajador.categorias).forEach(categoria => {
            if (!acc.categorias[categoria]) {
                acc.categorias[categoria] = 0;
            }
            acc.categorias[categoria] += trabajador.categorias[categoria];
        });
        return acc;
    }, { total: 0, categorias: {} });

    console.log('Totales generales:', totalesGenerales);

    return (
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
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

                            {Object.entries(datos.categorias)
                                .filter(([_, total]) => total > 0)
                                .map(([categoria, total]) => (
                                    <View key={categoria} style={styles.row}>
                                        <Text style={styles.label}>{categoria.charAt(0).toUpperCase() + categoria.slice(1)}:</Text>
                                        <Text style={styles.value}>{(total as number).toFixed(2)}€</Text>
                                    </View>
                                ))}

                            <View style={styles.totalRow}>
                                <Text style={styles.label}>Total Trabajador:</Text>
                                <Text style={styles.value}>{datos.total.toFixed(2)}€</Text>
                            </View>
                        </View>
                    ))}

                    {/* Totales Generales */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Totales Generales</Text>
                        {Object.entries(totalesGenerales.categorias)
                            .filter(([_, total]) => total > 0)
                            .map(([categoria, total]) => (
                                <View key={categoria} style={styles.row}>
                                    <Text style={styles.label}>Total {categoria.charAt(0).toUpperCase() + categoria.slice(1)}:</Text>
                                    <Text style={styles.value}>{(total as number).toFixed(2)}€</Text>
                                </View>
                            ))}
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