import mongoose, { connect } from 'mongoose';
import { config } from 'dotenv';

import { roundMoney, ventaEstadoFromPagado, isVentaFullyPaid } from '../common/money';

config();

const dryRun = process.argv.includes('--dry-run');

async function normalizeVentasMoney() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-terranova';
    await connect(uri);

    const coll = mongoose.connection.db.collection('ventas');
    const cursor = coll.find({});

    let scanned = 0;
    let wouldUpdate = 0;
    let updated = 0;
    let flaggedPagos = 0;
    let flaggedTotalLines = 0;

    for await (const doc of cursor) {
        scanned++;
        const productos = Array.isArray(doc.productos) ? doc.productos : [];
        const newProductos = productos.map((p: Record<string, unknown>) => ({
            ...p,
            precioUnitario: roundMoney(Number(p.precioUnitario) || 0),
            precioTotal: roundMoney(Number(p.precioTotal) || 0),
        }));

        const pagos = Array.isArray(doc.pagos) ? doc.pagos : [];
        const newPagos = pagos.map((p: Record<string, unknown>) => ({
            ...p,
            monto: roundMoney(Number(p.monto) || 0),
        }));

        let total = roundMoney(Number(doc.total) || 0);
        let pagado = roundMoney(Number(doc.pagado) || 0);

        const totalFromLines = roundMoney(
            newProductos.reduce((s: number, p: { precioTotal: number }) => s + p.precioTotal, 0),
        );
        if (Math.abs(totalFromLines - total) > 0.01) {
            console.warn(
                `[revisar] venta ${doc._id} total=${total} suma líneas redondeadas=${totalFromLines}`,
            );
            flaggedTotalLines++;
        }

        const sumPagos = roundMoney(newPagos.reduce((s: number, p: { monto: number }) => s + p.monto, 0));
        if (newPagos.length > 0 && Math.abs(sumPagos - pagado) > 0.01) {
            console.warn(
                `[revisar] venta ${doc._id} pagado=${pagado} sum(pagos)=${sumPagos} (diff > 0.01)`,
            );
            flaggedPagos++;
        } else if (newPagos.length > 0) {
            pagado = sumPagos;
        }

        if (isVentaFullyPaid(total, pagado)) {
            pagado = total;
        }

        const estado = ventaEstadoFromPagado(total, pagado);

        const productosChanged = JSON.stringify(newProductos) !== JSON.stringify(productos);
        const pagosChanged = JSON.stringify(newPagos) !== JSON.stringify(pagos);
        const origTotal = roundMoney(Number(doc.total) || 0);
        const origPagado = roundMoney(Number(doc.pagado) || 0);
        const totalsChanged =
            total !== origTotal || pagado !== origPagado || estado !== doc.estado;

        const changed = productosChanged || pagosChanged || totalsChanged;

        if (!changed) {
            continue;
        }

        wouldUpdate++;
        if (dryRun) {
            continue;
        }

        await coll.updateOne(
            { _id: doc._id },
            { $set: { productos: newProductos, pagos: newPagos, total, pagado, estado } },
        );
        updated++;
    }

    console.log(
        JSON.stringify(
            {
                scanned,
                wouldChange: wouldUpdate,
                updated: dryRun ? 0 : updated,
                dryRun,
                flaggedPagosMismatch: flaggedPagos,
                flaggedTotalVsLines: flaggedTotalLines,
            },
            null,
            2,
        ),
    );

    await mongoose.connection.close();
}

normalizeVentasMoney().catch((err) => {
    console.error(err);
    process.exit(1);
});
