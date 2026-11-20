import { PagoDetalle } from './pago_detalle.js';

export class Pago {
  constructor({ idPago = null, idFactura = null, observaciones = null, detalles = [] } = {}) {
    Object.assign(this, { idPago, idFactura, observaciones, detalles: detalles.map(detail => PagoDetalle.fromJSON(detail)) });
  }
  static fromJSON(json = {}) { return new Pago(json); }
}
