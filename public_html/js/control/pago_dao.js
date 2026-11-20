import { Pago } from '../entity/pago.js';
import { DefaultDAO } from './default_dao.js';

export class PagoDAO extends DefaultDAO {
  constructor() { super('/api/pago', Pago.fromJSON); }
  async create(pago) { return Pago.fromJSON(await this.post(this.endpoint, pago)); }
}
