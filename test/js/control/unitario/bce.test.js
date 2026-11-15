import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultDAO } from '../../../../public_html/js/control/default_dao.js';
import { EmpleadoDAO } from '../../../../public_html/js/control/empleado_dao.js';
import { OrdenDAO } from '../../../../public_html/js/control/orden_dao.js';
import { FacturaDAO } from '../../../../public_html/js/control/factura_dao.js';
import { PagoDAO } from '../../../../public_html/js/control/pago_dao.js';
import { OrdenDespachoStore } from '../../../../public_html/js/control/orden_despacho_store.js';
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
import { employeeFullName, employeeGreeting, employeeRoleLabel, orderClientName, productName } from '../../../../public_html/js/boundary/boundary_utils.js';

const jsonResponse = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });

test('DefaultResponse conserva valores base y DefaultError expone message', () => {
  const response = new DefaultResponse();
  assert.deepEqual(response.datos, []);
  assert.equal(response.totales, -1);
  const error = new DefaultError({ error: 'No autorizado', mensaje: 'Credencial inválida', status: 401 });
  assert.equal(error.message, 'Credencial inválida');
  assert.equal(error.status, 401);
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

test('HU2 agrega nombre del cliente a observaciones sin copiar precio en Control', async () => {
  let sentOrder;
  const controller = new CafefeController({ ordenDAO: { create: async order => { sentOrder = order; return order; } } });
  await controller.crearOrden({ cliente: 'Ana', productos: [{ idProducto: 'p-1', cantidad: 2, precio: 99, observaciones: 'Sin azúcar' }] });
  assert.equal(sentOrder.cliente, 'Ana');
  assert.deepEqual(sentOrder.productos.map(({ idProducto, cantidad, observaciones }) => ({ idProducto, cantidad, observaciones })), [{ idProducto: 'p-1', cantidad: 2, observaciones: 'Ana · Sin azúcar' }]);
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

test('Recepción resuelve el nombre del producto y extrae el cliente de observaciones', () => {
  const productsById = new Map([['p-1', { idProducto: 'p-1', nombre: 'Capuchino Grande' }]]);
  const order = {
    cliente: 'Cliente mostrador',
    productos: [{ idProducto: 'p-1', observaciones: 'Ana · Sin azúcar' }]
  };
  assert.equal(productName(order.productos[0], productsById), 'Capuchino Grande');
  assert.equal(orderClientName(order), 'Ana');
  assert.equal(orderClientName({ cliente: 'Luis', productos: order.productos }), 'Luis');
});

test('la navegación y las vistas de empleado pueden saludar con nombre y rol de sesión', () => {
  const barista = { nombre: 'Miguel', apellido: 'Ruiz', roles: [{ nombre: 'BARISTA' }] };
  const cashier = { nombre: 'Ana', roles: [{ nombre: 'CAJERO' }] };
  assert.equal(employeeFullName(barista), 'Miguel Ruiz');
  assert.equal(employeeRoleLabel(barista), 'Barista');
  assert.equal(employeeGreeting(barista), '¡Hola, Barista Miguel Ruiz!');
  assert.equal(employeeRoleLabel(cashier), 'Cajera');
  assert.equal(employeeGreeting(cashier), '¡Hola, Cajera Ana!');
});

test('el despacho se persiste por id de orden y permite revertir a pendiente', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  const store = new OrdenDespachoStore(storage);
  assert.equal(store.setReady('orden-1', true), true);
  assert.deepEqual([...new OrdenDespachoStore(storage).getReadyOrderIds()], ['orden-1']);
  assert.equal(store.setReady('orden-1', false), false);
  assert.deepEqual([...store.getReadyOrderIds()], []);
});

test('el despacho se elimina al cobrar la factura y se conserva si falla el pago', async () => {
  const store = new OrdenDespachoStore({ getItem: () => null, setItem() {} });
  store.setReady('orden-2', true);
  const invoice = { idFactura: 'factura-2', idOrden: 'orden-2', total: 5 };
  const details = [{ tipoPago: 'EFECTIVO', monto: 5 }];
  const failingController = new CafefeController({ ordenDespachoStore: store, pagoDAO: { create: async () => { throw new Error('Backend no disponible'); } } });
  await assert.rejects(failingController.registrarPago({ factura: invoice, detalles: details }), /Backend no disponible/);
  assert.deepEqual([...store.getReadyOrderIds()], ['orden-2']);

  const controller = new CafefeController({ ordenDespachoStore: store, pagoDAO: { create: async () => ({ idPago: 'pago-2' }) } });
  await controller.registrarPago({ factura: invoice, detalles: details });
  assert.deepEqual([...store.getReadyOrderIds()], []);
});
