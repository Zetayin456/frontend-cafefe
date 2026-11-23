import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultDAO } from '../../../../public_html/js/control/default_dao.js';
import { EmpleadoDAO } from '../../../../public_html/js/control/empleado_dao.js';
import { OrdenDAO } from '../../../../public_html/js/control/orden_dao.js';
import { FacturaDAO } from '../../../../public_html/js/control/factura_dao.js';
import { PagoDAO } from '../../../../public_html/js/control/pago_dao.js';
import { ProductoDAO } from '../../../../public_html/js/control/producto_dao.js';
import { TipoProductoDAO } from '../../../../public_html/js/control/tipo_producto_dao.js';
import { CajaDAO } from '../../../../public_html/js/control/caja_dao.js';
import { CafefeController } from '../../../../public_html/js/control/cafefe_controller.js';
import { DefaultError } from '../../../../public_html/js/entity/default_error.js';
import { DefaultResponse } from '../../../../public_html/js/entity/default_response.js';
import { Orden } from '../../../../public_html/js/entity/orden.js';
import { Factura } from '../../../../public_html/js/entity/factura.js';
import { Producto } from '../../../../public_html/js/entity/producto.js';
import { TipoProducto } from '../../../../public_html/js/entity/tipo_producto.js';
import { Caja } from '../../../../public_html/js/entity/caja.js';
import { Empleado } from '../../../../public_html/js/entity/empleado.js';
import { EmpleadoRol } from '../../../../public_html/js/entity/empleado_rol.js';
import { OrdenProducto } from '../../../../public_html/js/entity/orden_producto.js';
import { FacturaOrdenProducto } from '../../../../public_html/js/entity/factura_orden_producto.js';
import { Pago } from '../../../../public_html/js/entity/pago.js';
import { PagoDetalle } from '../../../../public_html/js/entity/pago_detalle.js';

const jsonResponse = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });

test('findRange lee total-registros y convierte cada DTO en entidad', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    assert.match(url, /\/v1\/productos\?first=20&max=10$/);
    return jsonResponse([{ idProducto: 'p-1', nombre: 'Café', precioSugerido: 2.5, activo: true }], 200, { 'total-registros': '37' });
  };
  try {
    const dao = new DefaultDAO('/v1/productos', dto => ({ ...dto, precioSugerido: Number(dto.precioSugerido) }));
    const response = await dao.findRange(20, 10);
    assert.equal(response.totales, 37);
    assert.equal(response.datos[0].idProducto, 'p-1');
  } finally { globalThis.fetch = previousFetch; }
});

test('DefaultDAO no persiste respuestas de API en localStorage', async () => {
  const previousFetch = globalThis.fetch; const previousStorage = globalThis.localStorage; let storageCalls = 0;
  globalThis.localStorage = { getItem() { storageCalls++; return null; }, setItem() { storageCalls++; }, removeItem() { storageCalls++; } };
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method || 'GET', 'GET');
    return jsonResponse([{ idProducto: 'p-1' }], 200, { 'total-registros': '1' });
  };
  try {
    const response = await new DefaultDAO('/v1/productos').findRange();
    assert.equal(response.totales, 1);
    assert.equal(storageCalls, 0);
  } finally { globalThis.fetch = previousFetch; globalThis.localStorage = previousStorage; }
});

test('findRange usa first=0&max=20 por defecto y deja totales en -1 si falta el header', async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async url => {
    assert.match(url, /\/v1\/productos\?first=0&max=20$/);
    return jsonResponse([{ idProducto: 'p-1' }]);
  };
  try {
    const result = await new DefaultDAO('/v1/productos').findRange();
    assert.equal(result.totales, -1);
    assert.equal(result.datos.length, 1);
  } finally { globalThis.fetch = previousFetch; }
});

test('findAll comienza la paginación con max=20 y respeta el header total-registros', async () => {
  const previousFetch = globalThis.fetch; const seen = [];
  globalThis.fetch = async url => {
    seen.push(url);
    const first = Number(new URL(url).searchParams.get('first'));
    const data = first === 0 ? Array.from({ length: 20 }, (_, i) => ({ idProducto: `p-${i}` })) : [{ idProducto: 'p-20' }];
    return jsonResponse(data, 200, { 'total-registros': '21' });
  };
  try {
    const result = await new DefaultDAO('/v1/productos').findAll();
    assert.equal(result.datos.length, 21);
    assert.equal(result.totales, 21);
    assert.match(seen[0], /first=0&max=20$/);
    assert.match(seen[1], /first=20&max=20$/);
  } finally { globalThis.fetch = previousFetch; }
});

test('DAOs consultan todos los recursos GET con sus rutas y first=0&max=20', async () => {
  const previousFetch = globalThis.fetch; const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, method: options.method || 'GET' });
    const payload = String(url).endsWith('/factura/f%2F1') ? { idFactura: 'f/1', detalle: [], total: 0 } : [];
    return jsonResponse(payload, 200, { 'total-registros': '0' });
  };
  try {
    await new ProductoDAO().findRange();
    await new TipoProductoDAO().findRange();
    await new CajaDAO().findRange();
    await new OrdenDAO().findPending();
    await new FacturaDAO().findPending();
    await new FacturaDAO().findById('f/1');
    assert.deepEqual(calls, [
      { url: 'http://cafefe.backend:9080/cafefe/api/v1/productos?first=0&max=20', method: 'GET' },
      { url: 'http://cafefe.backend:9080/cafefe/api/v1/tipos-producto?first=0&max=20', method: 'GET' },
      { url: 'http://cafefe.backend:9080/cafefe/api/v1/cajas?first=0&max=20', method: 'GET' },
      { url: 'http://cafefe.backend:9080/cafefe/api/orden/pendientes', method: 'GET' },
      { url: 'http://cafefe.backend:9080/cafefe/api/factura/pendientes', method: 'GET' },
      { url: 'http://cafefe.backend:9080/cafefe/api/factura/f%2F1', method: 'GET' }
    ]);
  } finally { globalThis.fetch = previousFetch; }
});

test('EmpleadoDAO envía POST con el contrato de login oficial', async () => {
  const previousFetch = globalThis.fetch; let seen;
  globalThis.fetch = async (url, options) => { seen = { url, method: options.method, body: JSON.parse(options.body) }; return jsonResponse({ idEmpleado: 'e-1', nombre: 'Ana', roles: [{ idEmpleadoRol: 'er-1', idRol: 'r-1', nombre: 'CAJERO' }] }); };
  try {
    const employee = await new EmpleadoDAO().login('Ana', 'uuid-secreto');
    assert.equal(seen.url, 'http://cafefe.backend:9080/cafefe/api/empleado/login');
    assert.equal(seen.method, 'POST');
    assert.deepEqual(seen.body, { nombre: 'Ana', contrasena: 'uuid-secreto' });
    assert.equal(employee.roles[0].idEmpleadoRol, 'er-1');
  } finally { globalThis.fetch = previousFetch; }
});

test('OrdenDAO envía POST con cliente y productos al endpoint /orden', async () => {
  const previousFetch = globalThis.fetch; let seen;
  globalThis.fetch = async (url, options) => { seen = { url, method: options.method, body: JSON.parse(options.body) }; return jsonResponse({ idOrden: 'o-1', cliente: 'Ana', productos: [] }, 201); };
  try {
    await new OrdenDAO().create(new Orden({ cliente: 'Ana', productos: [{ idProducto: 'p-1', cantidad: 2, observaciones: 'Ana' }] }));
    assert.equal(seen.url, 'http://cafefe.backend:9080/cafefe/api/orden');
    assert.equal(seen.method, 'POST');
    assert.deepEqual(seen.body, { cliente: 'Ana', productos: [{ idProducto: 'p-1', cantidad: 2, observaciones: 'Ana' }] });
  } finally { globalThis.fetch = previousFetch; }
});

test('FacturaDAO crea factura con caja y rol de empleado', async () => {
  const previousFetch = globalThis.fetch; let seen;
  globalThis.fetch = async (url, options) => { seen = { url, method: options.method, body: JSON.parse(options.body) }; return jsonResponse({ idFactura: 'f-1', idOrden: 'o-1', estado: 'PENDIENTE', detalle: [], total: 10 }, 201); };
  try {
    const invoice = await new FacturaDAO().create({ idOrden: 'o-1', idCaja: 'c-1', idEmpleadoRol: 'er-1', cliente: 'Ana', observaciones: 'Venta local' });
    assert.equal(seen.url, 'http://cafefe.backend:9080/cafefe/api/factura');
    assert.equal(seen.method, 'POST');
    assert.deepEqual(seen.body, { idOrden: 'o-1', idCaja: 'c-1', idEmpleadoRol: 'er-1', cliente: 'Ana', observaciones: 'Venta local' });
    assert.equal(invoice.idFactura, 'f-1');
  } finally { globalThis.fetch = previousFetch; }
});

test('PagoDAO envía varios medios al endpoint /pago', async () => {
  const previousFetch = globalThis.fetch; let seen;
  globalThis.fetch = async (url, options) => { seen = { url, method: options.method, body: JSON.parse(options.body) }; return jsonResponse({ idPago: 'pay-1', idFactura: 'f-1', detalles: [] }, 201); };
  try {
    await new PagoDAO().create({ idFactura: 'f-1', observaciones: 'Split', detalles: [{ tipoPago: 'EFECTIVO', monto: 2, referenciaExterna: null, observaciones: null }, { tipoPago: 'QR', monto: 1.5, referenciaExterna: 'ref-1', observaciones: null }] });
    assert.equal(seen.url, 'http://cafefe.backend:9080/cafefe/api/pago');
    assert.equal(seen.method, 'POST');
    assert.deepEqual(seen.body, {
      idFactura: 'f-1',
      observaciones: 'Split',
      detalles: [
        { tipoPago: 'EFECTIVO', monto: 2, referenciaExterna: null, observaciones: null },
        { tipoPago: 'QR', monto: 1.5, referenciaExterna: 'ref-1', observaciones: null }
      ]
    });
  } finally { globalThis.fetch = previousFetch; }
});

test('DefaultDAO no usa caché para ocultar un error HTTP', async () => {
  const previousFetch = globalThis.fetch; const previousStorage = globalThis.localStorage;
  const store = new Map([['cafefe-api:/v1/productos?first=0&max=20', JSON.stringify({ payload: [{ idProducto: 'cached' }], total: '1' })]]);
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
  globalThis.fetch = async () => jsonResponse({ error: 'fallo' }, 500);
  try {
    await assert.rejects(new DefaultDAO('/v1/productos').findRange(), error => error.status === 500);
  } finally { globalThis.fetch = previousFetch; globalThis.localStorage = previousStorage; }
});

test('DefaultError conserva status y detalle backend en respuestas HTTP de error', async () => {
  const previousFetch = globalThis.fetch;
  try {
    for (const status of [400, 404, 409, 500]) {
      globalThis.fetch = async () => jsonResponse({ error: `HTTP-${status}`, mensaje: `Backend ${status}` }, status);
      await assert.rejects(new DefaultDAO('/factura').post('/factura', {}), error => error instanceof DefaultError && error.status === status && error.error === `HTTP-${status}` && error.message === `Backend ${status}`);
    }
  } finally { globalThis.fetch = previousFetch; }
});

test('DefaultDAO reporta el error de red sin devolver datos de caché obsoletos', async () => {
  const previousFetch = globalThis.fetch; const previousStorage = globalThis.localStorage;
  const store = new Map([['cafefe-api:/v1/productos?first=0&max=20', JSON.stringify({ payload: [{ idProducto: 'cached' }], total: '1' })]]);
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  try {
    await assert.rejects(new DefaultDAO('/v1/productos').findRange(), error => error instanceof DefaultError && error.message.includes('offline'));
  } finally { globalThis.fetch = previousFetch; globalThis.localStorage = previousStorage; }
});

test('DefaultDAO nunca usa caché para simular una operación POST offline', async () => {
  const previousFetch = globalThis.fetch; const previousStorage = globalThis.localStorage;
  const store = new Map([['cafefe-api:/orden', JSON.stringify({ payload: { idOrden: 'cached' } })]]);
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  try {
    await assert.rejects(new DefaultDAO('/orden').post('/orden', { cliente: 'Ana', productos: [] }), error => error.message.includes('No se pudo conectar'));
  } finally { globalThis.fetch = previousFetch; globalThis.localStorage = previousStorage; }
});
