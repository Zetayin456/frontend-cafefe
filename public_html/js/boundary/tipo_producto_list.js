import { emit, escapeHTML } from './boundary_utils.js';

export class TipoProductoList extends HTMLElement {
  set controller(value) { this._controller = value; }
  async connectedCallback() {
    this.innerHTML = '<div class="category-row" aria-live="polite">Cargando categorías…</div>';
    try {
      const tipos = await this._controller.cargarTiposProducto();
      this.innerHTML = `<div class="category-row">${tipos.map((tipo, index) => `<button class="category-card" data-id="${escapeHTML(tipo.idTipoProducto)}" aria-pressed="false"><span class="category-icon" role="img" aria-label="${escapeHTML(tipo.nombre)}">${this.iconFor(tipo.nombre, index)}</span><span><strong>${escapeHTML(tipo.nombre)}</strong><small>Ver productos</small></span></button>`).join('') || '<p class="muted">No hay categorías activas.</p>'}</div>`;
      this.addEventListener('click', event => { const button = event.target.closest('[data-id]'); if (!button) return; this.querySelectorAll('[data-id]').forEach(item => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); }); emit(this, 'tipo-seleccionado', { idTipoProducto: button.dataset.id }); });
    } catch (error) { this.innerHTML = `<div class="empty" role="alert">No se pudieron cargar categorías: ${escapeHTML(error.message)}</div>`; }
  }
  iconFor(name, index) { return /caf/i.test(name) ? '☕' : /beb|jugo/i.test(name) ? '🥤' : /pan|post/i.test(name) ? '🥐' : /desay|comida/i.test(name) ? '🍳' : ['🍽️', '🥗', '🍰'][index % 3]; }
}

customElements.define('tipo-producto-list', TipoProductoList);
