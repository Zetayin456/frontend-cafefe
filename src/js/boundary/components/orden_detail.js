import { emit, escapeHTML, formatMoney, initBoundary, orderClientName, productName, renderBoundary } from '../boundary_utils.js';

export class OrdenDetail extends HTMLElement {
  constructor() { super(); initBoundary(this, 'orden-detail.css'); this._productsById = new Map(); this._ready = false; }
  set order(value) { this._order = value; this.render(); }
  get order() { return this._order; }
  set productsById(value) { this._productsById = value || new Map(); if (this._order) this.render(); }
  set dispatched(value) { this._ready = Boolean(value); if (this._order) this.render(); }
  set ready(value) { this._ready = Boolean(value); if (this._order) this.render(); }
  render() {
    if (!this.isConnected) return;
    if (!this._order) {
      renderBoundary(this, '<section class="panel order-detail"><span class="eyebrow">Orden pendiente de cocina</span><h2>Detalle de la orden</h2><p class="muted">Selecciona una orden de la lista para ver sus productos y observaciones.</p></section>');
      return;
    }
    const order = this._order;
    const ready = this._ready;
    this._ready = ready;
    const status = ready ? 'LISTA / DESPACHADA' : order.estado || 'PENDIENTE_COCINA';
    const heading = ready ? 'Orden lista / despachada' : 'Orden pendiente de cocina';
    const action = ready ? 'Revertir a pendiente' : 'Marcar como lista / despachada';
    renderBoundary(this, `<section class="panel order-detail"><div class="page-heading"><span class="eyebrow">${heading}</span><h2>#${escapeHTML(order.idOrden)} · ${escapeHTML(orderClientName(order))}</h2><span class="badge${ready ? ' green' : ''}">${escapeHTML(status)}</span></div>${order.productos.map(item => `<div class="list-row"><span>${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this._productsById))}${item.observaciones ? ` · ${escapeHTML(item.observaciones)}` : ''}</span><span>${formatMoney(item.precio * item.cantidad)}</span></div>`).join('')}<div class="total"><span>Total</span><span>${formatMoney(order.total)}</span></div><button type="button" class="btn dispatch-toggle" data-toggle-dispatch aria-pressed="${ready}">${action}</button><p class="form-note">Al marcarla lista, la orden desaparece de pendientes y queda visible para Caja.</p></section>`);
    this.dispatchButton = this._boundaryRoot.querySelector('[data-toggle-dispatch]');
    this._boundaryRoot.onclick = event => {
      if (!event.target.closest('[data-toggle-dispatch]')) return;
      emit(this, 'despacho-solicitado', { idOrden: order.idOrden, ready: !this._ready });
    };
  }
}

customElements.define('orden-detail', OrdenDetail);
