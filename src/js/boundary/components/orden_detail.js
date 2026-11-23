import { emit, escapeHTML, formatMoney, initBoundary, orderClientName, productName, renderBoundary } from '../boundary_utils.js';

export class OrdenDetail extends HTMLElement {
  constructor() { super(); initBoundary(this, 'orden-detail.css'); this._productsById = new Map(); this._ready = false; }
  set order(value) { this._order = value; this.render(); }
  get order() { return this._order; }
  set productsById(value) { this._productsById = value || new Map(); if (this._order) this.render(); }
  set dispatched(value) { this._ready = Boolean(value); if (this._order) this.render(); }
  set ready(value) { this._ready = Boolean(value); if (this._order) this.render(); }
  disconnectedCallback() { this.removeModal(); }
  removeModal() { document.getElementById('cafefe-order-modal')?.remove(); }
  close() { this._order = null; this.removeModal(); this.render(); }
  render() {
    if (!this.isConnected) return;
    renderBoundary(this, '');
    this.removeModal();
    if (!this._order) return;

    const order = this._order;
    const ready = this._ready;
    const status = ready ? 'DESPACHADA' : order.estado || 'PENDIENTE_COCINA';
    const action = ready ? 'Revertir a pendiente' : 'Marcar como despachada';

    const backdrop = document.createElement('div');
    backdrop.id = 'cafefe-order-modal';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(28,25,23,.55);backdrop-filter:blur(2px);display:grid;place-items:center;padding:1rem;z-index:99999;';
    backdrop.innerHTML = `
      <div role="dialog" aria-modal="true" style="background:#fffdf9;color:#1c1917;border:1px solid #e7e5e4;border-radius:18px;padding:1.35rem;width:min(500px,100%);max-height:88vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.28);font-family:inherit;">
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
          ${order.productos.map(item => `<div style="display:flex;justify-content:space-between;gap:1rem;"><span>${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this._productsById))}${item.observaciones ? ` · <small style="color:#78716c;">${escapeHTML(item.observaciones.replace('[DESPACHADA]', '').trim())}</small>` : ''}</span><strong>${formatMoney(item.precio * item.cantidad)}</strong></div>`).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;margin:.75rem 0 1rem;">
          <span>Total</span><span>${formatMoney(order.total)}</span>
        </div>
        <div style="display:flex;gap:.65rem;">
          <button type="button" data-toggle-dispatch style="flex:1;background:#1f4d3a;color:#fff;border:none;border-radius:12px;padding:.75rem 1rem;font-weight:700;cursor:pointer;">${action}</button>
          <button type="button" data-close-modal style="background:#f5f5f4;color:#1c1917;border:1px solid #d6d3d1;border-radius:12px;padding:.75rem 1rem;font-weight:600;cursor:pointer;">Cancelar</button>
        </div>
        <p style="margin:.75rem 0 0;font-size:.82rem;color:#78716c;">Al despacharla desaparecerá de cocina y quedará lista en Caja.</p>
      </div>
    `;

    backdrop.addEventListener('click', event => {
      if (event.target.closest('[data-toggle-dispatch]')) {
        emit(this, 'despacho-solicitado', { idOrden: order.idOrden, ready: !this._ready });
        return;
      }
      if (event.target === backdrop || event.target.closest('[data-close-modal]')) {
        this.close();
      }
    });

    document.body.appendChild(backdrop);
  }
}

customElements.define('orden-detail', OrdenDetail);