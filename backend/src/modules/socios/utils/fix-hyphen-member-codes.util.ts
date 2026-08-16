/** Código miembro erróneo: PREFIJO-NN (ej. AET010-01) */
export const HYPHEN_MEMBER_CODE_RE = /^([A-Za-z]+\d+)-(\d+)$/;

export interface ParsedHyphenMemberCode {
  original: string;
  parent: string;
  corrected: string;
  suffix: string;
}

export function parseHyphenMemberCode(code: string | null | undefined): ParsedHyphenMemberCode | null {
  if (!code || typeof code !== 'string') return null;
  const trimmed = code.trim();
  const match = trimmed.match(HYPHEN_MEMBER_CODE_RE);
  if (!match) return null;
  const parent = match[1];
  const suffix = match[2];
  return {
    original: trimmed,
    parent,
    corrected: `${parent}_${suffix}`,
    suffix,
  };
}

export function toUnderscoreMemberCode(code: string): string | null {
  const parsed = parseHyphenMemberCode(code);
  return parsed ? parsed.corrected : null;
}

export function buildAsociadoFromBogusSocio(bogus: {
  socio?: string;
  nombre?: { nombre?: string; primerApellido?: string; segundoApellido?: string } | string;
  contacto?: { telefonos?: string[]; emails?: string[] };
  fechaNacimiento?: Date | string | null;
  foto?: string;
}): {
  codigo: string;
  nombre: string;
  telefono: string;
  fechaNacimiento?: Date;
  foto: string;
} {
  const parsed = parseHyphenMemberCode(bogus.socio || '');
  const codigo = parsed?.corrected || (bogus.socio || '').replace('-', '_');

  let nombre = '';
  if (typeof bogus.nombre === 'string') {
    nombre = bogus.nombre.trim();
  } else if (bogus.nombre && typeof bogus.nombre === 'object') {
    nombre = [bogus.nombre.nombre, bogus.nombre.primerApellido, bogus.nombre.segundoApellido]
      .map((p) => (p || '').trim())
      .filter(Boolean)
      .join(' ');
  }

  const telefono = bogus.contacto?.telefonos?.[0] || '';
  const fechaNacimiento = bogus.fechaNacimiento
    ? new Date(bogus.fechaNacimiento)
    : undefined;

  return {
    codigo,
    nombre: nombre || codigo,
    telefono,
    ...(fechaNacimiento && !isNaN(fechaNacimiento.getTime()) ? { fechaNacimiento } : {}),
    foto: bogus.foto || '',
  };
}
