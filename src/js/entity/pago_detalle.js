export class PagoDetalle {
  constructor({ tipoPago = 'EFECTIVO', monto = 0, referenciaExterna = null, observaciones = null } = {}) {
    if (!['EFECTIVO', 'TARJETA', 'QR'].includes(tipoPago)) throw new TypeError(`Tipo de pago no permitido: ${tipoPago}`);
    Object.assign(this, { tipoPago, monto: Number(monto), referenciaExterna, observaciones });
  }
  static fromJSON(json = {}) { return new PagoDetalle(json); }
}
