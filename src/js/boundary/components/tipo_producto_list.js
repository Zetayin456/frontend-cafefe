import { emit, escapeHTML, initBoundary, renderBoundary } from '../boundary_utils.js';

export class TipoProductoList extends HTMLElement {
  constructor() {
    super();
    initBoundary(this, 'tipo-producto-list.css');
    this._selectedId = null;
    this._boundaryRoot.addEventListener('click', event => {
      const button = event.target.closest('[data-id]');
      if (!button) return;
      const clickedId = String(button.dataset.id);
      const isSame = this._selectedId === clickedId;
      this._selectedId = isSame ? null : clickedId;
      this.render();
      const category = (this._categories || []).find(item => String(item.idTipoProducto) === clickedId);
      emit(this, 'tipo-seleccionado', isSame ? {} : { idTipoProducto: clickedId, nombre: category?.nombre || '' });
    });
  }
  set categories(value) { this._categories = Array.isArray(value) ? value.filter(item => item.activo) : []; this.render(); }
  connectedCallback() { this.render(); }
  render() {
    if (!this.isConnected) return;
    const categories = this._categories || [];
    renderBoundary(this, `<div class="category-row">${categories.map((type, index) => {
      const selected = String(type.idTipoProducto) === this._selectedId;
      return `<button type="button" class="category-card${selected ? ' selected' : ''}" data-id="${escapeHTML(type.idTipoProducto)}" aria-pressed="${String(selected)}"><span class="category-icon" role="img" aria-label="${escapeHTML(type.nombre)}">${this.iconFor(type.nombre, index)}</span><span><strong>${escapeHTML(type.nombre)}</strong><small>Ver productos</small></span></button>`;
    }).join('') || '<p class="muted">No hay categorías activas.</p>'}</div>`);
    this.categoryButtons = [...this._boundaryRoot.querySelectorAll('[data-id]')];
  }
  iconFor(name, index) { return /caf/i.test(name) ? '☕' : /beb|jugo/i.test(name) ? '🥤' : /pan|post/i.test(name) ? '🥐' : /desay|comida/i.test(name) ? '🍳' : ['🍽️', '🥗', '🍰'][index % 3]; }
}

customElements.define('tipo-producto-list', TipoProductoList);