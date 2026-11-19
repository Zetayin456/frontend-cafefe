import { emit, escapeHTML, formatMoney, initBoundary, lineName, renderBoundary } from '../boundary_utils.js';

export class FacturaPendienteList extends HTMLElement {
  constructor() { super(); initBoundary(this, 'factura-pendiente-list.css'); this.invoices = []; }
  set items(value) { this.invoices = Array.isArray(value) ? value : []; this.render(); }
  connectedCallback() { this.render(); }
  render() {
    if (!this.isConnected) return;
    renderBoundary(this, this.invoices.length ? `<div class="order-grid">${this.invoices.map(invoice => `<button class="order-card invoice-card" data-invoice="${escapeHTML(invoice.idFactura)}"><strong>Factura #${escapeHTML(invoice.idFactura)}</strong><p>${escapeHTML(invoice.cliente)} · Orden #${escapeHTML(invoice.idOrden || '')}</p><span class="badge">${escapeHTML(invoice.estado)}</span><div class="total"><span>Total pendiente</span><span>${formatMoney(invoice.saldoPendiente ?? invoice.total)}</span></div><p>${(invoice.detalle || []).map(item => `${escapeHTML(item.cantidad)} × ${escapeHTML(lineName(item))}`).join(' · ')}</p></button>`).join('')}</div>` : '<div class="empty">No hay facturas pendientes de pago.</div>');
    this.invoiceButtons = [...this._boundaryRoot.querySelectorAll('[data-invoice]')];
    this._boundaryRoot.onclick = event => { const button = event.target.closest('[data-invoice]'); if (button) emit(this, 'factura-seleccionada', { idFactura: button.dataset.invoice }); };
  }
}

customElements.define('factura-pendiente-list', FacturaPendienteList);
