import { FacturaOrdenProducto } from './factura_orden_producto.js';

export class Factura {
  constructor({ idFactura = null, idOrden = null, idCaja = null, idEmpleadoRol = null, fechaCreacion = null, cliente = 'Cliente mostrador', estado = 'PENDIENTE', detalle = [], productos = [], total = null, pagos = [], pago = null } = {}) {
    const rawLines = Array.isArray(productos) && productos.length ? productos : Array.isArray(detalle) ? detalle : [];
    const mapped = rawLines.map(line => FacturaOrdenProducto.fromJSON(line));
    const calculated = mapped.reduce((sum, line) => sum + line.precio * line.cantidad, 0);
    Object.assign(this, { idFactura, idOrden, idCaja, idEmpleadoRol, fechaCreacion, cliente, estado, detalle: mapped, productos: mapped, total: Number(total ?? calculated), pagos, pago });
  }
  static fromJSON(json = {}) {
    return new Factura({ ...json, idFactura: json.idFactura ?? json.id, cliente: json.cliente ?? json.nombreCliente, estado: json.estado ?? json.status ?? 'PENDIENTE', detalle: json.detalle ?? json.detalles ?? json.lineas ?? json.facturaOrdenProductos ?? [], productos: json.productos ?? [], total: json.total ?? json.montoTotal ?? json.totalFactura, pagos: json.pagos ?? [], pago: json.pago ?? null });
  }
}
