import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultDAO } from '../public_html/js/control/default_dao.js';
import { EmpleadoDAO } from '../public_html/js/control/empleado_dao.js';
import { OrdenDAO } from '../public_html/js/control/orden_dao.js';
import { FacturaDAO } from '../public_html/js/control/factura_dao.js';
import { PagoDAO } from '../public_html/js/control/pago_dao.js';
import { ProductoDAO } from '../public_html/js/control/producto_dao.js';
import { TipoProductoDAO } from '../public_html/js/control/tipo_producto_dao.js';
import { CajaDAO } from '../public_html/js/control/caja_dao.js';
import { CafefeController } from '../public_html/js/control/cafefe_controller.js';
import { DefaultError } from '../public_html/js/entity/default_error.js';
import { DefaultResponse } from '../public_html/js/entity/default_response.js';
import { Orden } from '../public_html/js/entity/orden.js';
import { Factura } from '../public_html/js/entity/factura.js';
import { Producto } from '../public_html/js/entity/producto.js';
import { TipoProducto } from '../public_html/js/entity/tipo_producto.js';
import { Caja } from '../public_html/js/entity/caja.js';
import { Empleado } from '../public_html/js/entity/empleado.js';
import { EmpleadoRol } from '../public_html/js/entity/empleado_rol.js';
import { OrdenProducto } from '../public_html/js/entity/orden_producto.js';
import { FacturaOrdenProducto } from '../public_html/js/entity/factura_orden_producto.js';
import { Pago } from '../public_html/js/entity/pago.js';
import { PagoDetalle } from '../public_html/js/entity/pago_detalle.js';

const jsonResponse = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });

test('DefaultResponse conserva valores base y DefaultError expone message', () => {
  const response = new DefaultResponse();
  assert.deepEqual(response.datos, []);
  assert.equal(response.totales, -1);
  const error = new DefaultError({ error: 'No autorizado', mensaje: 'Credencial inválida', status: 401 });
  assert.equal(error.message, 'Credencial inválida');
  assert.equal(error.status, 401);
});

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

test('DefaultDAO guarda únicamente GET exitosos con su header total-registros', async () => {
  const previousFetch = globalThis.fetch; const previousStorage = globalThis.localStorage; const store = new Map();
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method || 'GET', 'GET');
    return jsonResponse([{ idProducto: 'p-1' }], 200, { 'total-registros': '1' });
  };
  try {
    await new DefaultDAO('/v1/productos').findRange();
    const cached = JSON.parse(store.get('cafefe-api:/v1/productos?first=0&max=20'));
    assert.equal(cached.total, '1');
    assert.deepEqual(cached.payload, [{ idProducto: 'p-1' }]);
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

test('findRange rechaza first y max fuera de contrato', async () => {
  const dao = new DefaultDAO('/v1/productos');
  await assert.rejects(dao.findRange(-1, 20), error => error instanceof DefaultError && error.status === 400);
  await assert.rejects(dao.findRange(0, 0), error => error instanceof DefaultError && error.status === 400);
});

test('entidades mapean alias de orden y detalle conservando camelCase', () => {
  const order = Orden.fromJSON({ id: 'o-1', nombreCliente: 'Ana', montoTotal: 5, detalles: [{ producto: { idProducto: 'p-1', nombre: 'Café', precioSugerido: 2.5 }, cantidad: 2 }] });
  assert.equal(order.idOrden, 'o-1');
  assert.equal(order.cliente, 'Ana');
  assert.equal(order.productos[0].idProducto, 'p-1');
  assert.equal(order.total, 5);
  const invoice = Factura.fromJSON({ idFactura: 'f-1', idOrden: 'o-1', total: 5, detalle: [{ nombreProducto: 'Café', precio: 2.5, cantidad: 2 }] });
  assert.equal(invoice.detalle[0].nombreProducto, 'Café');
  assert.equal(invoice.total, 5);
});

test('fromJSON mapea entidades de catálogo, empleado, detalle de factura y pagos', () => {
  const product = Producto.fromJSON({ idProducto: 'p-1', nombre: 'Café', precioSugerido: '2.50', activo: true, idTipoProducto: 'tp-1' });
  assert.equal(product.precioSugerido, 2.5);
  assert.equal(product.idTipoProducto, 'tp-1');
  assert.equal(TipoProducto.fromJSON({ idTipoProducto: 'tp-1', nombre: 'Bebidas', activo: true }).nombre, 'Bebidas');
  assert.equal(Caja.fromJSON({ idCaja: 'c-1', nombre: 'Caja 1', activo: true }).idCaja, 'c-1');
  const role = EmpleadoRol.fromJSON({ idEmpleadoRol: 'er-1', idRol: 'r-1', nombre: 'CAJERO' });
  const employee = Empleado.fromJSON({ idEmpleado: 'e-1', nombre: 'Ana', apellido: 'Pérez', activo: true, roles: [role] });
  assert.equal(employee.roles[0].idEmpleadoRol, 'er-1');
  const line = OrdenProducto.fromJSON({ producto: { idProducto: 'p-1', nombre: 'Café', precioSugerido: 2.5 }, cantidad: 2 });
  assert.equal(line.nombreProducto, 'Café');
  assert.equal(line.precio, 2.5);
  assert.equal(FacturaOrdenProducto.fromJSON({ idFacturaOrdenProducto: 'fop-1', nombreProducto: 'Café', cantidad: 1 }).idFacturaOrdenProducto, 'fop-1');
  const payment = Pago.fromJSON({ idPago: 'pay-1', idFactura: 'f-1', detalles: [{ tipoPago: 'QR', monto: 2, referenciaExterna: 'ref-1' }] });
  assert.equal(payment.detalles[0].tipoPago, 'QR');
  assert.equal(PagoDetalle.fromJSON({ tipoPago: 'TARJETA', monto: '3.25' }).monto, 3.25);
  assert.throws(() => PagoDetalle.fromJSON({ tipoPago: 'TRANSFERENCIA', monto: 1 }), /no permitido/);
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
      { url: 'http://localhost:9080/cafeteria_pos/api/v1/productos?first=0&max=20', method: 'GET' },
      { url: 'http://localhost:9080/cafeteria_pos/api/v1/tipos-producto?first=0&max=20', method: 'GET' },
      { url: 'http://localhost:9080/cafeteria_pos/api/v1/cajas?first=0&max=20', method: 'GET' },
      { url: 'http://localhost:9080/cafeteria_pos/api/orden/pendientes', method: 'GET' },
      { url: 'http://localhost:9080/cafeteria_pos/api/factura/pendientes', method: 'GET' },
      { url: 'http://localhost:9080/cafeteria_pos/api/factura/f%2F1', method: 'GET' }
    ]);
  } finally { globalThis.fetch = previousFetch; }
});

test('EmpleadoDAO envía POST con el contrato de login oficial', async () => {
  const previousFetch = globalThis.fetch; let seen;
  globalThis.fetch = async (url, options) => { seen = { url, method: options.method, body: JSON.parse(options.body) }; return jsonResponse({ idEmpleado: 'e-1', nombre: 'Ana', roles: [{ idEmpleadoRol: 'er-1', idRol: 'r-1', nombre: 'CAJERO' }] }); };
  try {
    const employee = await new EmpleadoDAO().login('Ana', 'uuid-secreto');
    assert.equal(seen.url, 'http://localhost:9080/cafeteria_pos/api/empleado/login');
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
    assert.equal(seen.url, 'http://localhost:9080/cafeteria_pos/api/orden');
    assert.equal(seen.method, 'POST');
    assert.deepEqual(seen.body, { cliente: 'Ana', productos: [{ idProducto: 'p-1', cantidad: 2, observaciones: 'Ana' }] });
  } finally { globalThis.fetch = previousFetch; }
});

test('HU2 agrega nombre del cliente a observaciones sin copiar precio en Control', async () => {
  let sentOrder;
  const controller = new CafefeController({ ordenDAO: { create: async order => { sentOrder = order; return order; } } });
  await controller.crearOrden({ cliente: 'Ana', productos: [{ idProducto: 'p-1', cantidad: 2, precio: 99, observaciones: 'Sin azúcar' }] });
  assert.equal(sentOrder.cliente, 'Ana');
  assert.deepEqual(sentOrder.productos.map(({ idProducto, cantidad, observaciones }) => ({ idProducto, cantidad, observaciones })), [{ idProducto: 'p-1', cantidad: 2, observaciones: 'Ana · Sin azúcar' }]);
});

test('FacturaDAO crea factura con caja y rol de empleado', async () => {
  const previousFetch = globalThis.fetch; let seen;
  globalThis.fetch = async (url, options) => { seen = { url, method: options.method, body: JSON.parse(options.body) }; return jsonResponse({ idFactura: 'f-1', idOrden: 'o-1', estado: 'PENDIENTE', detalle: [], total: 10 }, 201); };
  try {
    const invoice = await new FacturaDAO().create({ idOrden: 'o-1', idCaja: 'c-1', idEmpleadoRol: 'er-1', cliente: 'Ana', observaciones: 'Venta local' });
    assert.equal(seen.url, 'http://localhost:9080/cafeteria_pos/api/factura');
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
    assert.equal(seen.url, 'http://localhost:9080/cafeteria_pos/api/pago');
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

test('Controller valida que la suma del split sea exacta antes del POST', async () => {
  let calls = 0;
  const controller = new CafefeController({ pagoDAO: { create: async () => { calls += 1; } } });
  const factura = { idFactura: 'f-1', total: 10 };
  await assert.rejects(controller.registrarPago({ factura, detalles: [{ tipoPago: 'EFECTIVO', monto: 9.99 }] }), /coincidir con el total/);
  assert.equal(calls, 0);
  await controller.registrarPago({ factura, detalles: [{ tipoPago: 'EFECTIVO', monto: 6 }, { tipoPago: 'QR', monto: 4 }] });
  assert.equal(calls, 1);
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

test('DefaultDAO usa caché únicamente cuando una petición GET falla por red', async () => {
  const previousFetch = globalThis.fetch; const previousStorage = globalThis.localStorage;
  const store = new Map([['cafefe-api:/v1/productos?first=0&max=20', JSON.stringify({ payload: [{ idProducto: 'cached' }], total: '1' })]]);
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
  globalThis.fetch = async () => { throw new TypeError('offline'); };
  try {
    const result = await new DefaultDAO('/v1/productos').findRange();
    assert.equal(result.datos[0].idProducto, 'cached');
    assert.equal(result.totales, 1);
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
