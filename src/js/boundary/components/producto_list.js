import { emit, escapeHTML, formatMoney, initBoundary, renderBoundary } from '../boundary_utils.js';

export const filterProductsByCategory = (products, categoryId = null, categoryName = '') => (Array.isArray(products) ? products : [])
  .filter(product => product.activo)
  .filter(product => {
    if (!categoryId) return true;
    const prodTypeId = product.idTipoProducto ?? product.tipoProducto?.idTipoProducto;
    if (prodTypeId != null) return String(prodTypeId) === String(categoryId);
    const text = ` ${product.comentarios || ''}`.toLowerCase();
    const isCoffee = /caf|latte|capuchin|espres|mocca|american/.test(text);
    return /caf/i.test(categoryName) ? isCoffee : !isCoffee;
  });

export class ProductoList extends HTMLElement {
  constructor() {
    super();
    initBoundary(this, 'producto-list.css');
    this.products = [];
    this._selectedType = null;
    this._selectedTypeName = '';
    this._boundaryRoot.addEventListener('click', event => {
      const button = event.target.closest('[data-product]');
      if (!button) return;
      const product = this.products.find(item => String(item.idProducto ?? item.id) === String(button.dataset.product));
      if (product) emit(this, 'producto-agregado', { product });
    });
  }
  set items(value) { this.products = Array.isArray(value) ? value.filter(product => product.activo) : []; this.render(); }
  set selectedType(value) {
    if (value && typeof value === 'object') {
      this._selectedType = value.idTipoProducto ?? null;
      this._selectedTypeName = value.nombre ?? '';
    } else {
      this._selectedType = value ?? null;
      this._selectedTypeName = '';
    }
    this.render();
  }
  get selectedType() { return this._selectedType; }
  connectedCallback() { this.render(); }
  filterByType(idTipoProducto) { this.selectedType = idTipoProducto; }
  render() {
    if (!this.isConnected) return;
    const filtered = filterProductsByCategory(this.products, this._selectedType, this._selectedTypeName);
    renderBoundary(this, `<div class="product-grid">${filtered.map(product => `<article class="product-card"><div class="product-photo" aria-hidden="true">${/caf|latte|capuchin/i.test(product.nombre) ? '☕' : /pan|croissant|pastel/i.test(product.nombre) ? '🥐' : /beb|jugo|limon/i.test(product.nombre) ? '🥤' : '🍽️'}</div><div class="product-body"><h3>${escapeHTML(product.nombre)}</h3><p>${escapeHTML(product.comentarios || '')}</p><div class="product-foot"><span class="price">${formatMoney(product.precioSugerido)}</span><button class="btn small" data-product="${escapeHTML(product.idProducto)}" aria-label="Agregar ${escapeHTML(product.nombre)}">Agregar</button></div></div></article>`).join('') || '<div class="empty">No hay productos activos en esta categoría.</div>'}</div>`);
    this.productButtons = [...this._boundaryRoot.querySelectorAll('[data-product]')];
  }
}

customElements.define('producto-list', ProductoList);