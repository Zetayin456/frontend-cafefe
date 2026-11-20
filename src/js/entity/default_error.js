export class DefaultError {
  constructor({ error = 'Error', mensaje = '', status = 0, detalle = null } = {}) {
    this.error = error;
    this.mensaje = mensaje;
    this.status = status;
    this.detalle = detalle;
    this.message = mensaje || error;
  }
}
