const STORAGE_KEY = 'cafefe-ordenes-despachadas';

export class OrdenDespachoStore {
  constructor(storage = null) {
    this.storage = storage;
    this.memory = new Set();
  }

  getReadyOrderIds() {
    try {
      const storage = this.storage || globalThis.localStorage;
      const value = storage.getItem(STORAGE_KEY);
      if (value !== null) {
        const ids = JSON.parse(value);
        if (Array.isArray(ids)) {
          this.memory = new Set(ids.filter(id => typeof id === 'string' && id.trim()));
          return new Set(this.memory);
        }
      }
    } catch { /* Si el almacenamiento no está disponible, se usa el estado en memoria. */ }
    return new Set(this.memory);
  }

  setReady(idOrden, ready) {
    const id = String(idOrden ?? '').trim();
    if (!id) throw new TypeError('Se requiere el id de la orden para guardar su despacho.');

    const ids = this.getReadyOrderIds();
    if (ready) ids.add(id);
    else ids.delete(id);
    this.memory = ids;

    try {
      const storage = this.storage || globalThis.localStorage;
      storage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch { /* Mantiene el cambio en memoria si localStorage está bloqueado. */ }
    return Boolean(ready);
  }
}

export { STORAGE_KEY as ORDEN_DESPACHO_STORAGE_KEY };
