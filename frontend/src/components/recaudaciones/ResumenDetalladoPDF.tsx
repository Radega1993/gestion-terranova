import React, { useEffect, useState, useMemo } from 'react';
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
    tableColSmall: {
        width: '12.5%',
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
    tableCellSmall: {
        margin: 'auto',
        padding: 3,
        fontSize: 8,
    },
    tableHeader: {
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
    },
    daySection: {
        marginTop: 15,
        marginBottom: 10,
        padding: 8,
        backgroundColor: '#f5f5f5',
    },
    dayTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    summaryRow: {
        flexDirection: 'row',
        marginBottom: 3,
        fontSize: 10,
    },
    summaryLabel: {
        width: '50%',
        fontWeight: 'bold',
    },
    summaryValue: {
        width: '50%',
        textAlign: 'right',
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
        trabajador?: {
            _id: string;
            nombre: string;
            identificador: string;
        };
        total: number;
        pagado: number;
        metodoPago?: string;
        estado: string;
        detalles: Array<{
            nombre: string;
            cantidad: number;
            precio: number;
            total: number;
            categoria?: string;
        }>;
        pagos?: Array<{
            fecha: string;
            monto: number;
            metodoPago: string;
            observaciones?: string;
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

    // Agrupar ventas por día
    const ventasPorDia = useMemo(() => {
        const agrupadas: any = {};
        
        ventas.forEach(venta => {
            const fechaVenta = new Date(venta.fecha);
            const fechaKey = format(fechaVenta, 'yyyy-MM-dd');
            
            if (!agrupadas[fechaKey]) {
                agrupadas[fechaKey] = {
                    fecha: fechaVenta,
                    ventas: [],
                    total: 0,
                    metodoPago: { efectivo: 0, tarjeta: 0 },
                    trabajadores: new Set<string>(),
                    cantidadVentas: 0
                };
            }
            
            agrupadas[fechaKey].ventas.push(venta);
            // Para cambios, usar pagadoRecaudacion si está disponible (incluye signo negativo para devoluciones)
            const montoVenta = venta.tipo === 'CAMBIO' && (venta as any).pagadoRecaudacion !== undefined 
                ? (venta as any).pagadoRecaudacion 
                : venta.pagado;
            agrupadas[fechaKey].total += montoVenta;
            agrupadas[fechaKey].cantidadVentas += 1;
            
            const metodoPago = venta.metodoPago || (venta.pagos && venta.pagos.length > 0 ? venta.pagos[0].metodoPago : '');
            if (metodoPago === 'EFECTIVO' || metodoPago === 'efectivo') {
                agrupadas[fechaKey].metodoPago.efectivo += montoVenta;
            } else if (metodoPago === 'TARJETA' || metodoPago === 'tarjeta') {
                agrupadas[fechaKey].metodoPago.tarjeta += montoVenta;
            }
            
            const trabajadorKey = venta.trabajador 
                ? `${venta.trabajador.nombre} (${venta.trabajador.identificador})`
                : venta.usuario.username;
            agrupadas[fechaKey].trabajadores.add(trabajadorKey);
        });
        
        // Convertir Sets a arrays y ordenar por fecha
        return Object.keys(agrupadas)
            .sort()
            .map(key => ({
                ...agrupadas[key],
                trabajadores: Array.from(agrupadas[key].trabajadores)
            }));
    }, [ventas]);

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
                    categoria: 'RESERVAS',
                    ventas: new Set() // Añadimos un Set para rastrear las ventas únicas
                };
            }
            // Solo incrementamos si esta venta no ha sido contada antes
            if (!acc[key].ventas.has(venta._id)) {
                acc[key].unidades += 1;
                // Para cambios, usar pagadoRecaudacion si está disponible (incluye signo negativo para devoluciones)
                const montoVenta = venta.tipo === 'CAMBIO' && (venta as any).pagadoRecaudacion !== undefined 
                    ? (venta as any).pagadoRecaudacion 
                    : venta.pagado;
                acc[key].total += montoVenta;
                acc[key].ventas.add(venta._id);
            }
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
                        categoria: categoria,
                        ventas: new Set() // Añadimos un Set para rastrear las ventas únicas
                    };
                }
                // Solo incrementamos si esta venta no ha sido contada antes para este producto
                if (!acc[key].ventas.has(venta._id)) {
                    acc[key].unidades += producto.cantidad;
                    acc[key].total += producto.total;
                    acc[key].ventas.add(venta._id);
                }
            });
        }
        return acc;
    }, {});

    console.log('Productos vendidos:', productosVendidos);

    // Convertir a array y ordenar por total
    const productosOrdenados = Object.values(productosVendidos)
        .filter((producto: any) => producto.nombre) // Filtrar productos sin nombre
        .map((producto: any) => {
            // Eliminamos el Set de ventas antes de ordenar
            const { ventas, ...productoSinVentas } = producto;
            return productoSinVentas;
        })
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

    // Calcular totales generales
    // Para cambios, usar pagadoRecaudacion si está disponible (incluye signo negativo para devoluciones)
    const totalGeneral = ventas.reduce((sum, v) => {
        if (v.tipo === 'CAMBIO' && (v as any).pagadoRecaudacion !== undefined) {
            return sum + (v as any).pagadoRecaudacion;
        }
        return sum + v.pagado;
    }, 0);
    const totalEfectivo = ventas.reduce((sum, v) => {
        const metodoPago = v.metodoPago || (v.pagos && v.pagos.length > 0 ? v.pagos[0].metodoPago : '');
        const monto = v.tipo === 'CAMBIO' && (v as any).pagadoRecaudacion !== undefined 
            ? (v as any).pagadoRecaudacion 
            : v.pagado;
        return sum + (metodoPago === 'EFECTIVO' || metodoPago === 'efectivo' ? monto : 0);
    }, 0);
    const totalTarjeta = ventas.reduce((sum, v) => {
        const metodoPago = v.metodoPago || (v.pagos && v.pagos.length > 0 ? v.pagos[0].metodoPago : '');
        const monto = v.tipo === 'CAMBIO' && (v as any).pagadoRecaudacion !== undefined 
            ? (v as any).pagadoRecaudacion 
            : v.pagado;
        return sum + (metodoPago === 'TARJETA' || metodoPago === 'tarjeta' ? monto : 0);
    }, 0);

    // No renderizar el PDF hasta que las categorías estén cargadas
    if (categorias.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Cargando categorías...</p>
            </div>
        );
    }

    return (
        <PDFViewer key={`pdf-detallado-${categorias.length}-${ventas.length}`} style={{ width: '100%', height: '100%', border: 'none' }}>
            <Document>
                <Page size="A4" style={styles.page}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Resumen Detallado de Ventas</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                        <Text>Período: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}</Text>
                    </View>

                    {/* Resumen General */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Resumen General del Período</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Recaudado:</Text>
                            <Text style={styles.summaryValue}>{totalGeneral.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Efectivo:</Text>
                            <Text style={styles.summaryValue}>{totalEfectivo.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Tarjeta:</Text>
                            <Text style={styles.summaryValue}>{totalTarjeta.toFixed(2)}€</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Ventas:</Text>
                            <Text style={styles.summaryValue}>{ventas.length}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Días con actividad:</Text>
                            <Text style={styles.summaryValue}>{ventasPorDia.length}</Text>
                        </View>
                    </View>

                    {/* Resumen por Día */}
                    {ventasPorDia.map((dia: any, diaIndex: number) => (
                        <View key={diaIndex} style={styles.section}>
                            <View style={styles.daySection}>
                                <Text style={styles.dayTitle}>
                                    {format(dia.fecha, 'EEEE, dd MMMM yyyy', { locale: es })}
                                </Text>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Total del día:</Text>
                                    <Text style={styles.summaryValue}>{dia.total.toFixed(2)}€</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Ventas realizadas:</Text>
                                    <Text style={styles.summaryValue}>{dia.cantidadVentas}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Efectivo:</Text>
                                    <Text style={styles.summaryValue}>{dia.metodoPago.efectivo.toFixed(2)}€</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Tarjeta:</Text>
                                    <Text style={styles.summaryValue}>{dia.metodoPago.tarjeta.toFixed(2)}€</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Trabajadores:</Text>
                                    <Text style={styles.summaryValue}>{dia.trabajadores.join(', ')}</Text>
                                </View>
                            </View>

                            {/* Detalle de ventas del día */}
                            <View style={styles.table}>
                                <View style={[styles.tableRow, styles.tableHeader]}>
                                    <View style={styles.tableColSmall}>
                                        <Text style={styles.tableCellSmall}>Hora</Text>
                                    </View>
                                    <View style={styles.tableColSmall}>
                                        <Text style={styles.tableCellSmall}>Tipo</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCellSmall}>Socio</Text>
                                    </View>
                                    <View style={styles.tableCol}>
                                        <Text style={styles.tableCellSmall}>Trabajador</Text>
                                    </View>
                                    <View style={styles.tableColSmall}>
                                        <Text style={styles.tableCellSmall}>Método</Text>
                                    </View>
                                    <View style={styles.tableColSmall}>
                                        <Text style={styles.tableCellSmall}>Total</Text>
                                    </View>
                                </View>
                                {dia.ventas.map((venta: any, ventaIndex: number) => {
                                    const fechaVenta = new Date(venta.fecha);
                                    const trabajadorNombre = venta.trabajador 
                                        ? `${venta.trabajador.nombre} (${venta.trabajador.identificador})`
                                        : venta.usuario.username;
                                    const metodoPago = venta.metodoPago || (venta.pagos && venta.pagos.length > 0 ? venta.pagos[0].metodoPago : 'Sin especificar');
                                    
                                    return (
                                        <View key={ventaIndex} style={styles.tableRow}>
                                            <View style={styles.tableColSmall}>
                                                <Text style={styles.tableCellSmall}>{format(fechaVenta, 'HH:mm')}</Text>
                                            </View>
                                            <View style={styles.tableColSmall}>
                                                <Text style={styles.tableCellSmall}>{venta.tipo}</Text>
                                            </View>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCellSmall}>{venta.socio.nombre} ({venta.socio.codigo})</Text>
                                            </View>
                                            <View style={styles.tableCol}>
                                                <Text style={styles.tableCellSmall}>{trabajadorNombre}</Text>
                                            </View>
                                            <View style={styles.tableColSmall}>
                                                <Text style={styles.tableCellSmall}>{metodoPago}</Text>
                                            </View>
                                            <View style={styles.tableColSmall}>
                                                <Text style={styles.tableCellSmall}>
                                                    {(venta.tipo === 'CAMBIO' && (venta as any).pagadoRecaudacion !== undefined
                                                        ? (venta as any).pagadoRecaudacion
                                                        : venta.pagado).toFixed(2)}€
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ))}

                    {/* Tabla de Productos por Categoría */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Resumen de Productos por Categoría</Text>
                        {Object.entries(productosPorCategoria)
                            .filter(([_, productos]) => productos.length > 0)
                            .map(([categoria, productos]) => (
                                <View key={categoria} style={{ marginBottom: 10 }}>
                                    <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 3 }}>{categoria}</Text>
                                    <View style={styles.table}>
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
                    </View>

                    <View style={styles.footer}>
                        <Text>Documento generado el {format(new Date(), 'dd/MM/yyyy HH:mm')}</Text>
                    </View>
                </Page>
            </Document>
        </PDFViewer>
    );
}; 