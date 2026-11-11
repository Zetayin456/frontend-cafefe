import { Factura } from '../entity/factura.js';
import { DefaultDAO } from './default_dao.js';

export class FacturaDAO extends DefaultDAO {
  constructor() { super('/factura', Factura.fromJSON); }
  async findPending() { const data = await this.get('/factura/pendientes'); return Array.isArray(data) ? data.map(Factura.fromJSON) : []; }
  async findById(idFactura) { return Factura.fromJSON(await this.get(`${this.endpoint}/${encodeURIComponent(idFactura)}`)); }
  async create(factura) { return Factura.fromJSON(await this.post(this.endpoint, factura)); }
}
