export const money = value => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const orderTotal = items => items.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0);
const lineList = record => record.productos ?? record.detalles ?? record.detalle ?? record.lineas ?? record.ordenProductos ?? [];
export const normalizeLine = line => {
  const product = line.producto ?? line;
  return {
    ...line,
    idProducto: line.idProducto ?? product.idProducto ?? product.id,
    name: line.nombreProducto ?? product.nombre ?? line.nombre ?? 'Producto',
    price: Number(line.precio ?? line.precioSugerido ?? product.precioSugerido ?? product.precio ?? 0),
    quantity: Number(line.cantidad ?? 1),
    observations: line.observaciones ?? line.comentarios ?? ''
  };
};
export const normalizeOrder = order => {
  const items = lineList(order).map(normalizeLine);
  return { ...order, id: order.idOrden ?? order.id, customerName: order.cliente ?? order.nombreCliente ?? 'Cliente mostrador', status: order.estado ?? 'PENDIENTE_COCINA', items, total: Number(order.total ?? order.montoTotal ?? order.totalFactura ?? orderTotal(items)) };
};
export const normalizeInvoice = invoice => {
  const items = lineList(invoice).map(normalizeLine);
  return { ...invoice, id: invoice.idFactura ?? invoice.id, orderId: invoice.idOrden, customerName: invoice.cliente ?? invoice.nombreCliente ?? 'Cliente mostrador', status: invoice.estado ?? 'PENDIENTE', items, total: Number(invoice.total ?? invoice.montoTotal ?? invoice.totalFactura ?? orderTotal(items)) };
};
