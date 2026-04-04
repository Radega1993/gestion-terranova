import { roundMoney, isVentaFullyPaid, ventaEstadoFromPagado } from './money';

describe('money', () => {
  describe('roundMoney', () => {
    it('redondea a 2 decimales', () => {
      expect(roundMoney(3.906)).toBe(3.91);
      expect(roundMoney(3.904)).toBe(3.9);
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    });
  });

  describe('isVentaFullyPaid', () => {
    it('considera pagado cuando los céntimos coinciden a pesar de float', () => {
      expect(isVentaFullyPaid(3.9, 3.899999999999999)).toBe(true);
    });

    it('no marca pagado si falta al menos un céntimo', () => {
      expect(isVentaFullyPaid(3.9, 3.89)).toBe(false);
    });

    it('permite pago por encima del total', () => {
      expect(isVentaFullyPaid(3.9, 4)).toBe(true);
    });
  });

  describe('ventaEstadoFromPagado', () => {
    it('PAGADO cuando isVentaFullyPaid', () => {
      expect(ventaEstadoFromPagado(10, 10)).toBe('PAGADO');
      expect(ventaEstadoFromPagado(10, 10.001)).toBe('PAGADO');
    });

    it('PAGADO_PARCIAL con abono intermedio', () => {
      expect(ventaEstadoFromPagado(10, 5)).toBe('PAGADO_PARCIAL');
    });

    it('PENDIENTE sin abono', () => {
      expect(ventaEstadoFromPagado(10, 0)).toBe('PENDIENTE');
    });
  });
});
