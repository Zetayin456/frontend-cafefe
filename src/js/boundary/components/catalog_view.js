import { initBoundary, renderBoundary } from '../boundary_utils.js';

export class CatalogView extends HTMLElement {
  constructor() { super(); initBoundary(this, 'catalog-view.css'); this._categories = []; this._products = []; this.productsById = new Map(); }
  set categories(value) { this._categories = Array.isArray(value) ? value.filter(item => item.activo) : []; if (this.categoryList) this.categoryList.categories = this._categories; }
  set products(value) { this._products = Array.isArray(value) ? value.filter(item => item.activo) : []; this.productsById = new Map(this._products.map(item => [String(item.idProducto), item])); if (this.productList) this.productList.items = this._products; }
  set selectedCategory(value = {}) { this._selectedCategory = value; if (this.productTitle) this.productTitle.textContent = value.nombre ? `Productos · ${value.nombre}` : 'Nuestros favoritos'; if (this.productList) this.productList.selectedType = value; }
  connectedCallback() {
    renderBoundary(this, `<div class="shell"><section class="hero"><div><span class="eyebrow">Tu pausa favorita</span><h1>Un buen café<br>hace el día.</h1><p>Elige algo rico y nosotros lo preparamos con mucho cariño. Haz tu pedido en unos pasos.</p><a href="#menu" class="btn hero-link">Ver menú ↓</a></div><div class="hero-art"><div class="hero-note"><strong>Hecho al momento</strong><br><span class="muted">Con ingredientes frescos</span></div></div></section><section id="menu"><div class="section-head"><div><span class="eyebrow">Explora el menú</span><h2>Categorías</h2></div><span class="muted">Elige para comenzar</span></div><div data-types></div></section><div class="section-head"><div><span class="eyebrow">Para ti</span><h2 data-product-title>Nuestros favoritos</h2></div></div><div data-products></div><section class="layout-two cart-layout" style="margin-top:34px"><div><span class="eyebrow">Listo en un momento</span><h2>Arma tu pedido</h2><p class="muted">No necesitas crear una cuenta. Cuéntanos tu nombre para identificar la orden.</p></div><div data-cart></div></section></div>`);
    this.categorySlot = this._boundaryRoot.querySelector('[data-types]'); this.productSlot = this._boundaryRoot.querySelector('[data-products]'); this.cartSlot = this._boundaryRoot.querySelector('[data-cart]'); this.productTitle = this._boundaryRoot.querySelector('[data-product-title]');
    this.categoryList = document.createElement('tipo-producto-list'); this.productList = document.createElement('producto-list'); this.cart = document.createElement('orden-cart');
    this.categorySlot.append(this.categoryList); this.productSlot.append(this.productList); this.cartSlot.append(this.cart);
    this.categoryList.categories = this._categories; this.productList.items = this._products;
  }
}

customElements.define('catalog-view', CatalogView);
