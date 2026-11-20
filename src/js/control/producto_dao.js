import { Producto } from '../entity/producto.js';
import { DefaultDAO } from './default_dao.js';

export class ProductoDAO extends DefaultDAO {
  constructor() { super('/api/v1/productos', Producto.fromJSON); }
}
