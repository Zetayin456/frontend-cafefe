import { emit, escapeHTML, formatMoney, lineName } from './boundary_utils.js';

export class FacturaPendienteList extends HTMLElement {
  set controller(value) { this._controller = value; }
  async connectedCallback() {
    this.innerHTML = '<div class="empty">Cargando facturas…</div>';
    try { this.invoices = await this._controller.cargarFacturasPendientes(); this.render(); }
    catch (error) { this.innerHTML = `<div class="empty" role="alert">No se pudieron cargar las facturas: ${escapeHTML(error.message)}</div>`; }
  }
  render() {
    this.innerHTML = this.invoices.length ? `<div class="order-grid">${this.invoices.map(invoice => `<button class="order-card invoice-card" data-invoice="${escapeHTML(invoice.idFactura)}"><strong>Factura #${escapeHTML(invoice.idFactura)}</strong><p>${escapeHTML(invoice.cliente)} · Orden #${escapeHTML(invoice.idOrden || '')}</p><span class="badge">${escapeHTML(invoice.estado)}</span><div class="total"><span>Total</span><span>${formatMoney(invoice.total)}</span></div><p>${invoice.detalle.map(item => `${escapeHTML(item.cantidad)} × ${escapeHTML(lineName(item))}`).join(' · ')}</p></button>`).join('')}</div>` : '<div class="empty">No hay facturas pendientes de pago.</div>';
    this.onclick = event => { const button = event.target.closest('[data-invoice]'); if (button) emit(this, 'factura-seleccionada', { idFactura: button.dataset.invoice }); };
  }
}

customElements.define('factura-pendiente-list', FacturaPendienteList);
