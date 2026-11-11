import { emit, escapeHTML, formatMoney, lineName } from './boundary_utils.js';

export class OrdenPendienteList extends HTMLElement {
  set controller(value) { this._controller = value; }
  async connectedCallback() {
    this._mode ||= this.getAttribute('mode');
    this.innerHTML = '<div class="empty">Cargando órdenes…</div>';
    try { this.orders = await this._controller.cargarOrdenesPendientes(); this.render(); }
    catch (error) { this.innerHTML = `<div class="empty" role="alert">No se pudieron cargar las órdenes: ${escapeHTML(error.message)}</div>`; }
  }
  set mode(value) { this._mode = value; if (this.orders) this.render(); }
  render() {
    this.innerHTML = this.orders.length ? `<div class="order-grid">${this.orders.map(order => `<article class="order-card"><button class="record-select" data-select-order="${escapeHTML(order.idOrden)}"><span><strong>Orden #${escapeHTML(order.idOrden)}</strong><small>${escapeHTML(order.cliente)} · ${order.productos.length} productos</small></span><span class="badge">${escapeHTML(order.estado)}</span></button><div class="total"><span>Total</span><span>${formatMoney(order.total)}</span></div><p>${order.productos.map(item => `${escapeHTML(item.cantidad)} × ${escapeHTML(lineName(item))}`).join(' · ')}</p>${this._mode === 'invoice' ? `<button class="btn small" data-create-invoice="${escapeHTML(order.idOrden)}">Generar factura</button>` : ''}</article>`).join('')}</div>` : '<div class="empty">No hay órdenes pendientes.</div>';
    this.onclick = event => {
      const invoice = event.target.closest('[data-create-invoice]');
      if (invoice) { const order = this.orders.find(item => String(item.idOrden) === invoice.dataset.createInvoice); if (order) emit(this, 'orden-seleccionada', { order, facturar: true }); return; }
      const select = event.target.closest('[data-select-order]'); if (select) { const order = this.orders.find(item => String(item.idOrden) === select.dataset.selectOrder); if (order) emit(this, 'orden-seleccionada', { order }); }
    };
  }
}

customElements.define('orden-pendiente-list', OrdenPendienteList);
