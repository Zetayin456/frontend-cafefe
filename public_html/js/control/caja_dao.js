import { Caja } from '../entity/caja.js';
import { DefaultDAO } from './default_dao.js';

export class CajaDAO extends DefaultDAO {
  constructor() { super('/v1/cajas', Caja.fromJSON); }
}
