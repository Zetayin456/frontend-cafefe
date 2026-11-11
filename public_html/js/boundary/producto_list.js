import { emit, escapeHTML, formatMoney } from './boundary_utils.js';

export class ProductoList extends HTMLElement {
  constructor() { super(); this.products = []; this.selectedType = null; this.selectedTypeName = ''; }
  set controller(value) { this._controller = value; }
  async connectedCallback() {
    this.innerHTML = '<div class="product-grid" aria-live="polite">Cargando menú…</div>';
    try {
      this.products = await this._controller.cargarProductos();
      if (this.selectedType !== null) this.filterByType(this.selectedType, this.selectedTypeName);
      else if (!this.hasCategoryRelation()) this.renderWithoutCategoryNotice();
      else this.renderProducts(this.products.slice(0, 6));
    }
    catch (error) { this.innerHTML = `<div class="empty" role="alert">No se pudo cargar el menú: ${escapeHTML(error.message)}</div>`; }
  }
  filterByType(idTipoProducto, nombre = '') {
    this.selectedType = idTipoProducto; this.selectedTypeName = nombre;
    const hasRelation = this.hasCategoryRelation();
    const results = this.products.filter(product => !hasRelation || String(product.idTipoProducto ?? product.tipoProducto?.idTipoProducto) === String(idTipoProducto));
    this.renderProducts(results);
    if (!hasRelation) this.insertAdjacentHTML('afterbegin', '<p class="form-note">El DTO de Producto no incluye la categoría; el filtro por categoría no está disponible. Se muestran todos los productos activos.</p>');
  }
  hasCategoryRelation() { return this.products.some(product => product.idTipoProducto || product.tipoProducto?.idTipoProducto); }
  renderWithoutCategoryNotice() { this.renderProducts(this.products); this.insertAdjacentHTML('afterbegin', '<p class="form-note">El DTO de Producto no incluye la categoría; el filtro por categoría no está disponible. Se muestran todos los productos activos.</p>'); }
  renderProducts(products) {
    this.innerHTML = `<div class="product-grid">${products.map(product => `<article class="product-card"><div class="product-photo" aria-hidden="true">${/caf/i.test(product.nombre) ? '☕' : /pan|croissant|pastel/i.test(product.nombre) ? '🥐' : /beb|jugo|limon/i.test(product.nombre) ? '🥤' : '🍽️'}</div><div class="product-body"><h3>${escapeHTML(product.nombre)}</h3><p>${escapeHTML(product.comentarios || '')}</p><div class="product-foot"><span class="price">${formatMoney(product.precioSugerido)}</span><button class="btn small" data-product="${escapeHTML(product.idProducto)}" aria-label="Agregar ${escapeHTML(product.nombre)}">Agregar</button></div></div></article>`).join('') || '<div class="empty">No hay productos activos en esta categoría.</div>'}</div>`;
    this.onclick = event => { const button = event.target.closest('[data-product]'); if (!button) return; const product = this.products.find(item => String(item.idProducto) === button.dataset.product); if (product) emit(this, 'producto-agregado', { product }); };
  }
}

customElements.define('producto-list', ProductoList);
