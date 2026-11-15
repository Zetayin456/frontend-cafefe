import test from 'node:test';
import assert from 'node:assert/strict';

class TestHTMLElement extends EventTarget {
  constructor() {
    super();
    this.innerHTML = '';
    this.onclick = null;
  }
}

globalThis.HTMLElement = TestHTMLElement;
globalThis.customElements = { define() {} };

const [{ CafefeController }, { OrdenDespachoStore }, { OrdenDetail }, { OrdenPendienteList }, { CafefeApp }, { FacturaForm }, { PagoForm }] = await Promise.all([
  import('../../../../public_html/js/control/cafefe_controller.js'),
  import('../../../../public_html/js/control/orden_despacho_store.js'),
  import('../../../../public_html/js/boundary/components/orden_detail.js'),
  import('../../../../public_html/js/boundary/components/orden_pendiente_list.js'),
  import('../../../../public_html/js/boundary/components/cafefe_app.js'),
  import('../../../../public_html/js/boundary/components/factura_form.js'),
  import('../../../../public_html/js/boundary/components/pago_form.js')
]);

test('el clic sincroniza al instante tarjeta y detalle sin recargar ni consultar el backend', () => {
  const stored = new Map();
  const storage = {
    getItem: key => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value)
  };
  const controller = new CafefeController({ ordenDespachoStore: new OrdenDespachoStore(storage) });
  const order = { idOrden: 'orden-reactiva-1', cliente: 'Ana', estado: 'PENDIENTE_COCINA', productos: [], total: 0 };
  let backendCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { backendCalls += 1; throw new Error('No se esperaba una petición HTTP'); };

  try {
    const list = new OrdenPendienteList();
    list._controller = controller;
    list._mode = null;
    list.orders = [order];
    list.productsById = new Map();
    list.selectedOrderId = order.idOrden;
    list.render();

    const detail = new OrdenDetail();
    detail.controller = controller;
    detail.order = order;

    const app = Object.create(CafefeApp.prototype);
    app._controller = controller;
    app.querySelector = selector => selector === '.reception-orders orden-pendiente-list' ? list : selector === '.reception-detail orden-detail' ? detail : null;
    app.toast = () => {};
    detail.addEventListener('despacho-solicitado', event => app.onDispatchRequest(event));

    const clickDispatchButton = () => detail.onclick({ target: { closest: selector => selector === '[data-toggle-dispatch]' ? {} : null } });

    clickDispatchButton();
    assert.deepEqual([...controller.obtenerOrdenesListas()], [order.idOrden]);
    assert.equal(detail._ready, true, 'el panel debe releer el estado persistido al recibir el cambio');
    assert.match(list.innerHTML, /badge green[^>]*>LISTA \/ DESPACHADA/);
    assert.match(detail.innerHTML, /Orden lista \/ despachada/);
    assert.match(detail.innerHTML, /badge green[^>]*>LISTA \/ DESPACHADA/);
    assert.match(detail.innerHTML, />Revertir a pendiente</);
    assert.equal(list.selectedOrderId, order.idOrden);

    clickDispatchButton();
    assert.deepEqual([...controller.obtenerOrdenesListas()], []);
    assert.match(list.innerHTML, />PENDIENTE_COCINA</);
    assert.match(detail.innerHTML, /Orden pendiente de cocina/);
    assert.match(detail.innerHTML, />Marcar como lista \/ despachada</);
    assert.equal(backendCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Caja muestra despacho local y nombres del catálogo en órdenes por facturar y detalle', () => {
  const order = {
    idOrden: 'orden-caja-1', cliente: 'Ana', estado: 'PENDIENTE_COCINA', total: 4.5,
    productos: [{ idProducto: 'producto-1', cantidad: 1, observaciones: '' }]
  };
  const catalog = new Map([['producto-1', { idProducto: 'producto-1', nombre: 'Capuchino Grande (16oz)' }]]);
  const list = new OrdenPendienteList();
  list._controller = { obtenerOrdenesListas: () => new Set([order.idOrden]) };
  list._mode = 'invoice';
  list.orders = [order];
  list.productsById = catalog;
  list.catalogUnavailable = false;
  list.render();

  assert.match(list.innerHTML, /badge green[^>]*>LISTA \/ DESPACHADA/);
  assert.match(list.innerHTML, /1 × Capuchino Grande \(16oz\)/);
  assert.match(list.innerHTML, /Generar factura/);
  assert.equal((list.innerHTML.match(/orden-caja-1/g) || []).length >= 1, true, 'la orden despachada continúa disponible para facturar');

  const factura = new FacturaForm();
  factura.order = order;
  factura.productsById = catalog;
  factura.boxes = [];
  factura.employeeRoleId = 'rol-caja';
  factura.querySelector = () => ({ addEventListener() {} });
  factura.render();
  assert.match(factura.innerHTML, /1 × Capuchino Grande \(16oz\)/);

  const pago = new PagoForm();
  pago._productsById = catalog;
  pago._invoice = {
    idFactura: 'factura-1', idOrden: order.idOrden, cliente: 'Ana', total: 4.5,
    detalle: [{ idProducto: 'producto-1', cantidad: 1, precio: 4.5 }]
  };
  pago.querySelector = () => ({ addEventListener() {} });
  pago.render();
  assert.match(pago.innerHTML, /1 × Capuchino Grande \(16oz\)/);
});
