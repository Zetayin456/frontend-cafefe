export class Producto {
  constructor({ idProducto = null, nombre = '', precioSugerido = 0, activo = false, comentarios = null, idTipoProducto = null, tipoProducto = null } = {}) {
    Object.assign(this, { idProducto, nombre, precioSugerido: Number(precioSugerido) || 0, activo, comentarios, idTipoProducto: idTipoProducto ?? tipoProducto?.idTipoProducto ?? null, tipoProducto });
  }
  static fromJSON(json = {}) { return new Producto(json); }
}
