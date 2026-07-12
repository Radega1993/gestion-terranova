import { normalizeSocioUpdatePayload } from './socios.service';

describe('normalizeSocioUpdatePayload', () => {
  it('convierte el payload del formulario de edición al shape esperado por el backend', () => {
    const payload = {
      nombre: {
        nombre: 'Ana',
        primerApellido: 'López',
        segundoApellido: 'Ruiz'
      },
      socio: 'AET001',
      contacto: {
        telefonos: ['600123456'],
        email: ['ana@test.com']
      },
      direccion: {
        calle: 'Calle Mayor',
        numero: '10',
        poblacion: 'Madrid',
        cp: '28001',
        provincia: 'Madrid'
      },
      cuota: 10,
      casa: 1,
      totalSocios: 1,
      active: true
    };

    const normalized = normalizeSocioUpdatePayload(payload);

    expect(normalized.contacto).toEqual({
      telefonos: ['600123456'],
      emails: ['ana@test.com']
    });
    expect(normalized.contacto.email).toBeUndefined();
  });

  it('preserva emails ya normalizados y limpia datos vacíos', () => {
    const payload = {
      nombre: {
        nombre: 'Juan',
        primerApellido: 'García'
      },
      contacto: {
        telefonos: ['600000000'],
        emails: ['juan@test.com', ''],
        email: ['juan@test.com']
      },
      asociados: [{ nombre: 'Pepe', codigo: 'AET001-1' }, { nombre: '' }]
    };

    const normalized = normalizeSocioUpdatePayload(payload);

    expect(normalized.contacto.emails).toEqual(['juan@test.com']);
    expect(normalized.asociados).toHaveLength(1);
    expect(normalized.asociados[0]).toMatchObject({ nombre: 'Pepe', codigo: 'AET001-1' });
  });
});
