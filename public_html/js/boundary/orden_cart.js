import { emit, escapeHTML, formatMoney } from './boundary_utils.js';

export class OrdenCart extends HTMLElement {
  constructor() { super(); this.items = []; }
  connectedCallback() { this.render(); this.addEventListener('click', event => this.onClick(event)); this.addEventListener('submit', event => this.submitOrder(event)); }
  addProduct(product) {
    const line = this.items.find(item => item.idProducto === product.idProducto);
    if (line) line.cantidad += 1;
    else this.items.push({ idProducto: product.idProducto, nombreProducto: product.nombre, precio: product.precioSugerido, cantidad: 1, observaciones: '' });
    this.render();
  }
  render() {
    const total = this.items.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0);
    this.innerHTML = `<section class="panel cart"><h2>Tu pedido</h2>${this.items.length ? this.items.map(item => `<div class="cart-row"><div><strong>${escapeHTML(item.nombreProducto)}</strong><small>${formatMoney(item.precio)} c/u</small></div><div class="quantity"><button type="button" data-qty="${escapeHTML(item.idProducto)}" data-delta="-1" aria-label="Quitar uno">−</button><span>${item.cantidad}</span><button type="button" data-qty="${escapeHTML(item.idProducto)}" data-delta="1" aria-label="Agregar uno">+</button></div></div>`).join('') : '<p class="muted">Aún no agregas productos.</p>'}<div class="total"><span>Total aproximado</span><span>${formatMoney(total)}</span></div><form><div class="field"><label for="order-customer">Tu nombre</label><input id="order-customer" name="cliente" maxlength="80" placeholder="¿Cómo te llamas?" required></div><button class="btn" ${this.items.length ? '' : 'disabled'}>Enviar pedido</button><p class="form-note" role="status">El backend calcula los precios oficiales.</p></form></section>`;
  }
  onClick(event) {
    const button = event.target.closest('[data-qty]'); if (!button) return;
    const item = this.items.find(line => String(line.idProducto) === button.dataset.qty); if (!item) return;
    item.cantidad += Number(button.dataset.delta); if (item.cantidad < 1) this.items = this.items.filter(line => line !== item); this.render();
  }
  async submitOrder(event) {
    if (event.target.tagName !== 'FORM') return;
    event.preventDefault(); const form = event.target; const button = form.querySelector('button[type="submit"], button:not([type])'); const status = form.querySelector('[role="status"]');
    button.disabled = true;
    const data = new FormData(form);
    emit(this, 'orden-enviada', { cliente: data.get('cliente'), productos: this.items.map(item => ({ ...item })) });
  }
  setPending(value) { const button = this.querySelector('form button'); if (button) button.disabled = value; }
  setError(message) { const status = this.querySelector('[role="status"]'); if (status) status.textContent = message; this.setPending(false); }
  clearCart() { this.items = []; this.render(); }
}

customElements.define('orden-cart', OrdenCart);
