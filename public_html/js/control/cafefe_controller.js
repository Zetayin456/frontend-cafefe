import { Factura } from '../entity/factura.js';
import { Orden } from '../entity/orden.js';
import { PagoDetalle } from '../entity/pago_detalle.js';
import { CajaDAO } from './caja_dao.js';
import { EmpleadoDAO } from './empleado_dao.js';
import { FacturaDAO } from './factura_dao.js';
import { OrdenDAO } from './orden_dao.js';
import { PagoDAO } from './pago_dao.js';
import { ProductoDAO } from './producto_dao.js';
import { TipoProductoDAO } from './tipo_producto_dao.js';

export class CafefeController {
  constructor({ empleadoDAO = new EmpleadoDAO(), productoDAO = new ProductoDAO(), tipoProductoDAO = new TipoProductoDAO(), cajaDAO = new CajaDAO(), ordenDAO = new OrdenDAO(), facturaDAO = new FacturaDAO(), pagoDAO = new PagoDAO() } = {}) {
    Object.assign(this, { empleadoDAO, productoDAO, tipoProductoDAO, cajaDAO, ordenDAO, facturaDAO, pagoDAO });
  }
  async loginEmpleado(nombre, uuid) { return this.empleadoDAO.login(nombre, uuid); }
  async cargarTiposProducto() { return (await this.tipoProductoDAO.findAll()).datos.filter(item => item.activo); }
  async cargarProductos() { return (await this.productoDAO.findAll()).datos.filter(item => item.activo); }
  async cargarCajasActivas() { return (await this.cajaDAO.findAll()).datos.filter(item => item.activo); }
  async crearOrden({ cliente, productos }) {
    if (!cliente?.trim()) throw new TypeError('Ingresa el nombre del cliente.');
    if (!Array.isArray(productos) || !productos.length) throw new TypeError('Agrega al menos un producto a la orden.');
    const order = new Orden({ cliente: cliente.trim(), productos: productos.map(item => ({ idProducto: item.idProducto, cantidad: item.cantidad, observaciones: [cliente.trim(), item.observaciones].filter(Boolean).join(' · ') })) });
    return this.ordenDAO.create(order);
  }
  async cargarOrdenesPendientes() { return this.ordenDAO.findPending(); }
  async cargarFacturasPendientes() { return this.facturaDAO.findPending(); }
  async crearFactura({ orden, idCaja, idEmpleadoRol, cliente, observaciones }) {
    if (!orden?.idOrden || !idCaja || !idEmpleadoRol) throw new TypeError('La orden, una caja activa y el rol de cajero son obligatorios.');
    return this.facturaDAO.create({ idOrden: orden.idOrden, idCaja, idEmpleadoRol, cliente: cliente?.trim() || orden.cliente, observaciones: observaciones?.trim() || null });
  }
  async consultarFactura(idFactura) { return this.facturaDAO.findById(idFactura); }
  async registrarPago({ factura, detalles, observaciones = '' }) {
    if (!factura?.idFactura) throw new TypeError('Selecciona una factura.');
    if (!Array.isArray(detalles) || !detalles.length) throw new TypeError('Agrega al menos un medio de pago.');
    const pagos = detalles.map(detail => new PagoDetalle(detail));
    if (pagos.some(detail => !Number.isFinite(detail.monto) || detail.monto <= 0)) throw new TypeError('Todos los montos deben ser mayores que cero.');
    const toCents = value => Math.round(Number(value) * 100);
    if (pagos.reduce((sum, detail) => sum + toCents(detail.monto), 0) !== toCents(factura.total)) throw new TypeError('La suma de los medios de pago debe coincidir con el total de la factura.');
    return this.pagoDAO.create({ idFactura: factura.idFactura, observaciones, detalles: pagos });
  }
}

export const cafefeController = new CafefeController();
