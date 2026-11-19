import { emit, escapeHTML, formatMoney, initBoundary, renderBoundary } from '../boundary_utils.js';

export class OrdenCart extends HTMLElement {
  constructor() { super(); initBoundary(this, 'orden-cart.css'); this._items = []; }
  set items(value) { this._items = Array.isArray(value) ? value : []; this.render(); }
  get items() { return this._items || []; }
  connectedCallback() { this.render(); this._boundaryRoot.addEventListener('click', event => this.onClick(event)); this._boundaryRoot.addEventListener('submit', event => this.submitOrder(event)); }
  addProduct(product) {
    const line = this.items.find(item => item.idProducto === product.idProducto);
    const items = this.items.map(item => item === line ? { ...item, cantidad: item.cantidad + 1 } : { ...item });
    if (!line) items.push({ idProducto: product.idProducto, nombreProducto: product.nombre, precio: product.precioSugerido, cantidad: 1, observaciones: '' });
    this.items = items;
    emit(this, 'carrito-actualizado', { items: this.items });
  }
  render() {
    if (!this.isConnected) return;
    const total = this.items.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0);
    renderBoundary(this, `<section class="panel cart"><h2>Tu pedido</h2>${this.items.length ? this.items.map(item => `<div class="cart-row"><div><strong>${escapeHTML(item.nombreProducto)}</strong><small>${formatMoney(item.precio)} c/u</small></div><div class="quantity"><button type="button" data-qty="${escapeHTML(item.idProducto)}" data-delta="-1" aria-label="Quitar uno">−</button><span>${item.cantidad}</span><button type="button" data-qty="${escapeHTML(item.idProducto)}" data-delta="1" aria-label="Agregar uno">+</button></div></div>`).join('') : '<p class="muted">Aún no agregas productos.</p>'}<div class="total"><span>Total aproximado</span><span>${formatMoney(total)}</span></div><form><div class="field"><label for="order-customer">Tu nombre</label><input id="order-customer" name="cliente" maxlength="80" placeholder="¿Cómo te llamas?" required></div><button class="btn" ${this.items.length ? '' : 'disabled'}>Enviar pedido</button><p class="form-note" role="status">El backend calcula los precios oficiales.</p></form></section>`);
    this.form = this._boundaryRoot.querySelector('form'); this.submitButton = this.form.querySelector('button'); this.status = this.form.querySelector('[role="status"]'); this.customerInput = this.form.elements.cliente;
  }
  onClick(event) {
    const button = event.target.closest('[data-qty]'); if (!button) return;
    const item = this.items.find(line => String(line.idProducto) === button.dataset.qty); if (!item) return;
    const quantity = item.cantidad + Number(button.dataset.delta);
    this.items = quantity < 1 ? this.items.filter(line => line !== item) : this.items.map(line => line === item ? { ...line, cantidad: quantity } : line);
    emit(this, 'carrito-actualizado', { items: this.items });
  }
  submitOrder(event) {
    if (event.target.tagName !== 'FORM') return;
    event.preventDefault(); this.setPending(true);
    emit(this, 'orden-enviada', { cliente: this.customerInput.value, productos: this.items.map(item => ({ ...item })) });
  }
  setPending(value) { if (this.submitButton) this.submitButton.disabled = value || !this.items.length; }
  setError(message) { if (this.status) this.status.textContent = message; this.setPending(false); }
  clearCart() { this.items = []; }
}

customElements.define('orden-cart', OrdenCart);
