import { emit, escapeHTML, formatMoney, orderClientName, productName } from '../boundary_utils.js';

export class OrdenPendienteList extends HTMLElement {
  set controller(value) { this._controller = value; }
  async connectedCallback() {
    this._mode ||= this.getAttribute('mode');
    this.innerHTML = '<div class="empty">Cargando órdenes…</div>';
    try {
      const [ordersResult, productsResult] = await Promise.allSettled([
        this._controller.cargarOrdenesPendientes(),
        this._controller.cargarProductos()
      ]);
      if (ordersResult.status === 'rejected') throw ordersResult.reason;
      this.orders = ordersResult.value;
      this.products = productsResult.status === 'fulfilled' ? productsResult.value : [];
      this.productsById = new Map(this.products.map(product => [String(product.idProducto), product]));
      this.catalogUnavailable = productsResult.status === 'rejected';
      emit(this, 'catalogo-productos-cargado', { productsById: this.productsById });
      this.render();
    }
    catch (error) { this.innerHTML = `<div class="empty" role="alert">No se pudieron cargar las órdenes: ${escapeHTML(error.message)}</div>`; }
  }
  set mode(value) { this._mode = value; if (this.orders) this.render(); }
  setOrderReady() { this.render(); }
  render() {
    const readyOrderIds = this._controller.obtenerOrdenesListas();
    const catalogNotice = this.catalogUnavailable
      ? '<p class="form-note" role="status">No se pudo consultar el catálogo; se muestran los nombres incluidos en la orden cuando están disponibles.</p>'
      : '';
    this.innerHTML = this.orders.length ? `${catalogNotice}<div class="order-grid">${this.orders.map(order => {
      const selected = this._mode !== 'invoice' && String(order.idOrden) === this.selectedOrderId;
      const ready = readyOrderIds.has(String(order.idOrden));
      const status = ready ? 'LISTA / DESPACHADA' : order.estado || 'PENDIENTE_COCINA';
      return `<article class="order-card${selected ? ' selected' : ''}"><button class="record-select" data-select-order="${escapeHTML(order.idOrden)}" aria-pressed="${selected}"><span><strong>Orden #${escapeHTML(order.idOrden)}</strong><small>${escapeHTML(orderClientName(order))} · ${order.productos.length} productos</small></span><span class="badge${ready ? ' green' : ''}">${escapeHTML(status)}</span></button><div class="total"><span>Total</span><span>${formatMoney(order.total)}</span></div><p>${order.productos.map(item => `${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this.productsById))}`).join(' · ')}</p>${this._mode === 'invoice' ? `<button class="btn small" data-create-invoice="${escapeHTML(order.idOrden)}">Generar factura</button>` : ''}</article>`;
    }).join('')}</div>` : '<div class="empty">No hay órdenes pendientes.</div>';
    this.onclick = event => {
      const invoice = event.target.closest('[data-create-invoice]');
      if (invoice) { const order = this.orders.find(item => String(item.idOrden) === invoice.dataset.createInvoice); if (order) emit(this, 'orden-seleccionada', { order, productsById: this.productsById, facturar: true }); return; }
      const select = event.target.closest('[data-select-order]');
      if (select) {
        const order = this.orders.find(item => String(item.idOrden) === select.dataset.selectOrder);
        if (order) {
          this.selectedOrderId = String(order.idOrden);
          this.render();
          emit(this, 'orden-seleccionada', { order, productsById: this.productsById });
        }
      }
    };
  }
}

customElements.define('orden-pendiente-list', OrdenPendienteList);
