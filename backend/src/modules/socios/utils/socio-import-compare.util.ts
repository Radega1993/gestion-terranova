export interface SocioImportChange {
  field: string;
  from: string;
  to: string;
}

export interface SocioImportComparable {
  socio?: string;
  nombre?: {
    nombre?: string;
    primerApellido?: string;
    segundoApellido?: string;
  };
  direccion?: {
    calle?: string;
    numero?: string;
    piso?: string;
    poblacion?: string;
    cp?: string;
    provincia?: string;
  };
  contacto?: {
    telefonos?: string[];
    emails?: string[];
  };
  dni?: string;
  casa?: number;
  totalSocios?: number;
  menor3Años?: number;
  cuota?: number;
  banco?: {
    iban?: string;
    entidad?: string;
    oficina?: string;
    dc?: string;
    cuenta?: string;
  };
  notas?: string;
  observaciones?: string;
  fechaNacimiento?: Date | string | null;
  asociados?: Array<{
    codigo?: string;
    nombre?: string;
    primerApellido?: string;
    segundoApellido?: string;
    telefono?: string;
    email?: string;
    fechaNacimiento?: Date | string | null;
  }>;
}

function normStr(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normNum(value: unknown): string {
  if (value === undefined || value === null || value === '') return '0';
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '0';
}

function normDate(value: unknown): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(String(value));
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normList(values: unknown): string {
  if (!Array.isArray(values)) return '';
  return values
    .map((v) => normStr(v))
    .filter(Boolean)
    .join(' | ');
}

function asociadoNombre(a: {
  nombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
} | undefined): string {
  if (!a) return '';
  const parts = [a.nombre, a.primerApellido, a.segundoApellido]
    .map((p) => normStr(p))
    .filter(Boolean);
  if (a.primerApellido || a.segundoApellido) {
    return parts.join(' ').trim();
  }
  return normStr(a.nombre);
}

function normalizeAsociados(
  asociados: SocioImportComparable['asociados'] = [],
): Array<{ codigo: string; nombre: string; telefono: string; email: string; fechaNacimiento: string }> {
  return [...(asociados || [])]
    .map((a) => ({
      codigo: normStr(a.codigo),
      nombre: asociadoNombre(a),
      telefono: normStr(a.telefono),
      email: normStr(a.email),
      fechaNacimiento: normDate(a.fechaNacimiento),
    }))
    .filter((a) => a.codigo)
    .sort((a, b) => a.codigo.localeCompare(b.codigo, 'es'));
}

function pushIfDiff(
  changes: SocioImportChange[],
  field: string,
  from: string,
  to: string,
): void {
  if (from !== to) {
    changes.push({ field, from: from || '(vacío)', to: to || '(vacío)' });
  }
}

/**
 * Compara ficha importable Excel vs BD (sin foto/active/rgpd).
 * Devuelve lista de cambios legibles; vacía si son equivalentes.
 */
export function diffSocioImport(
  existing: SocioImportComparable,
  incoming: SocioImportComparable,
): SocioImportChange[] {
  const changes: SocioImportChange[] = [];

  pushIfDiff(
    changes,
    'Nombre',
    normStr(existing.nombre?.nombre),
    normStr(incoming.nombre?.nombre),
  );
  pushIfDiff(
    changes,
    'Primer apellido',
    normStr(existing.nombre?.primerApellido),
    normStr(incoming.nombre?.primerApellido),
  );
  pushIfDiff(
    changes,
    'Segundo apellido',
    normStr(existing.nombre?.segundoApellido),
    normStr(incoming.nombre?.segundoApellido),
  );

  pushIfDiff(changes, 'Calle', normStr(existing.direccion?.calle), normStr(incoming.direccion?.calle));
  pushIfDiff(changes, 'Número', normStr(existing.direccion?.numero), normStr(incoming.direccion?.numero));
  pushIfDiff(changes, 'Piso', normStr(existing.direccion?.piso), normStr(incoming.direccion?.piso));
  pushIfDiff(
    changes,
    'Población',
    normStr(existing.direccion?.poblacion),
    normStr(incoming.direccion?.poblacion),
  );
  pushIfDiff(changes, 'CP', normStr(existing.direccion?.cp), normStr(incoming.direccion?.cp));
  pushIfDiff(
    changes,
    'Provincia',
    normStr(existing.direccion?.provincia),
    normStr(incoming.direccion?.provincia),
  );

  pushIfDiff(
    changes,
    'Teléfonos',
    normList(existing.contacto?.telefonos),
    normList(incoming.contacto?.telefonos),
  );
  pushIfDiff(
    changes,
    'Emails',
    normList(existing.contacto?.emails),
    normList(incoming.contacto?.emails),
  );

  pushIfDiff(changes, 'DNI', normStr(existing.dni), normStr(incoming.dni));
  pushIfDiff(changes, 'Casa', normNum(existing.casa), normNum(incoming.casa));
  pushIfDiff(changes, 'Total socios', normNum(existing.totalSocios), normNum(incoming.totalSocios));
  pushIfDiff(changes, 'Menores 3 años', normNum(existing.menor3Años), normNum(incoming.menor3Años));
  pushIfDiff(changes, 'Cuota', normNum(existing.cuota), normNum(incoming.cuota));

  pushIfDiff(changes, 'IBAN', normStr(existing.banco?.iban), normStr(incoming.banco?.iban));
  pushIfDiff(changes, 'Entidad', normStr(existing.banco?.entidad), normStr(incoming.banco?.entidad));
  pushIfDiff(changes, 'Oficina', normStr(existing.banco?.oficina), normStr(incoming.banco?.oficina));
  pushIfDiff(changes, 'DC', normStr(existing.banco?.dc), normStr(incoming.banco?.dc));
  pushIfDiff(changes, 'Cuenta', normStr(existing.banco?.cuenta), normStr(incoming.banco?.cuenta));

  pushIfDiff(changes, 'Notas', normStr(existing.notas), normStr(incoming.notas));
  pushIfDiff(
    changes,
    'Observaciones',
    normStr(existing.observaciones),
    normStr(incoming.observaciones),
  );
  pushIfDiff(
    changes,
    'Fecha nacimiento',
    normDate(existing.fechaNacimiento),
    normDate(incoming.fechaNacimiento),
  );

  const existingAsoc = normalizeAsociados(existing.asociados);
  const incomingAsoc = normalizeAsociados(incoming.asociados);
  if (JSON.stringify(existingAsoc) !== JSON.stringify(incomingAsoc)) {
    changes.push({
      field: 'Asociados',
      from: existingAsoc.length
        ? existingAsoc.map((a) => `${a.codigo}: ${a.nombre}`).join('; ')
        : '(ninguno)',
      to: incomingAsoc.length
        ? incomingAsoc.map((a) => `${a.codigo}: ${a.nombre}`).join('; ')
        : '(ninguno)',
    });
  }

  return changes;
}

/** Payload de update a partir del Excel (sin active/rgpd/foto). */
export function buildSocioUpdatePayloadFromImport(incoming: SocioImportComparable): Record<string, unknown> {
  const asociados = (incoming.asociados || []).map((a) => {
    const nombre =
      a.primerApellido || a.segundoApellido
        ? [a.nombre, a.primerApellido, a.segundoApellido].map((p) => normStr(p)).filter(Boolean).join(' ')
        : normStr(a.nombre);
    return {
      codigo: normStr(a.codigo),
      nombre,
      telefono: normStr(a.telefono),
      fechaNacimiento: a.fechaNacimiento || undefined,
      foto: '',
    };
  });

  return {
    socio: incoming.socio,
    nombre: {
      nombre: normStr(incoming.nombre?.nombre),
      primerApellido: normStr(incoming.nombre?.primerApellido) || 'Sin Apellido',
      segundoApellido: normStr(incoming.nombre?.segundoApellido),
    },
    direccion: {
      calle: normStr(incoming.direccion?.calle) || 'Sin Calle',
      numero: normStr(incoming.direccion?.numero) || 'S/N',
      piso: normStr(incoming.direccion?.piso),
      poblacion: normStr(incoming.direccion?.poblacion) || 'Sin Población',
      cp: normStr(incoming.direccion?.cp),
      provincia: normStr(incoming.direccion?.provincia),
    },
    contacto: {
      telefonos: (incoming.contacto?.telefonos || []).map(normStr).filter(Boolean),
      emails: (incoming.contacto?.emails || []).map(normStr).filter(Boolean),
    },
    dni: normStr(incoming.dni),
    casa: Number(incoming.casa) || 1,
    totalSocios: Number(incoming.totalSocios) || 1,
    menor3Años: Number(incoming.menor3Años) || 0,
    cuota: Number(incoming.cuota) || 0,
    banco: {
      iban: normStr(incoming.banco?.iban),
      entidad: normStr(incoming.banco?.entidad),
      oficina: normStr(incoming.banco?.oficina),
      dc: normStr(incoming.banco?.dc),
      cuenta: normStr(incoming.banco?.cuenta),
    },
    notas: normStr(incoming.notas),
    observaciones: normStr(incoming.observaciones),
    fechaNacimiento: incoming.fechaNacimiento || undefined,
    asociados,
  };
}
