import { Orden } from '../entity/orden.js';
import { DefaultDAO } from './default_dao.js';

export class OrdenDAO extends DefaultDAO {
  constructor() { super('/orden', Orden.fromJSON); }
  async findPending() { const data = await this.get('/orden/pendientes'); return Array.isArray(data) ? data.map(Orden.fromJSON) : []; }
  async create(order) {
    const body = {
      cliente: order.cliente,
      productos: order.productos.map(line => ({ idProducto: line.idProducto, cantidad: line.cantidad, observaciones: line.observaciones ?? null }))
    };
    return Orden.fromJSON(await this.post(this.endpoint, body));
  }
}
