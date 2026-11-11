export class EmpleadoRol {
  constructor({ idEmpleadoRol = null, idRol = null, nombre = '' } = {}) { Object.assign(this, { idEmpleadoRol, idRol, nombre }); }
  static fromJSON(json = {}) { return new EmpleadoRol(json); }
}
