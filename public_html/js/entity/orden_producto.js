export class OrdenProducto {
  constructor({ idProducto = null, producto = null, nombreProducto = '', cantidad = 1, precio = null, observaciones = null } = {}) {
    Object.assign(this, { idProducto: idProducto ?? producto?.idProducto ?? null, producto, nombreProducto: nombreProducto || producto?.nombre || '', cantidad: Number(cantidad) || 1, precio: Number(precio ?? producto?.precioSugerido) || 0, observaciones });
  }
  static fromJSON(json = {}) { return new OrdenProducto(json); }
}
