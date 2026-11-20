import { emit, escapeHTML, formatMoney, initBoundary, orderClientName, productName, renderBoundary } from '../boundary_utils.js';

export const visibleOrdersForMode = (orders, mode, dispatchedIds = new Set()) => mode === 'invoice'
  ? [...(orders || [])]
  : (orders || []).filter(order => !dispatchedIds.has(String(order.idOrden)));

export class OrdenPendienteList extends HTMLElement {
  constructor() { super(); initBoundary(this, 'orden-pendiente-list.css'); this.orders = []; this.productsById = new Map(); this.readyOrderIds = new Set(); }
  set items(value) { this.orders = Array.isArray(value) ? value : []; this.render(); }
  set products(value) { this.productsById = value instanceof Map ? value : new Map((value || []).map(item => [String(item.idProducto), item])); this.render(); }
  set dispatchedIds(value) { this.readyOrderIds = value instanceof Set ? value : new Set(value || []); this.render(); }
  set mode(value) { this._mode = value; this.render(); }
  connectedCallback() { this._mode ||= this.getAttribute('mode'); this.render(); }
  setOrderReady(id, ready) {
    const next = new Set(this.readyOrderIds);
    if (ready) next.add(String(id)); else next.delete(String(id));
    this.dispatchedIds = next;
  }
  render() {
    if (!this.isConnected) return;
    const visibleOrders = visibleOrdersForMode(this.orders, this._mode, this.readyOrderIds);
    const content = visibleOrders.length ? `<div class="order-grid">${visibleOrders.map(order => {
      const selected = this._mode !== 'invoice' && String(order.idOrden) === this.selectedOrderId;
      const ready = this.readyOrderIds.has(String(order.idOrden));
      const status = ready ? 'LISTA / DESPACHADA' : order.estado || 'PENDIENTE_COCINA';
      return `<article class="order-card${selected ? ' selected' : ''}"><button class="record-select" data-select-order="${escapeHTML(order.idOrden)}" aria-pressed="${selected}"><span><strong>Orden #${escapeHTML(order.idOrden)}</strong><small>${escapeHTML(orderClientName(order))} · ${order.productos.length} productos</small></span><span class="badge${ready ? ' green' : ''}">${escapeHTML(status)}</span></button><div class="total"><span>Total</span><span>${formatMoney(order.total)}</span></div><p>${order.productos.map(item => `${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this.productsById))}`).join(' · ')}</p>${this._mode === 'invoice' ? `<button class="btn small" data-create-invoice="${escapeHTML(order.idOrden)}">Generar factura</button>` : ''}</article>`;
    }).join('')}</div>` : `<div class="empty">${this._mode === 'invoice' ? 'No hay órdenes por facturar.' : 'No hay órdenes pendientes.'}</div>`;
    renderBoundary(this, content);
    this._boundaryRoot.onclick = event => {
      const invoiceButton = event.target.closest('[data-create-invoice]');
      if (invoiceButton) { const order = this.orders.find(item => String(item.idOrden) === invoiceButton.dataset.createInvoice); if (order) emit(this, 'orden-seleccionada', { order, facturar: true }); return; }
      const selectButton = event.target.closest('[data-select-order]');
      if (!selectButton) return;
      const order = this.orders.find(item => String(item.idOrden) === selectButton.dataset.selectOrder);
      if (!order) return;
      this.selectedOrderId = String(order.idOrden); this.render();
      emit(this, 'orden-seleccionada', { order });
    };
  }
}

customElements.define('orden-pendiente-list', OrdenPendienteList);
