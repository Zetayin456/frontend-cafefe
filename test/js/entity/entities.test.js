import test from 'node:test';
import assert from 'node:assert/strict';
import { Caja } from '../../../public_html/js/entity/caja.js';
import { DefaultError } from '../../../public_html/js/entity/default_error.js';
import { DefaultResponse } from '../../../public_html/js/entity/default_response.js';
import { Empleado } from '../../../public_html/js/entity/empleado.js';
import { EmpleadoRol } from '../../../public_html/js/entity/empleado_rol.js';
import { Factura } from '../../../public_html/js/entity/factura.js';
import { FacturaOrdenProducto } from '../../../public_html/js/entity/factura_orden_producto.js';
import { Orden } from '../../../public_html/js/entity/orden.js';
import { OrdenProducto } from '../../../public_html/js/entity/orden_producto.js';
import { Pago } from '../../../public_html/js/entity/pago.js';
import { PagoDetalle } from '../../../public_html/js/entity/pago_detalle.js';
import { Producto } from '../../../public_html/js/entity/producto.js';
import { TipoProducto } from '../../../public_html/js/entity/tipo_producto.js';

test('entidades simples instancian defaults y preservan sus campos al serializar', () => {
  for (const [Ctor, defaults] of [
    [Caja, { idCaja: null, nombre: '', activo: false, observaciones: null }],
    [EmpleadoRol, { idEmpleadoRol: null, idRol: null, nombre: '' }],
    [TipoProducto, { idTipoProducto: null, nombre: '', activo: false, observaciones: null }],
    [Producto, { idProducto: null, nombre: '', precioSugerido: 0, activo: false, comentarios: null, idTipoProducto: null, tipoProducto: null }],
    [OrdenProducto, { idProducto: null, producto: null, nombreProducto: '', cantidad: 1, precio: 0, observaciones: null }],
    [PagoDetalle, { tipoPago: 'EFECTIVO', monto: 0, referenciaExterna: null, observaciones: null }]
  ]) {
    const entity = new Ctor();
    assert.deepEqual(JSON.parse(JSON.stringify(entity)), defaults, Ctor.name);
    assert.ok(Ctor.fromJSON({}) instanceof Ctor);
  }
  assert.deepEqual(JSON.parse(JSON.stringify(new DefaultResponse())), { datos: [], totales: -1 });
  const error = new DefaultError();
  assert.equal(error.message, 'Error');
  assert.deepEqual(JSON.parse(JSON.stringify(error)), { error: 'Error', mensaje: '', status: 0, detalle: null, message: 'Error' });
});

test('Empleado y Pago convierten relaciones anidadas en entidades', () => {
  const employee = Empleado.fromJSON({ idEmpleado: 'e1', roles: [{ idEmpleadoRol: 'er1', idRol: 'r1', nombre: 'CAJERO' }] });
  assert.ok(employee.roles[0] instanceof EmpleadoRol);
  assert.equal(JSON.parse(JSON.stringify(employee)).roles[0].nombre, 'CAJERO');
  const payment = Pago.fromJSON({ idPago: 'p1', detalles: [{ tipoPago: 'QR', monto: '3.25', referenciaExterna: 'x' }] });
  assert.ok(payment.detalles[0] instanceof PagoDetalle);
  assert.equal(payment.detalles[0].monto, 3.25);
  assert.equal(JSON.parse(JSON.stringify(payment)).detalles[0].tipoPago, 'QR');
  assert.throws(() => PagoDetalle.fromJSON({ tipoPago: 'CHEQUE' }), /no permitido/);
});

test('Orden mapea aliases, calcula total y serializa líneas relacionadas', () => {
  const order = Orden.fromJSON({ id: 'o1', nombreCliente: 'Ana', detalles: [{ producto: { idProducto: 'p1', nombre: 'Café', precioSugerido: '2.5' }, cantidad: 2 }] });
  assert.ok(order.productos[0] instanceof OrdenProducto);
  assert.equal(order.idOrden, 'o1'); assert.equal(order.cliente, 'Ana'); assert.equal(order.total, 5);
  assert.equal(JSON.parse(JSON.stringify(order)).productos[0].nombreProducto, 'Café');
});

test('Factura mapea detalle y mantiene aliases de productos e identificadores', () => {
  const invoice = Factura.fromJSON({ id: 'f1', idOrden: 'o1', nombreCliente: 'Luis', detalles: [{ nombreProducto: 'Té', precio: '1.5', cantidad: 2 }] });
  assert.ok(invoice.detalle[0] instanceof FacturaOrdenProducto);
  assert.equal(invoice.productos[0], invoice.detalle[0]);
  assert.equal(invoice.total, 3);
  assert.equal(JSON.parse(JSON.stringify(invoice)).detalle[0].idFacturaOrdenProducto, null);
  assert.equal(FacturaOrdenProducto.fromJSON({ idFacturaOrdenProducto: 'l1' }).idFacturaOrdenProducto, 'l1');
});
