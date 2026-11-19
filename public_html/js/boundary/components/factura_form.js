import { emit, escapeHTML, initBoundary, productName, renderBoundary } from '../boundary_utils.js';

export class FacturaForm extends HTMLElement {
  constructor() { super(); initBoundary(this, 'factura-form.css'); this.boxes = []; this.productsById = new Map(); }
  set context(value = {}) { this.order = value.order || null; this.employeeRoleId = value.employeeRoleId || null; this.productsById = value.productsById || new Map(); this.render(); }
  set activeBoxes(value) { this.boxes = Array.isArray(value) ? value.filter(box => box.activo) : []; this.render(); }
  connectedCallback() { this.render(); }
  render() {
    if (!this.isConnected) return;
    if (!this.order) { renderBoundary(this, '<div class="empty">Selecciona una orden para facturar.</div>'); return; }
    renderBoundary(this, `<section class="panel"><span class="eyebrow">Nueva factura</span><h2>Orden #${escapeHTML(this.order.idOrden)} · ${escapeHTML(this.order.cliente)}</h2><div class="invoice-order-lines">${(this.order.productos || []).map(item => `<div class="list-row"><span>${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this.productsById))}${item.observaciones ? ` · ${escapeHTML(item.observaciones)}` : ''}</span></div>`).join('')}</div><form><div class="field"><label for="invoice-customer">Cliente</label><input id="invoice-customer" name="cliente" value="${escapeHTML(this.order.cliente)}" maxlength="120" required></div><div class="field"><label for="invoice-box">Caja activa</label><select id="invoice-box" name="idCaja" required>${this.boxes.map(box => `<option value="${escapeHTML(box.idCaja)}">${escapeHTML(box.nombre)}</option>`).join('')}</select></div><div class="field"><label for="invoice-observations">Observaciones</label><input id="invoice-observations" name="observaciones" value="Venta local"></div><button class="btn" ${this.boxes.length && this.employeeRoleId ? '' : 'disabled'}>Crear factura</button><p role="status" class="form-message form-help">Confirma los datos de la venta antes de crear la factura.</p></form></section>`);
    this.form = this._boundaryRoot.querySelector('form'); this.submitButton = this.form.querySelector('button'); this.message = this.form.querySelector('.form-message');
    this.form.addEventListener('submit', event => this.submit(event));
  }
  submit(event) {
    event.preventDefault(); this.setPending(true);
    const data = new FormData(this.form);
    emit(this, 'factura-solicitada', { orden: this.order, idCaja: data.get('idCaja'), idEmpleadoRol: this.employeeRoleId, cliente: data.get('cliente'), observaciones: data.get('observaciones') });
  }
  setPending(value) { if (this.submitButton) this.submitButton.disabled = Boolean(value) || !this.boxes.length || !this.employeeRoleId; }
  setError(message) { if (this.message) { this.message.classList.remove('form-help'); this.message.classList.add('error-banner'); this.message.setAttribute('role', 'alert'); this.message.textContent = `⚠️ ${message}`; } this.setPending(false); }
}

customElements.define('factura-form', FacturaForm);
