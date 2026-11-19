import test from 'node:test';
import assert from 'node:assert/strict';

class TestHTMLElement extends EventTarget { attachShadow() { this.shadowRoot = { innerHTML: '', querySelector: () => null }; return this.shadowRoot; } }
globalThis.HTMLElement = TestHTMLElement;
globalThis.customElements = { define() {} };
const [{ CafefeController }, { OrdenDespachoStore }, { visibleOrdersForMode }, { productName }] = await Promise.all([
  import('../../../../public_html/js/control/cafefe_controller.js'),
  import('../../../../public_html/js/control/orden_despacho_store.js'),
  import('../../../../public_html/js/boundary/components/orden_pendiente_list.js'),
  import('../../../../public_html/js/boundary/boundary_utils.js')
]);

test('despachar oculta la orden de recepción al instante y la mantiene disponible para facturación', () => {
  const stored = new Map();
  const store = new OrdenDespachoStore({ getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) });
  const controller = new CafefeController({ ordenDespachoStore: store });
  const orders = [{ idOrden:'1' }, { idOrden:'2' }];
  assert.deepEqual(visibleOrdersForMode(orders, 'reception', controller.obtenerOrdenesListas()), orders);
  assert.equal(controller.actualizarDespachoOrden('1', true), true);
  assert.deepEqual(visibleOrdersForMode(orders, 'reception', controller.obtenerOrdenesListas()), [{ idOrden:'2' }]);
  assert.deepEqual(visibleOrdersForMode(orders, 'invoice', controller.obtenerOrdenesListas()), orders);
  assert.equal(controller.actualizarDespachoOrden('1', false), false);
  assert.deepEqual(visibleOrdersForMode(orders, 'reception', controller.obtenerOrdenesListas()), orders);
});

test('el pedido de cocina usa los nombres de catálogo al recibir relaciones por id', () => {
  const productsById = new Map([['p1', { idProducto:'p1', nombre:'Capuchino Grande' }]]);
  assert.equal(productName({ idProducto:'p1', nombreProducto:'dto' }, productsById), 'Capuchino Grande');
  assert.equal(productName({ idProducto:'unknown', nombreProducto:'Nombre de respaldo' }, productsById), 'Nombre de respaldo');
});
