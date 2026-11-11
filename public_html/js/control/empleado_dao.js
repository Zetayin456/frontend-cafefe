import { Empleado } from '../entity/empleado.js';
import { DefaultDAO } from './default_dao.js';

export class EmpleadoDAO extends DefaultDAO {
  constructor() { super('/empleado/login', Empleado.fromJSON); }
  async login(nombre, contrasena) { return this.mapper(await this.post(this.endpoint, { nombre, contrasena })); }
}
