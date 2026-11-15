import test from 'node:test';
import assert from 'node:assert/strict';

class TestHTMLElement extends EventTarget {
  attachShadow() {
    this.shadowRoot = {
      innerHTML: '',
      querySelector: () => ({ addEventListener() {} })
    };
    return this.shadowRoot;
  }
}

globalThis.HTMLElement = TestHTMLElement;
globalThis.customElements = { define() {} };

const { TicketView, formatTicketDate } = await import('../../../../public_html/js/boundary/components/ticket_view.js');

test('el ticket muestra el nombre del catálogo, una fecha y el desglose de medios pagados', () => {
  const ticket = new TicketView();
  ticket.productsById = new Map([
    ['producto-1', { idProducto: 'producto-1', nombre: 'Capuchino Grande (16oz)' }]
  ]);
  ticket.paymentDetails = [
    { tipoPago: 'EFECTIVO', monto: 50.5 },
    { tipoPago: 'TARJETA', monto: 50 }
  ];
  ticket.invoice = {
    idFactura: 'factura-1', cliente: 'Ana', total: 100.5,
    fechaFacturacion: '2026-11-15T12:00:00Z',
    detalle: [{ idProducto: 'producto-1', cantidad: 1, precio: 100.5 }]
  };

  const html = ticket.shadowRoot.innerHTML;
  assert.match(html, /1 × Capuchino Grande \(16oz\)/);
  assert.match(html, new RegExp(`Fecha: ${formatTicketDate('2026-11-15T12:00:00Z')}`));
  assert.match(html, /Efectivo/);
  assert.match(html, /Tarjeta/);
  assert.match(html, /\$50\.50/);
  assert.match(html, /\$50\.00/);
});

test('el ticket no deja la fecha vacía si la factura no trae fecha', () => {
  const ticket = new TicketView();
  ticket.invoice = {
    idFactura: 'factura-2', cliente: 'Luis', total: 0,
    fechaFacturacion: '', detalle: [], pagos: []
  };
  assert.match(ticket.shadowRoot.innerHTML, /Fecha: [^<]+/);
  assert.equal(formatTicketDate('', new Date('2026-11-15T12:00:00Z')).length > 0, true);
});
