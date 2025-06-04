import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../stores/authStore';

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
});

interface ResumenDetalladoPDFProps {
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

export const ResumenDetalladoPDF: React.FC<ResumenDetalladoPDFProps> = ({ ventas, fechaInicio, fechaFin }) => {
    const [categorias, setCategorias] = useState<string[]>([]);
    const { token } = useAuthStore();

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/inventory/types`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Error al obtener categorías');
                }
                const data = await response.json();
                console.log('Categorías obtenidas:', data);
                setCategorias(data);
            } catch (error) {
                console.error('Error al obtener categorías:', error);
            }
        };
        fetchCategorias();
    }, [token]);

    // Agrupar productos vendidos
    const productosVendidos = ventas.reduce((acc: any, venta) => {
        console.log('Procesando venta:', venta);
        if (venta.tipo === 'RESERVA') {
            const key = `Reserva - ${venta.detalles[0].nombre}`;
            if (!acc[key]) {
                acc[key] = {
                    nombre: key,
                    unidades: 0,
                    precioUnitario: venta.detalles[0].precio,
                    total: 0,
                    categoria: 'RESERVAS'
                };
            }
            acc[key].unidades += 1;
            acc[key].total += venta.pagado;
        } else {
            console.log('Procesando detalles de venta:', venta.detalles);
            venta.detalles.forEach((producto) => {
                console.log('Producto:', producto);
                // Asegurarnos de que el producto tenga un nombre
                if (!producto.nombre) {
                    console.warn('Producto sin nombre:', producto);
                    return; // Saltamos este producto si no tiene nombre
                }

                const key = producto.nombre;
                if (!acc[key]) {
                    // Mapear categorías a las categorías predefinidas
                    let categoria = (producto.categoria || 'OTROS').toUpperCase();
                    if (!categorias.includes(categoria)) {
                        categoria = 'OTROS';
                    }

                    acc[key] = {
                        nombre: producto.nombre,
                        unidades: 0,
                        precioUnitario: producto.precio,
                        total: 0,
                        categoria: categoria
                    };
                }
                acc[key].unidades += producto.cantidad;
                acc[key].total += producto.total;
            });
        }
        return acc;
    }, {});

    console.log('Productos vendidos:', productosVendidos);

    // Convertir a array y ordenar por total
    const productosOrdenados = Object.values(productosVendidos)
        .filter((producto: any) => producto.nombre) // Filtrar productos sin nombre
        .sort((a: any, b: any) => b.total - a.total);

    console.log('Productos ordenados:', productosOrdenados);

    // Agrupar por categoría
    const productosPorCategoria = productosOrdenados.reduce((acc: {
        [key: string]: Array<{
            nombre: string;
            unidades: number;
            precioUnitario: number;
            total: number;
            categoria: string;
        }>;
    }, producto: any) => {
        const categoria = producto.categoria;
        if (!acc[categoria]) {
            acc[categoria] = [];
        }
        acc[categoria].push(producto);
        return acc;
    }, {});

    console.log('Productos por categoría:', productosPorCategoria);

    return (
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Resumen Detallado de Ventas</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                        <Text>Período: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}</Text>
                    </View>

                    {/* Tabla de Productos por Categoría */}
                    {Object.entries(productosPorCategoria)
                        .filter(([_, productos]) => productos.length > 0)
                        .map(([categoria, productos]) => (
                            <View key={categoria} style={styles.section}>
                                <Text style={styles.sectionTitle}>{categoria}</Text>

                                <View style={styles.table}>
                                    {/* Encabezados */}
                                    <View style={[styles.tableRow, styles.tableHeader]}>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>Producto</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>Unidades</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>Precio Unit.</Text>
                                        </View>
                                        <View style={styles.tableCol}>
                                            <Text style={styles.tableCell}>Total</Text>
                                        </View>
                                    </View>

                                    {/* Filas de productos */}
                                    {(productos as any[]).map((producto, index) => (
                                        <View key={index} style={styles.tableRow}>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCell}>{producto.nombre}</Text>
                                            </View>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCell}>{producto.unidades}</Text>
                                            </View>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCell}>{producto.precioUnitario.toFixed(2)}€</Text>
                                            </View>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCell}>{producto.total.toFixed(2)}€</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        ))}

                    <View style={styles.footer}>
                        <Text>Documento generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
}; 