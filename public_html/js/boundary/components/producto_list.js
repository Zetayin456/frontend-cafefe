import { emit, escapeHTML, formatMoney, initBoundary, renderBoundary } from '../boundary_utils.js';

export const filterProductsByCategory = (products, categoryId = null) => (Array.isArray(products) ? products : [])
  .filter(product => product.activo)
  .filter(product => categoryId == null || String(product.idTipoProducto ?? product.tipoProducto?.idTipoProducto ?? '') === String(categoryId));

export class ProductoList extends HTMLElement {
  constructor() { super(); initBoundary(this, 'producto-list.css'); this.products = []; this._selectedType = null; }
  set items(value) { this.products = Array.isArray(value) ? value.filter(product => product.activo) : []; this.render(); }
  set selectedType(value) { this._selectedType = value; this.render(); }
  get selectedType() { return this._selectedType; }
  connectedCallback() { this.render(); }
  filterByType(idTipoProducto) { this.selectedType = idTipoProducto; }
  render() {
    if (!this.isConnected) return;
    const filtered = filterProductsByCategory(this.products, this._selectedType);
    renderBoundary(this, `<div class="product-grid">${filtered.map(product => `<article class="product-card"><div class="product-photo" aria-hidden="true">${/caf/i.test(product.nombre) ? '☕' : /pan|croissant|pastel/i.test(product.nombre) ? '🥐' : /beb|jugo|limon/i.test(product.nombre) ? '🥤' : '🍽️'}</div><div class="product-body"><h3>${escapeHTML(product.nombre)}</h3><p>${escapeHTML(product.comentarios || '')}</p><div class="product-foot"><span class="price">${formatMoney(product.precioSugerido)}</span><button class="btn small" data-product="${escapeHTML(product.idProducto)}" aria-label="Agregar ${escapeHTML(product.nombre)}">Agregar</button></div></div></article>`).join('') || '<div class="empty">No hay productos activos en esta categoría.</div>'}</div>`);
    this.productButtons = [...this._boundaryRoot.querySelectorAll('[data-product]')];
    this._boundaryRoot.onclick = event => {
      const button = event.target.closest('[data-product]'); if (!button) return;
      const product = this.products.find(item => String(item.idProducto) === String(button.dataset.product));
      if (product) emit(this, 'producto-agregado', { product });
    };
  }
}

customElements.define('producto-list', ProductoList);
