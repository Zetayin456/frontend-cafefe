import { OrdenProducto } from './orden_producto.js';

export class Orden {
  constructor({ idOrden = null, fechaCreacion = null, cliente = 'Cliente mostrador', productos = [], estado = 'PENDIENTE_COCINA', total = null, detalles = null, lineas = null } = {}) {
    const rawLines = Array.isArray(productos) && productos.length ? productos : Array.isArray(detalles) ? detalles : Array.isArray(lineas) ? lineas : [];
    const mapped = rawLines.map(line => OrdenProducto.fromJSON(line));
    const calculated = mapped.reduce((sum, line) => sum + line.precio * line.cantidad, 0);
    Object.assign(this, { idOrden, fechaCreacion, cliente, productos: mapped, estado, total: Number(total ?? calculated) });
  }
  static fromJSON(json = {}) {
    return new Orden({ ...json, idOrden: json.idOrden ?? json.id, cliente: json.cliente ?? json.nombreCliente, productos: json.productos ?? json.detalles ?? json.detalle ?? json.lineas ?? json.ordenProductos ?? [], estado: json.estado ?? json.status ?? 'PENDIENTE_COCINA', total: json.total ?? json.montoTotal ?? json.totalFactura });
  }
}
