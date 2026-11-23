import { emit, escapeHTML, formatMoney, initBoundary, orderClientName, productName, renderBoundary } from '../boundary_utils.js';

export const visibleOrdersForMode = (orders, mode, dispatchedIds = new Set()) => mode === 'invoice'
  ? [...(orders || [])]
  : (orders || []).filter(order => !dispatchedIds.has(String(order.idOrden)) && order.estado !== 'DESPACHADA');

export class OrdenPendienteList extends HTMLElement {
  constructor() {
    super();
    initBoundary(this, 'orden-pendiente-list.css');
    this.orders = [];
    this.productsById = new Map();
    this.readyOrderIds = new Set();
  }
  get rootNodeTarget() {
    return this.shadowRoot || this._boundaryRoot || this;
  }
  set items(value) { this.orders = Array.isArray(value) ? value : []; this.render(); }
  set products(value) { this.productsById = value instanceof Map ? value : new Map((value || []).map(item => [String(item.idProducto), item])); this.render(); }
  set dispatchedIds(value) { this.readyOrderIds = value instanceof Set ? value : new Set(value || []); this.render(); }
  set mode(value) { this._mode = value; this.render(); }
  connectedCallback() {
    this._mode ||= this.getAttribute('mode');
    if (!this._clickBound) {
      this._clickBound = true;
      this.rootNodeTarget.addEventListener('click', event => this.handleRootClick(event), true);
    }
    this.render();
  }
  setOrderReady(id, ready) {
    const next = new Set(this.readyOrderIds);
    if (ready) next.add(String(id)); else next.delete(String(id));
    this.dispatchedIds = next;
  }
  async dispatchOrderNow(orderId, ready = true) {
    const id = String(orderId);
    this.setOrderReady(id, ready);
    try {
      const saved = JSON.parse(localStorage.getItem('cafefe.dispatchedOrderIds') || '[]');
      const set = new Set(saved.map(String));
      if (ready) set.add(id); else set.delete(id);
      localStorage.setItem('cafefe.dispatchedOrderIds', JSON.stringify([...set]));
    } catch (_) {}
    emit(this, 'despacho-solicitado', { idOrden: id, ready });
    try {
      await fetch('/api/orden/' + encodeURIComponent(id) + '/despachar', { method: 'PUT' });
    } catch (_) {}
  }
  handleRootClick(event) {
    const path = event.composedPath ? event.composedPath() : [event.target];
    const findAttr = attr => path.find(el => el && el.dataset && el.dataset[attr]);

    const invoiceEl = findAttr('createInvoice');
    if (invoiceEl) {
      event.stopPropagation();
      const order = this.orders.find(item => String(item.idOrden) === invoiceEl.dataset.createInvoice);
      if (order) emit(this, 'orden-seleccionada', { order, facturar: true });
      return;
    }

    const directDispatchEl = findAttr('openDispatch');
    if (directDispatchEl) {
      event.stopPropagation();
      const orderId = directDispatchEl.dataset.openDispatch;
      const order = this.orders.find(item => String(item.idOrden) === String(orderId));
      if (order) this.openDispatchModal(order);
      return;
    }

    const cardEl = findAttr('selectOrder') || findAttr('cardOrder');
    if (!cardEl) return;

    const orderId = cardEl.dataset.selectOrder || cardEl.dataset.cardOrder;
    const order = this.orders.find(item => String(item.idOrden) === String(orderId));
    if (!order) return;

    this.selectedOrderId = String(order.idOrden);
    if (this._mode !== 'invoice') {
      this.openDispatchModal(order);
    }
    emit(this, 'orden-seleccionada', { order });
  }
  openDispatchModal(order) {
    document.getElementById('cafefe-order-modal')?.remove();
    const ready = this.readyOrderIds.has(String(order.idOrden)) || order.estado === 'DESPACHADA';
    const status = ready ? 'DESPACHADA' : (order.estado || 'PENDIENTE_COCINA');
    const action = ready ? 'Revertir a pendiente' : 'Marcar como despachada';

    const backdrop = document.createElement('div');
    backdrop.id = 'cafefe-order-modal';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(28,25,23,.58);backdrop-filter:blur(2px);display:grid;place-items:center;padding:1rem;z-index:2147483647;';
    backdrop.innerHTML = `
      <div role="dialog" aria-modal="true" style="background:#fffdf9;color:#1c1917;border:1px solid #e7e5e4;border-radius:18px;padding:1.35rem;width:min(500px,100%);max-height:88vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.3);font-family:system-ui,-apple-system,sans-serif;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;margin-bottom:.75rem;">
          <div>
            <div style="font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:#78716c;font-weight:700;">Detalle de orden</div>
            <h2 style="margin:.2rem 0 0;font-size:1.25rem;">#${escapeHTML(String(order.idOrden).slice(0, 8))} · ${escapeHTML(orderClientName(order))}</h2>
          </div>
          <button type="button" data-close-modal aria-label="Cerrar" style="border:1px solid #d6d3d1;background:#fff;border-radius:10px;padding:.35rem .65rem;cursor:pointer;font-weight:700;">✕</button>
        </div>
        <div style="margin-bottom:.85rem;">
          <span style="display:inline-block;padding:.25rem .65rem;border-radius:999px;font-size:.75rem;font-weight:700;background:${ready ? '#dcfce7;color:#166534' : '#fef3c7;color:#92400e'};">${escapeHTML(status)}</span>
        </div>
        <div style="display:grid;gap:.5rem;margin:.75rem 0;border-top:1px solid #e7e5e4;border-bottom:1px solid #e7e5e4;padding:.75rem 0;">
          ${(order.productos || []).map(item => `<div style="display:flex;justify-content:space-between;gap:1rem;"><span>${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this.productsById))}${item.observaciones ? ` · <small style="color:#78716c;">${escapeHTML(String(item.observaciones).replace('[DESPACHADA]', '').trim())}</small>` : ''}</span><strong>${formatMoney(item.precio * item.cantidad)}</strong></div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;margin:.75rem 0 1rem;">
          <span>Total</span><span>${formatMoney(order.total)}</span>
        </div>
        <div style="display:flex;gap:.65rem;">
          <button type="button" data-confirm-dispatch style="flex:1;background:#1f4d3a;color:#fff;border:none;border-radius:12px;padding:.8rem 1rem;font-size:.95rem;font-weight:700;cursor:pointer;">${action}</button>
          <button type="button" data-close-modal style="background:#f5f5f4;color:#1c1917;border:1px solid #d6d3d1;border-radius:12px;padding:.8rem 1rem;font-weight:600;cursor:pointer;">Cancelar</button>
        </div>
        <p style="margin:.75rem 0 0;font-size:.82rem;color:#78716c;">Al despacharla desaparecerá de cocina y quedará lista en Caja.</p>
      </div>
    `;

    backdrop.addEventListener('click', event => {
      if (event.target.closest('[data-confirm-dispatch]')) {
        backdrop.remove();
        this.dispatchOrderNow(order.idOrden, !ready);
        return;
      }
      if (event.target === backdrop || event.target.closest('[data-close-modal]')) {
        backdrop.remove();
      }
    });

    document.body.appendChild(backdrop);
  }
  render() {
    if (!this.isConnected) return;
    const visibleOrders = visibleOrdersForMode(this.orders, this._mode, this.readyOrderIds);
    const content = visibleOrders.length ? `<div class="order-grid">${visibleOrders.map(order => {
      const selected = this._mode !== 'invoice' && String(order.idOrden) === this.selectedOrderId;
      const ready = this.readyOrderIds.has(String(order.idOrden));
      const status = ready ? 'LISTA / DESPACHADA' : order.estado || 'PENDIENTE_COCINA';
      return `<article class="order-card${selected ? ' selected' : ''}" data-card-order="${escapeHTML(order.idOrden)}" style="cursor:pointer;"><button type="button" class="record-select" data-select-order="${escapeHTML(order.idOrden)}" aria-pressed="${selected}"><span><strong>Orden #${escapeHTML(order.idOrden)}</strong><small>${escapeHTML(orderClientName(order))} · ${order.productos.length} productos</small></span><span class="badge${ready ? ' green' : ''}">${escapeHTML(status)}</span></button><div class="total"><span>Total</span><span>${formatMoney(order.total)}</span></div><p>${order.productos.map(item => `${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this.productsById))}`).join(' · ')}</p>${this._mode === 'invoice' ? `<button type="button" class="btn small" data-create-invoice="${escapeHTML(order.idOrden)}">Generar factura</button>` : `<button type="button" class="btn small" data-open-dispatch="${escapeHTML(order.idOrden)}" onclick="this.getRootNode().host.dispatchOrderNow('${escapeHTML(order.idOrden)}', true)" style="margin-top:.5rem;background:#1f4d3a;color:#fff;border:none;border-radius:10px;padding:.55rem .9rem;font-weight:700;cursor:pointer;">Marcar como despachada</button>`}</article>`;
    }).join('')}</div>` : `<div class="empty">${this._mode === 'invoice' ? 'No hay órdenes por facturar.' : 'No hay órdenes pendientes.'}</div>`;
    renderBoundary(this, content);
  }
}

customElements.define('orden-pendiente-list', OrdenPendienteList);