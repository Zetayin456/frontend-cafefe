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
const productLogic = await import('../../../public_html/js/boundary/components/producto_list.js');
const orderLogic = await import('../../../public_html/js/boundary/components/orden_pendiente_list.js');
const paymentLogic = await import('../../../public_html/js/boundary/components/pago_form.js');

test('todos los Web Components extienden HTMLElement y montan un ShadowRoot', () => {
  const names = ['CafefeApp','CafefeHeader','LoginView','CatalogView','TipoProductoList','ProductoList','OrdenCart','OrdenPendienteList','OrdenDetail','FacturaPendienteList','FacturaForm','PagoForm','TicketView'];
  for (const name of names) {
    const component = modules.find(module => module[name])?.[name];
    assert.equal(typeof component, 'function', `${name} export`);
    const instance = new component();
    assert.ok(instance instanceof ElementStub, name);
    assert.ok(instance.shadowRoot, `${name} debe encapsular su vista`);
  }
});

test('el filtro solo incluye productos activos de la categoría seleccionada', () => {
  const products = [
    { idProducto:'a', idTipoProducto:'cafe', activo:true },
    { idProducto:'b', tipoProducto:{ idTipoProducto:'cafe' }, activo:true },
    { idProducto:'c', idTipoProducto:'te', activo:true },
    { idProducto:'d', idTipoProducto:'cafe', activo:false },
    { idProducto:'e', activo:true }
  ];
  assert.deepEqual(productLogic.filterProductsByCategory(products, 'cafe').map(item => item.idProducto), ['a','b']);
  assert.deepEqual(productLogic.filterProductsByCategory(products).map(item => item.idProducto), ['a','b','c','e']);
});

test('el tablero oculta órdenes despachadas y Caja conserva la lista por facturar', () => {
  const orders = [{ idOrden:'1' }, { idOrden:'2' }]; const dispatched = new Set(['1']);
  assert.deepEqual(orderLogic.visibleOrdersForMode(orders, 'reception', dispatched), [{ idOrden:'2' }]);
  assert.deepEqual(orderLogic.visibleOrdersForMode(orders, 'invoice', dispatched), orders);
});

test('el saldo y la validación de pagos fraccionados usan centavos', () => {
  assert.equal(paymentLogic.calculateInvoiceBalance({ total: 20, pagos: [{ detalles: [{ monto: 5.25 }] }] }), 14.75);
  assert.equal(paymentLogic.calculateInvoiceBalance({ total: 20, saldoPendiente: 7.5 }), 7.5);
  assert.equal(paymentLogic.isPaymentSplitValid([{ tipoPago:'EFECTIVO', monto: 6.25 }, { tipoPago:'QR', monto: 8.5 }], 14.75), true);
  assert.equal(paymentLogic.isPaymentSplitValid([{ tipoPago:'EFECTIVO', monto: 14.74 }], 14.75), false);
  assert.equal(paymentLogic.isPaymentSplitValid([{ tipoPago:'QR', monto: 0 }], 14.75), false);
});

test('boundary_utils mantiene formato y escapes necesarios para las vistas', () => {
  assert.equal(utils.escapeHTML(`<a & "b">`), '&lt;a &amp; &quot;b&quot;&gt;');
  assert.equal(utils.lineName({ producto: { nombre: 'Latte' } }), 'Latte');
  assert.equal(utils.productName({ idProducto: '1', nombreProducto: 'dto' }, new Map([['1', { nombre: 'Catálogo' }]])), 'Catálogo');
  assert.equal(utils.orderClientName({ cliente: 'Mostrador', productos: [{ observaciones: 'Eva · leche vegetal' }] }), 'Eva');
  assert.equal(utils.employeeGreeting({ nombre: 'Sol', roles: [{ nombre: 'BARISTA' }] }), '¡Hola, Barista Sol!');
  assert.match(utils.formatMoney(12.5), /12[.,]50/);
});

test('TicketView serializa factura, catálogo y pago recibido', () => {
  const { TicketView } = modules.find(module => module.TicketView);
  const ticket = new TicketView();
  ticket.productsById = new Map([['p1', { nombre: 'Moka' }]]);
  ticket.paymentDetails = [{ tipoPago: 'QR', monto: 5 }];
  ticket.invoice = { idFactura: 'f1', cliente: 'Ana', total: 5, fechaFacturacion: '2026-01-01', detalle: [{ idProducto: 'p1', cantidad: 1, precio: 5 }] };
  assert.match(ticket.shadowRoot.innerHTML, /Moka/);
  assert.match(ticket.shadowRoot.innerHTML, /QR/);
  assert.match(ticket.shadowRoot.innerHTML, /Factura #f1/);
});
