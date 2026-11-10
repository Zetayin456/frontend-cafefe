import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHTML, money, normalizeOrder, orderTotal } from '../public_html/js/data.js';

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
