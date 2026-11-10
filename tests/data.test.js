import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHTML, money, normalizeOrder, orderTotal } from '../public_html/js/data.js';
import { api, API_BASE } from '../public_html/js/api.js';

test('calcula total con cantidades y decimales', () => {
  assert.equal(orderTotal([{ price: 2.25, quantity: 2 }, { price: 1.5, quantity: 1 }]), 6);
});

test('normaliza una orden del contrato en español', () => {
  const result = normalizeOrder({ idOrden: 12, nombreCliente: 'Ana', estado: 'Pendiente', detalles: [{ precio: 3, cantidad: 2 }] });
  assert.equal(result.id, 12);
  assert.equal(result.customerName, 'Ana');
  assert.equal(result.total, 6);
});

test('escapa caracteres HTML en contenido proveniente de la API', () => {
  assert.equal(escapeHTML(`<script a="x">'&`), '&lt;script a=&quot;x&quot;&gt;&#39;&amp;');
});

test('formatea montos como dólares', () => {
  assert.match(money(2.5), /2\.50/);
});

test('login envía nombre y UUID como contrasena al endpoint oficial', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => { request = { url, options, body: JSON.parse(options.body) }; return new Response(JSON.stringify({ idEmpleado: 'empleado-1', roles: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }); };
  try {
    await api.login('Ana', 'uuid-secreto');
    assert.equal(request.url, `${API_BASE}/empleado/login`);
    assert.deepEqual(request.body, { nombre: 'Ana', contrasena: 'uuid-secreto' });
  } finally { globalThis.fetch = originalFetch; }
});

test('orden pública usa idProducto, cantidad y observaciones según la guía', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => { request = { url, body: JSON.parse(options.body) }; return new Response(JSON.stringify({ idOrden: 'orden-1' }), { status: 201, headers: { 'Content-Type': 'application/json' } }); };
  try {
    await api.createOrder({ customerName: 'Ana', items: [{ idProducto: 'producto-1', quantity: 2, name: 'Café' }] });
    assert.equal(request.url, `${API_BASE}/orden`);
    assert.deepEqual(request.body, { cliente: 'Ana', productos: [{ idProducto: 'producto-1', cantidad: 2, observaciones: 'Ana' }] });
  } finally { globalThis.fetch = originalFetch; }
});

test('pago split envía varios detalles al endpoint oficial', async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => { request = { url, body: JSON.parse(options.body) }; return new Response(JSON.stringify({ idPago: 'pago-1' }), { status: 201, headers: { 'Content-Type': 'application/json' } }); };
  try {
    await api.createPayment({ invoiceId: 'factura-1', observations: 'Split', details: [{ method: 'EFECTIVO', amount: 2 }, { method: 'QR', amount: 1.5, reference: 'ref-123' }] });
    assert.equal(request.url, `${API_BASE}/pago`);
    assert.deepEqual(request.body, { idFactura: 'factura-1', observaciones: 'Split', detalles: [{ tipoPago: 'EFECTIVO', monto: 2, referenciaExterna: null, observaciones: null }, { tipoPago: 'QR', monto: 1.5, referenciaExterna: 'ref-123', observaciones: null }] });
  } finally { globalThis.fetch = originalFetch; }
});
