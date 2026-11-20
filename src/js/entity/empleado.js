import { EmpleadoRol } from './empleado_rol.js';

export class Empleado {
  constructor({ idEmpleado = null, nombre = '', apellido = '', activo = false, roles = [] } = {}) {
    Object.assign(this, { idEmpleado, nombre, apellido, activo, roles: roles.map(role => EmpleadoRol.fromJSON(role)) });
  }
  static fromJSON(json = {}) { return new Empleado(json); }
}
