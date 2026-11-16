import test from 'node:test';
import assert from 'node:assert/strict';

class ElementStub extends EventTarget {
  constructor() { super(); this.innerHTML = ''; this.isConnected = false; }
  attachShadow() { this.shadowRoot = { innerHTML: '', querySelector: () => null }; return this.shadowRoot; }
  querySelector() { return null; }
}
globalThis.HTMLElement = ElementStub;
globalThis.customElements = { define() {} };
const modules = await Promise.all([
  import('../../../public_html/js/boundary/components/cafefe_app.js'),
  import('../../../public_html/js/boundary/components/cafefe_header.js'),
  import('../../../public_html/js/boundary/components/login_view.js'),
  import('../../../public_html/js/boundary/components/catalog_view.js'),
  import('../../../public_html/js/boundary/components/tipo_producto_list.js'),
  import('../../../public_html/js/boundary/components/producto_list.js'),
  import('../../../public_html/js/boundary/components/orden_cart.js'),
  import('../../../public_html/js/boundary/components/orden_pendiente_list.js'),
  import('../../../public_html/js/boundary/components/orden_detail.js'),
  import('../../../public_html/js/boundary/components/factura_pendiente_list.js'),
  import('../../../public_html/js/boundary/components/factura_form.js'),
  import('../../../public_html/js/boundary/components/pago_form.js'),
  import('../../../public_html/js/boundary/components/ticket_view.js')
]);
import * as utils from '../../../public_html/js/boundary/boundary_utils.js';

test('todos los trece componentes exportan clases HTMLElement registrables', () => {
  const names = ['CafefeApp','CafefeHeader','LoginView','CatalogView','TipoProductoList','ProductoList','OrdenCart','OrdenPendienteList','OrdenDetail','FacturaPendienteList','FacturaForm','PagoForm','TicketView'];
  for (const name of names) {
    const component = modules.find(module => module[name])?.[name];
    assert.equal(typeof component, 'function', `${name} export`);
    assert.ok(new component() instanceof ElementStub, name);
  }
});

test('carrito agrega productos, acumula cantidades y representa el flujo', () => {
  const { OrdenCart } = modules.find(module => module.OrdenCart);
  const cart = new OrdenCart();
  cart.addProduct({ idProducto: 'p1', nombre: 'Café', precioSugerido: 2.5 });
  cart.addProduct({ idProducto: 'p1', nombre: 'Café', precioSugerido: 2.5 });
  assert.equal(cart.items.length, 1);
  assert.equal(cart.items[0].cantidad, 2);
  assert.match(cart.innerHTML, /Café/);
  assert.match(cart.innerHTML, /2/);
});

test('detalle de cocina renderiza datos escapados y el estado de despacho', () => {
  const { OrdenDetail } = modules.find(module => module.OrdenDetail);
  const detail = new OrdenDetail();
  detail.order = { idOrden: '<1>', cliente: 'Ana', estado: 'PENDIENTE', total: 5, productos: [{ nombreProducto: 'Café', cantidad: 2, precio: 2.5 }] };
  assert.match(detail.innerHTML, /&lt;1&gt;/);
  assert.match(detail.innerHTML, /Café/);
  detail.ready = true;
  assert.match(detail.innerHTML, /LISTA \/ DESPACHADA/);
});

test('boundary_utils da formato consistente y escapa HTML', () => {
  assert.equal(utils.escapeHTML(`<a & "b">`), '&lt;a &amp; &quot;b&quot;&gt;');
  assert.equal(utils.lineName({ producto: { nombre: 'Latte' } }), 'Latte');
  assert.equal(utils.productName({ idProducto: '1', nombreProducto: 'dto' }, new Map([['1', { nombre: 'Catálogo' }]])), 'Catálogo');
  assert.equal(utils.orderClientName({ cliente: 'Mostrador', productos: [{ observaciones: 'Eva · leche vegetal' }] }), 'Eva');
  assert.equal(utils.employeeGreeting({ nombre: 'Sol', roles: [{ nombre: 'BARISTA' }] }), '¡Hola, Barista Sol!');
  assert.match(utils.formatMoney(12.5), /12[.,]50/);
});

test('TicketView refleja factura, relación de catálogo y desglose de pago', () => {
  const { TicketView } = modules.find(module => module.TicketView);
  const ticket = new TicketView();
  ticket.productsById = new Map([['p1', { nombre: 'Moka' }]]);
  ticket.paymentDetails = [{ tipoPago: 'QR', monto: 5 }];
  ticket.invoice = { idFactura: 'f1', cliente: 'Ana', total: 5, fechaFacturacion: '2026-01-01', detalle: [{ idProducto: 'p1', cantidad: 1, precio: 5 }] };
  assert.match(ticket.shadowRoot.innerHTML, /Moka/);
  assert.match(ticket.shadowRoot.innerHTML, /Efectivo|QR/);
  assert.match(ticket.shadowRoot.innerHTML, /Factura #f1/);
});
