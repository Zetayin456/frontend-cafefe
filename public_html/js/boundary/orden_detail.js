import { escapeHTML, formatMoney, lineName } from './boundary_utils.js';

export class OrdenDetail extends HTMLElement {
  set order(value) { this._order = value; this.render(); }
  render() {
    if (!this._order) { this.innerHTML = ''; return; }
    const order = this._order;
    this.innerHTML = `<section class="panel order-detail"><div class="page-heading"><span class="eyebrow">Orden pendiente de cocina</span><h2>#${escapeHTML(order.idOrden)} · ${escapeHTML(order.cliente)}</h2></div>${order.productos.map(item => `<div class="list-row"><span>${escapeHTML(item.cantidad)} × ${escapeHTML(lineName(item))}${item.observaciones ? ` · ${escapeHTML(item.observaciones)}` : ''}</span><span>${formatMoney(item.precio * item.cantidad)}</span></div>`).join('')}<div class="total"><span>Total</span><span>${formatMoney(order.total)}</span></div><p class="form-note">El backend no ofrece una operación para guardar el despacho de cocina; este estado se deriva de las facturas.</p></section>`;
  }
}

customElements.define('orden-detail', OrdenDetail);
