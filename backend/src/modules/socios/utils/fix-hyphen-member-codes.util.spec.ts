import {
  buildAsociadoFromBogusSocio,
  parseHyphenMemberCode,
  toUnderscoreMemberCode,
} from './fix-hyphen-member-codes.util';

describe('fix-hyphen-member-codes.util', () => {
  describe('parseHyphenMemberCode', () => {
    it('parsea AET010-01', () => {
      expect(parseHyphenMemberCode('AET010-01')).toEqual({
        original: 'AET010-01',
        parent: 'AET010',
        corrected: 'AET010_01',
        suffix: '01',
      });
    });

    it('devuelve null para códigos correctos o SOC_', () => {
      expect(parseHyphenMemberCode('AET010_01')).toBeNull();
      expect(parseHyphenMemberCode('AET010')).toBeNull();
      expect(parseHyphenMemberCode('SOC_123')).toBeNull();
      expect(parseHyphenMemberCode('')).toBeNull();
      expect(parseHyphenMemberCode(null)).toBeNull();
    });
  });

  describe('toUnderscoreMemberCode', () => {
    it('convierte guión a underscore', () => {
      expect(toUnderscoreMemberCode('AET009-02')).toBe('AET009_02');
    });
  });

  describe('buildAsociadoFromBogusSocio', () => {
    it('compone nombre y teléfono desde el socio erróneo', () => {
      const asociado = buildAsociadoFromBogusSocio({
        socio: 'AET010-01',
        nombre: { nombre: 'Pepe', primerApellido: 'Lopez', segundoApellido: '' },
        contacto: { telefonos: ['600111222'], emails: [] },
        foto: 'x.jpg',
      });
      expect(asociado).toMatchObject({
        codigo: 'AET010_01',
        nombre: 'Pepe Lopez',
        telefono: '600111222',
        foto: 'x.jpg',
      });
    });
  });
});
