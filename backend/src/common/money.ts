/** Redondeo a 2 decimales (céntimos) para importes en euros. */
export function roundMoney(n: number): number {
  return Math.round(Number(n) * 100) / 100;
}

/** True si el importe abonado cubre el total (comparación por céntimos). */
export function isVentaFullyPaid(total: number, pagado: number): boolean {
  const t = Math.round(roundMoney(total) * 100);
  const p = Math.round(roundMoney(pagado) * 100);
  return p >= t;
}

export type VentaEstadoPago = 'PENDIENTE' | 'PAGADO_PARCIAL' | 'PAGADO';

export function ventaEstadoFromPagado(total: number, pagado: number): VentaEstadoPago {
  const p = roundMoney(pagado);
  if (isVentaFullyPaid(total, p)) {
    return 'PAGADO';
  }
  if (p > 0) {
    return 'PAGADO_PARCIAL';
  }
  return 'PENDIENTE';
}

/** Monto efectivo de una fila de recaudaciones (venta positiva o movimiento negativo). */
export function montoRecaudacion(rec: {
  tipo: string;
  pagado: number;
  pagadoRecaudacion?: number;
}): number {
  if (
    (rec.tipo === 'CAMBIO' || rec.tipo === 'DEVOLUCION') &&
    rec.pagadoRecaudacion !== undefined
  ) {
    return rec.pagadoRecaudacion;
  }
  return typeof rec.pagado === 'number' ? rec.pagado : 0;
}
