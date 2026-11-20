import { OrdenProducto } from './orden_producto.js';

export class FacturaOrdenProducto extends OrdenProducto {
  constructor(json = {}) { super(json); this.idFacturaOrdenProducto = json.idFacturaOrdenProducto ?? null; }
  static fromJSON(json = {}) { return new FacturaOrdenProducto(json); }
}
