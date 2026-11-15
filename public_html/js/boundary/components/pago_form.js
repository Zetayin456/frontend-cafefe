import { emit, escapeHTML, formatMoney, productName } from '../boundary_utils.js';

export class PagoForm extends HTMLElement {
  set invoice(value) { this._invoice = value; if (this.isConnected) this.render(); }
  set productsById(value) { this._productsById = value || new Map(); if (this.isConnected && this._invoice) this.render(); }
  connectedCallback() { this.render(); }
  render() {
    if (!this._invoice) { this.innerHTML = ''; return; }
    const invoice = this._invoice;
    this.innerHTML = `<section class="panel"><div class="page-heading"><span class="eyebrow">Factura pendiente · #${escapeHTML(invoice.idFactura)}</span><h2>${escapeHTML(invoice.cliente)}</h2><p>Orden #${escapeHTML(invoice.idOrden || '')}</p></div>${(invoice.detalle || invoice.productos || []).map(item => `<div class="list-row"><span>${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this._productsById))}${item.observaciones ? ` · ${escapeHTML(item.observaciones)}` : ''}</span><span>${formatMoney(item.precio * item.cantidad)}</span></div>`).join('')}<div class="total"><span>Total factura</span><span>${formatMoney(invoice.total)}</span></div><form><div class="payment-lines">${this.paymentLine(0, invoice.total)}</div><button type="button" class="btn secondary small" data-add-payment>Agregar otro medio de pago</button><div class="total"><span>Total a pagar</span><span data-payment-sum>${formatMoney(invoice.total)}</span></div><button class="btn payment-submit">Registrar pago completo</button><p class="form-message form-help" role="status" aria-live="polite">Usa efectivo, tarjeta o QR. La suma de los medios debe coincidir con el total de la factura.</p></form></section>`;
    this.querySelector('form').addEventListener('submit', event => this.submit(event));
    this.querySelector('.payment-lines').addEventListener('input', () => this.updateSum());
    this.querySelector('[data-add-payment]').addEventListener('click', () => { const list = this.querySelector('.payment-lines'); const index = list.querySelectorAll('.payment-line').length; list.insertAdjacentHTML('beforeend', this.paymentLine(index, 0)); this.updateSum(); });
  }
  paymentLine(index, value) { return `<div class="payment-line"><div class="field"><label for="pay-method-${index}">Forma de pago</label><select id="pay-method-${index}" name="tipoPago"><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="QR">QR</option></select></div><div class="field"><label for="pay-amount-${index}">Monto</label><input id="pay-amount-${index}" name="monto" type="number" min="0.01" step="0.01" value="${Number(value).toFixed(2)}" required></div></div>`; }
  updateSum() {
    const sum = [...this.querySelectorAll('[name="monto"]')].reduce((value, input) => value + (Number(input.value) || 0), 0);
    this.querySelector('[data-payment-sum]').textContent = formatMoney(sum);
  }
  async submit(event) {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('.payment-submit');
    const methods = [...form.querySelectorAll('[name="tipoPago"]')]; const amounts = [...form.querySelectorAll('[name="monto"]')];
    const detalles = methods.map((method, index) => ({ tipoPago: method.value, monto: Math.round(Number(amounts[index].value) * 100) / 100 })); button.disabled = true;
    emit(this, 'pago-solicitado', { factura: this._invoice, detalles, observaciones: 'Pago registrado en caja' });
  }
  setPending(value) { const button = this.querySelector('.payment-submit'); if (button) button.disabled = value; }
  setError(message) {
    const target = this.querySelector('.form-message');
    if (target) { target.classList.remove('form-help'); target.classList.add('error-banner'); target.setAttribute('role', 'alert'); target.textContent = `⚠️ ${message}`; }
    this.setPending(false);
  }
}

customElements.define('pago-form', PagoForm);
