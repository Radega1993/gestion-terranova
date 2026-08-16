import mongoose, { connect } from 'mongoose';
import { config } from 'dotenv';

import {
  buildAsociadoFromBogusSocio,
  HYPHEN_MEMBER_CODE_RE,
  parseHyphenMemberCode,
} from '../modules/socios/utils/fix-hyphen-member-codes.util';

config();

const apply = process.argv.includes('--apply');
const dryRun = !apply;

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestion-terranova';
  await connect(uri);

  const socios = mongoose.connection.db.collection('socios');
  const ventas = mongoose.connection.db.collection('ventas');
  const reservas = mongoose.connection.db.collection('reservas');
  const invitaciones = mongoose.connection.db.collection('invitacions');
  const socioInvitaciones = mongoose.connection.db.collection('socioinvitaciones');

  const bogusSocios = await socios.find({ socio: { $regex: HYPHEN_MEMBER_CODE_RE } }).toArray();
  console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'APPLY'} | Socios con guión: ${bogusSocios.length}`);

  const migrated: any[] = [];
  const errors: any[] = [];
  let asociadosFixed = 0;
  let ventasOrphanFixed = 0;

  for (const bogus of bogusSocios) {
    const parsed = parseHyphenMemberCode(bogus.socio);
    if (!parsed) continue;

    const parent = await socios.findOne({ socio: parsed.parent });
    if (!parent) {
      errors.push({ code: parsed.original, error: `No existe el socio padre ${parsed.parent}` });
      console.warn(`ERROR ${parsed.original}: sin padre ${parsed.parent}`);
      continue;
    }

    const ventasCount = await ventas.countDocuments({ codigoSocio: parsed.original });
    const reservasCount = await reservas.countDocuments({ socio: bogus._id });
    const invitacionesCount =
      (await invitaciones.countDocuments({ socio: bogus._id })) +
      (await socioInvitaciones.countDocuments({ socio: bogus._id }));

    migrated.push({
      from: parsed.original,
      to: parsed.corrected,
      parent: parsed.parent,
      ventas: ventasCount,
      reservas: reservasCount,
      invitaciones: invitacionesCount,
    });
    console.log(
      `${dryRun ? '[dry]' : '[apply]'} ${parsed.original} → ${parsed.corrected} (padre ${parsed.parent}) ` +
        `ventas=${ventasCount} reservas=${reservasCount} invitaciones=${invitacionesCount}`,
    );

    if (dryRun) continue;

    const asociados = Array.isArray(parent.asociados) ? [...parent.asociados] : [];
    if (!asociados.some((a: any) => a.codigo === parsed.corrected)) {
      asociados.push(buildAsociadoFromBogusSocio(bogus as any));
      await socios.updateOne({ _id: parent._id }, { $set: { asociados } });
    }

    if (ventasCount > 0) {
      await ventas.updateMany(
        { codigoSocio: parsed.original },
        { $set: { codigoSocio: parsed.corrected } },
      );
    }
    if (reservasCount > 0) {
      await reservas.updateMany({ socio: bogus._id }, { $set: { socio: parent._id } });
    }
    if (invitacionesCount > 0) {
      await invitaciones.updateMany({ socio: bogus._id }, { $set: { socio: parent._id } });
      await socioInvitaciones.updateMany({ socio: bogus._id }, { $set: { socio: parent._id } });
    }

    await socios.deleteOne({ _id: bogus._id });
  }

  const withHyphenAsoc = await socios
    .find({ 'asociados.codigo': { $regex: HYPHEN_MEMBER_CODE_RE } })
    .toArray();
  for (const socio of withHyphenAsoc) {
    let changed = false;
    const asociados = (socio.asociados || []).map((a: any) => {
      const p = parseHyphenMemberCode(a.codigo);
      if (!p) return a;
      changed = true;
      asociadosFixed += 1;
      return { ...a, codigo: p.corrected };
    });
    if (changed && !dryRun) {
      await socios.updateOne({ _id: socio._id }, { $set: { asociados } });
    }
  }

  const orphanVentas = await ventas
    .find({ codigoSocio: { $regex: HYPHEN_MEMBER_CODE_RE } })
    .project({ _id: 1, codigoSocio: 1 })
    .toArray();
  for (const venta of orphanVentas) {
    const p = parseHyphenMemberCode(venta.codigoSocio);
    if (!p) continue;
    ventasOrphanFixed += 1;
    if (!dryRun) {
      await ventas.updateOne({ _id: venta._id }, { $set: { codigoSocio: p.corrected } });
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        scanned: bogusSocios.length,
        migrated,
        asociadosFixed,
        ventasOrphanFixed,
        errors,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
