import {
  buildSocioUpdatePayloadFromImport,
  diffSocioImport,
} from './socio-import-compare.util';

describe('diffSocioImport', () => {
  const base = {
    socio: 'AET001',
    nombre: { nombre: 'Juan', primerApellido: 'Garcia', segundoApellido: '' },
    direccion: {
      calle: 'Calle Mayor',
      numero: '1',
      piso: '',
      poblacion: 'Madrid',
      cp: '28001',
      provincia: 'Madrid',
    },
    contacto: { telefonos: ['600111222'], emails: ['juan@test.com'] },
    dni: '12345678A',
    casa: 1,
    totalSocios: 1,
    menor3Años: 0,
    cuota: 10,
    banco: { iban: 'ES00', entidad: '', oficina: '', dc: '', cuenta: '' },
    notas: '',
    observaciones: '',
    fechaNacimiento: new Date('1990-01-15'),
    asociados: [] as any[],
  };

  it('devuelve sin cambios si los datos son equivalentes', () => {
    const incoming = {
      ...base,
      contacto: { telefonos: ['600111222'], emails: ['juan@test.com'] },
      fechaNacimiento: '1990-01-15T00:00:00.000Z',
    };
    expect(diffSocioImport(base, incoming)).toEqual([]);
  });

  it('ignora diferencias solo de acentos', () => {
    const existing = {
      ...base,
      nombre: { nombre: 'José', primerApellido: 'López', segundoApellido: '' },
    };
    const incoming = {
      ...base,
      nombre: { nombre: 'Jose', primerApellido: 'Lopez', segundoApellido: '' },
    };
    expect(diffSocioImport(existing, incoming)).toEqual([]);
  });

  it('detecta cambio de teléfono', () => {
    const incoming = {
      ...base,
      contacto: { telefonos: ['699000111'], emails: ['juan@test.com'] },
    };
    const changes = diffSocioImport(base, incoming);
    expect(changes).toEqual([
      { field: 'Teléfonos', from: '600111222', to: '699000111' },
    ]);
  });

  it('detecta cambio de nombre', () => {
    const incoming = {
      ...base,
      nombre: { nombre: 'Joan', primerApellido: 'Garcia', segundoApellido: '' },
    };
    const changes = diffSocioImport(base, incoming);
    expect(changes.some((c) => c.field === 'Nombre' && c.to === 'Joan')).toBe(true);
  });

  it('detecta asociados distintos', () => {
    const existing = {
      ...base,
      asociados: [{ codigo: 'AET001_01', nombre: 'Pepe', telefono: '600', fechaNacimiento: null }],
    };
    const incoming = {
      ...base,
      asociados: [
        {
          codigo: 'AET001_01',
          nombre: 'Pedro',
          primerApellido: '',
          segundoApellido: '',
          telefono: '600',
          fechaNacimiento: null,
        },
      ],
    };
    const changes = diffSocioImport(existing, incoming);
    expect(changes.some((c) => c.field === 'Asociados')).toBe(true);
  });
});

describe('buildSocioUpdatePayloadFromImport', () => {
  it('no incluye active ni rgpd y normaliza asociados', () => {
    const payload = buildSocioUpdatePayloadFromImport({
      socio: 'AET002',
      nombre: { nombre: 'Ana', primerApellido: 'Ruiz', segundoApellido: '' },
      direccion: { calle: 'X', numero: '2', poblacion: 'Y' },
      contacto: { telefonos: ['600'], emails: ['a@b.com'] },
      casa: 1,
      totalSocios: 2,
      cuota: 5,
      asociados: [
        {
          codigo: 'AET002_01',
          nombre: 'Luis',
          primerApellido: 'Ruiz',
          segundoApellido: '',
          telefono: '601',
        },
      ],
    });

    expect(payload.active).toBeUndefined();
    expect(payload.rgpd).toBeUndefined();
    expect(payload.asociados).toEqual([
      expect.objectContaining({
        codigo: 'AET002_01',
        nombre: 'Luis Ruiz',
        telefono: '601',
      }),
    ]);
  });
});
