import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
    page: {
        padding: 24,
        fontSize: 10,
    },
    header: {
        marginBottom: 12,
        textAlign: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 4,
    },
    table: {
        display: 'flex',
        width: '100%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        marginTop: 8,
    },
    row: {
        flexDirection: 'row',
    },
    colFecha: {
        width: '15%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 4,
    },
    colSocio: {
        width: '15%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 4,
    },
    colNombre: {
        width: '23%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 4,
    },
    colInvitado: {
        width: '22%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 4,
    },
    colUsuario: {
        width: '15%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 4,
    },
    colObs: {
        width: '10%',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        padding: 4,
    },
    headerCell: {
        fontWeight: 'bold',
        backgroundColor: '#f0f0f0',
    },
    footer: {
        marginTop: 10,
        textAlign: 'right',
        fontSize: 11,
        fontWeight: 'bold',
    },
});

interface InvitacionPeriodoItem {
    fechaUso: string;
    socioCodigo: string;
    socioNombre: string;
    nombreInvitado: string;
    registradoPor: string;
    observaciones?: string;
}

interface InvitacionesPeriodoPDFProps {
    fechaInicio: Date;
    fechaFin: Date;
    invitaciones: InvitacionPeriodoItem[];
}

export const InvitacionesPeriodoPDF: React.FC<InvitacionesPeriodoPDFProps> = ({
    fechaInicio,
    fechaFin,
    invitaciones,
}) => {
    const sorted = [...invitaciones].sort(
        (a, b) => new Date(b.fechaUso).getTime() - new Date(a.fechaUso).getTime(),
    );

    return (
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <Document>
                <Page size="A4" style={styles.page} orientation="landscape">
                    <View style={styles.header}>
                        <Text style={styles.title}>Resumen de invitaciones por período</Text>
                        <Text style={styles.subtitle}>Comunidad de Vecinos Terranova</Text>
                        <Text>
                            Período: {format(fechaInicio, 'dd/MM/yyyy')} - {format(fechaFin, 'dd/MM/yyyy')}
                        </Text>
                    </View>

                    <View style={styles.table}>
                        <View style={styles.row}>
                            <Text style={[styles.colFecha, styles.headerCell]}>Fecha</Text>
                            <Text style={[styles.colSocio, styles.headerCell]}>Código socio</Text>
                            <Text style={[styles.colNombre, styles.headerCell]}>Nombre socio</Text>
                            <Text style={[styles.colInvitado, styles.headerCell]}>Invitado</Text>
                            <Text style={[styles.colUsuario, styles.headerCell]}>Registrado por</Text>
                            <Text style={[styles.colObs, styles.headerCell]}>Obs.</Text>
                        </View>
                        {sorted.map((inv, idx) => (
                            <View style={styles.row} key={`${inv.fechaUso}-${inv.socioCodigo}-${idx}`}>
                                <Text style={styles.colFecha}>{format(new Date(inv.fechaUso), 'dd/MM/yyyy')}</Text>
                                <Text style={styles.colSocio}>{inv.socioCodigo}</Text>
                                <Text style={styles.colNombre}>{inv.socioNombre}</Text>
                                <Text style={styles.colInvitado}>{inv.nombreInvitado}</Text>
                                <Text style={styles.colUsuario}>{inv.registradoPor}</Text>
                                <Text style={styles.colObs}>{inv.observaciones || '-'}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.footer}>Total invitaciones: {sorted.length}</Text>
                </Page>
            </Document>
        </PDFViewer>
    );
};

