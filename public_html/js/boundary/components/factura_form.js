import { emit, escapeHTML, productName } from '../boundary_utils.js';

export class FacturaForm extends HTMLElement {
  set controller(value) { this._controller = value; }
  set context(value) { this.order = value.order; this.employeeRoleId = value.employeeRoleId; this.productsById = value.productsById || new Map(); if (this.isConnected) this.loadBoxes(); }
  async connectedCallback() { this.renderLoading(); await this.loadBoxes(); }
  renderLoading() { this.innerHTML = '<section class="panel"><p>Cargando cajas activas…</p></section>'; }
  async loadBoxes() {
    if (!this.order) return;
    try { this.boxes = await this._controller.cargarCajasActivas(); this.render(); }
    catch (error) { this.innerHTML = `<div class="empty" role="alert">No se pudieron cargar cajas: ${escapeHTML(error.message)}</div>`; }
  }
  render() {
    this.innerHTML = `<section class="panel"><span class="eyebrow">Nueva factura</span><h2>Orden #${escapeHTML(this.order.idOrden)} · ${escapeHTML(this.order.cliente)}</h2><div class="invoice-order-lines">${(this.order.productos || []).map(item => `<div class="list-row"><span>${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this.productsById))}${item.observaciones ? ` · ${escapeHTML(item.observaciones)}` : ''}</span></div>`).join('')}</div><form><div class="field"><label for="invoice-customer">Cliente</label><input id="invoice-customer" name="cliente" value="${escapeHTML(this.order.cliente)}" maxlength="120"></div><div class="field"><label for="invoice-box">Caja activa</label><select id="invoice-box" name="idCaja" required>${this.boxes.map(box => `<option value="${escapeHTML(box.idCaja)}">${escapeHTML(box.nombre)}</option>`).join('')}</select></div><div class="field"><label for="invoice-observations">Observaciones</label><input id="invoice-observations" name="observaciones" value="Venta local"></div><button class="btn" ${this.boxes.length && this.employeeRoleId ? '' : 'disabled'}>Crear factura</button><p role="status" class="form-message form-help">Confirma los datos de la venta antes de crear la factura.</p></form></section>`;
    this.querySelector('form').addEventListener('submit', event => this.submit(event));
  }
  async submit(event) {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button'); button.disabled = true;
    const data = new FormData(form);
    emit(this, 'factura-solicitada', { orden: this.order, idCaja: data.get('idCaja'), idEmpleadoRol: this.employeeRoleId, cliente: data.get('cliente'), observaciones: data.get('observaciones') });
  }
  setPending(value) { const button = this.querySelector('form button'); if (button) button.disabled = value; }
  setError(message) {
    const target = this.querySelector('.form-message');
    if (target) { target.classList.remove('form-help'); target.classList.add('error-banner'); target.setAttribute('role', 'alert'); target.textContent = `⚠️ ${message}`; }
    this.setPending(false);
  }
}

customElements.define('factura-form', FacturaForm);
