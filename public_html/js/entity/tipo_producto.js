export class TipoProducto {
  constructor({ idTipoProducto = null, nombre = '', activo = false, observaciones = null } = {}) { Object.assign(this, { idTipoProducto, nombre, activo, observaciones }); }
  static fromJSON(json = {}) { return new TipoProducto(json); }
}
