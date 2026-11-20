export class Caja {
  constructor({ idCaja = null, nombre = '', activo = false, observaciones = null } = {}) { Object.assign(this, { idCaja, nombre, activo, observaciones }); }
  static fromJSON(json = {}) { return new Caja(json); }
}
