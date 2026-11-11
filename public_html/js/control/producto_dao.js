import { Producto } from '../entity/producto.js';
import { DefaultDAO } from './default_dao.js';

export class ProductoDAO extends DefaultDAO {
  constructor() { super('/v1/productos', Producto.fromJSON); }
}
