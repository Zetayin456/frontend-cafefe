import { TipoProducto } from '../entity/tipo_producto.js';
import { DefaultDAO } from './default_dao.js';

export class TipoProductoDAO extends DefaultDAO {
  constructor() { super('/v1/tipos-producto', TipoProducto.fromJSON); }
}
