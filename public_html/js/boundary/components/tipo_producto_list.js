import { emit, escapeHTML, initBoundary, renderBoundary } from '../boundary_utils.js';

export class TipoProductoList extends HTMLElement {
  constructor() { super(); initBoundary(this, 'tipo-producto-list.css'); }
  set categories(value) { this._categories = Array.isArray(value) ? value.filter(item => item.activo) : []; this.render(); }
  connectedCallback() { this.render(); }
  render() {
    if (!this.isConnected) return;
    const categories = this._categories || [];
    renderBoundary(this, `<div class="category-row">${categories.map((type, index) => `<button class="category-card" data-id="${escapeHTML(type.idTipoProducto)}" aria-pressed="${String(String(type.idTipoProducto) === String(this._selectedId))}"><span class="category-icon" role="img" aria-label="${escapeHTML(type.nombre)}">${this.iconFor(type.nombre, index)}</span><span><strong>${escapeHTML(type.nombre)}</strong><small>Ver productos</small></span></button>`).join('') || '<p class="muted">No hay categorías activas.</p>'}</div>`);
    this.categoryButtons = [...this._boundaryRoot.querySelectorAll('[data-id]')];
    this._boundaryRoot.onclick = event => {
      const button = event.target.closest('[data-id]'); if (!button) return;
      this._selectedId = button.dataset.id;
      this.categoryButtons.forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-pressed', String(selected)); });
      const category = categories.find(item => String(item.idTipoProducto) === String(button.dataset.id));
      emit(this, 'tipo-seleccionado', { idTipoProducto: button.dataset.id, nombre: category?.nombre || '' });
    };
  }
  iconFor(name, index) { return /caf/i.test(name) ? '☕' : /beb|jugo/i.test(name) ? '🥤' : /pan|post/i.test(name) ? '🥐' : /desay|comida/i.test(name) ? '🍳' : ['🍽️', '🥗', '🍰'][index % 3]; }
}

customElements.define('tipo-producto-list', TipoProductoList);
