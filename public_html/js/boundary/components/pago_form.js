import { emit, escapeHTML, formatMoney, initBoundary, productName, renderBoundary } from '../boundary_utils.js';

export const calculateInvoiceBalance = invoice => {
  if (Number.isFinite(Number(invoice?.saldoPendiente))) return Math.max(0, Number(invoice.saldoPendiente));
  const payments = [...(invoice?.pagos || []), ...(invoice?.pago ? [invoice.pago] : [])];
  const paid = payments.flatMap(payment => payment.detalles || []).reduce((sum, detail) => sum + Number(detail.monto || 0), 0);
  return Math.max(0, Math.round((Number(invoice?.total || 0) - paid) * 100) / 100);
};
export const isPaymentSplitValid = (details, balance) => Array.isArray(details) && details.length > 0
  && details.every(detail => Number.isFinite(Number(detail.monto)) && Number(detail.monto) > 0)
  && details.reduce((sum, detail) => sum + Math.round(Number(detail.monto) * 100), 0) === Math.round(Number(balance) * 100);

export class PagoForm extends HTMLElement {
  constructor() { super(); initBoundary(this, 'pago-form.css'); this._productsById = new Map(); }
  set invoice(value) { this._invoice = value || null; this.render(); }
  set productsById(value) { this._productsById = value || new Map(); this.render(); }
  connectedCallback() { this.render(); }
  get remaining() {
    return calculateInvoiceBalance(this._invoice);
  }
  render() {
    if (!this.isConnected) return;
    if (!this._invoice) { renderBoundary(this, '<div class="empty">Selecciona una factura pendiente.</div>'); return; }
    const invoice = this._invoice;
    renderBoundary(this, `<section class="panel"><div class="page-heading"><span class="eyebrow">Factura pendiente · #${escapeHTML(invoice.idFactura)}</span><h2>${escapeHTML(invoice.cliente)}</h2><p>Orden #${escapeHTML(invoice.idOrden || '')}</p></div>${(invoice.detalle || invoice.productos || []).map(item => `<div class="list-row"><span>${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this._productsById))}${item.observaciones ? ` · ${escapeHTML(item.observaciones)}` : ''}</span><span>${formatMoney(item.precio * item.cantidad)}</span></div>`).join('')}<div class="total"><span>Total factura</span><span>${formatMoney(invoice.total)}</span></div><div class="total"><span>Saldo pendiente</span><span data-balance>${formatMoney(this.remaining)}</span></div><form><div class="payment-lines">${this.paymentLine(0, this.remaining)}</div><button type="button" class="btn secondary small" data-add-payment>Agregar otro medio de pago</button><div class="total"><span>Total de este pago</span><span data-payment-sum>${formatMoney(this.remaining)}</span></div><button class="btn payment-submit">Registrar pago</button><p class="form-message form-help" role="status" aria-live="polite">El total de este pago debe coincidir con el saldo pendiente.</p></form></section>`);
    this.form = this._boundaryRoot.querySelector('form'); this.lines = this._boundaryRoot.querySelector('.payment-lines'); this.sumLabel = this._boundaryRoot.querySelector('[data-payment-sum]'); this.submitButton = this._boundaryRoot.querySelector('.payment-submit'); this.message = this._boundaryRoot.querySelector('.form-message');
    this.addButton = this._boundaryRoot.querySelector('[data-add-payment]');
    this.methodInputs = [...this.form.querySelectorAll('[name="tipoPago"]')]; this.amountInputs = [...this.form.querySelectorAll('[name="monto"]')];
    this.form.addEventListener('submit', event => this.submit(event));
    this.lines.addEventListener('input', () => this.updateSum());
    this.addButton.addEventListener('click', () => {
      const index = this.amountInputs.length;
      this.lines.insertAdjacentHTML('beforeend', this.paymentLine(index, 0));
      const newLine = this.lines.lastElementChild;
      this.methodInputs.push(newLine.querySelector('[name="tipoPago"]')); this.amountInputs.push(newLine.querySelector('[name="monto"]'));
      this.updateSum();
    });
    this.updateSum();
  }
  paymentLine(index, value) { return `<div class="payment-line"><div class="field"><label for="pay-method-${index}">Forma de pago</label><select id="pay-method-${index}" name="tipoPago"><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="QR">QR</option></select></div><div class="field"><label for="pay-amount-${index}">Monto</label><input id="pay-amount-${index}" name="monto" type="number" min="0.01" step="0.01" value="${Number(value).toFixed(2)}" required></div></div>`; }
  updateSum() {
    const sum = this.amountInputs.reduce((value, input) => value + (Number(input.value) || 0), 0);
    this.sumLabel.textContent = formatMoney(sum);
    const validAmounts = this.amountInputs.every(input => Number(input.value) > 0 && Number.isFinite(Number(input.value)));
    this.setPending(!validAmounts || Math.round(sum * 100) !== Math.round(this.remaining * 100));
  }
  submit(event) {
    event.preventDefault();
    const detalles = this.methodInputs.map((method, index) => ({ tipoPago: method.value, monto: Math.round(Number(this.amountInputs[index].value) * 100) / 100 }));
    const total = detalles.reduce((sum, detail) => sum + Math.round(detail.monto * 100), 0);
    if (!isPaymentSplitValid(detalles, this.remaining) || total !== Math.round(this.remaining * 100)) { this.setError('Distribuye el saldo completo entre los medios de pago.'); this.updateSum(); return; }
    this.setPending(true);
    emit(this, 'pago-solicitado', { factura: this._invoice, detalles, observaciones: 'Pago registrado en caja' });
  }
  setPending(value) { if (this.submitButton) this.submitButton.disabled = Boolean(value); }
  setError(message) { if (this.message) { this.message.classList.remove('form-help'); this.message.classList.add('error-banner'); this.message.setAttribute('role', 'alert'); this.message.textContent = `⚠️ ${message}`; } this.setPending(false); }
}

customElements.define('pago-form', PagoForm);
