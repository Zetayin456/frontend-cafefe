import { emit, escapeHTML } from './boundary_utils.js';

export class CatalogView extends HTMLElement {
  set controller(value) { this._controller = value; }
  connectedCallback() {
    this.innerHTML = `<div class="shell"><section class="hero"><div><span class="eyebrow">Tu pausa favorita</span><h1>Un buen café<br>hace el día.</h1><p>Elige algo rico y nosotros lo preparamos con mucho cariño. Haz tu pedido en unos pasos.</p><a href="#menu" class="btn hero-link">Ver menú ↓</a></div><div class="hero-art"><div class="hero-note"><strong>Hecho al momento</strong><br><span class="muted">Con ingredientes frescos</span></div></div></section><section id="menu"><div class="section-head"><div><span class="eyebrow">Explora el menú</span><h2>Categorías</h2></div><span class="muted">Elige para comenzar</span></div><div data-types></div></section><div class="section-head"><div><span class="eyebrow">Para ti</span><h2 id="product-title">Nuestros favoritos</h2></div></div><div data-products></div><section class="layout-two cart-layout" style="margin-top:34px"><div><span class="eyebrow">Listo en un momento</span><h2>Arma tu pedido</h2><p class="muted">No necesitas crear una cuenta. Cuéntanos tu nombre para identificar la orden.</p></div><div data-cart></div></section></div>`;
    const types = document.createElement('tipo-producto-list'); types.controller = this._controller;
    const products = document.createElement('producto-list'); products.controller = this._controller;
    const cart = document.createElement('orden-cart');
    this.querySelector('[data-types]').append(types); this.querySelector('[data-products]').append(products); this.querySelector('[data-cart]').append(cart);
    types.addEventListener('tipo-seleccionado', event => {
      const name = types.querySelector(`[data-id="${CSS.escape(event.detail.idTipoProducto)}"] strong`)?.textContent || '';
      this.querySelector('#product-title').textContent = `Productos · ${name}`;
      products.filterByType(event.detail.idTipoProducto, name);
    });
    products.addEventListener('producto-agregado', event => cart.addProduct(event.detail.product));
  }
}

customElements.define('catalog-view', CatalogView);
