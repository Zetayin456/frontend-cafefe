export const categories = [
  { id: 1, name: 'Café', icon: '☕', active: true },
  { id: 2, name: 'Panadería', icon: '🥐', active: true },
  { id: 3, name: 'Desayunos', icon: '🍳', active: true },
  { id: 4, name: 'Bebidas frías', icon: '🧋', active: true }
];
export const products = [
  { id: 1, categoryId: 1, name: 'Café de la casa', description: 'Café salvadoreño, recién molido.', price: 2.25, icon: '☕', active: true },
  { id: 2, categoryId: 1, name: 'Latte de vainilla', description: 'Espresso, leche cremosa y vainilla.', price: 3.5, icon: '🥛', active: true },
  { id: 3, categoryId: 1, name: 'Cold brew', description: 'Extracción lenta, servido con hielo.', price: 3, icon: '🧊', active: true },
  { id: 4, categoryId: 2, name: 'Croissant de mantequilla', description: 'Horneado cada mañana.', price: 2, icon: '🥐', active: true },
  { id: 5, categoryId: 2, name: 'Pan de chocolate', description: 'Masa hojaldrada con chocolate.', price: 2.4, icon: '🍫', active: true },
  { id: 6, categoryId: 3, name: 'Desayuno típico', description: 'Frijoles, huevo, queso y plátano.', price: 5.75, icon: '🍳', active: true },
  { id: 7, categoryId: 3, name: 'Tostadas con aguacate', description: 'Pan artesanal, aguacate y semillas.', price: 4.8, icon: '🥑', active: true },
  { id: 8, categoryId: 4, name: 'Limonada natural', description: 'Limón fresco y un toque de hierbabuena.', price: 2.5, icon: '🍋', active: true }
];
export const money = value => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const orderTotal = items => items.reduce((total, item) => total + Number(item.price) * Number(item.quantity), 0);
export const normalizeOrder = order => {
  const rawItems = order.items ?? order.detalles ?? [];
  const items = rawItems.map(item => ({ ...item, id: item.id ?? item.productoId ?? item.producto?.id, name: item.name ?? item.nombre ?? item.productoNombre ?? item.producto?.nombre, price: Number(item.price ?? item.precio ?? item.producto?.precio ?? 0), quantity: Number(item.quantity ?? item.cantidad ?? 1) }));
  return { ...order, id: order.id ?? order.idOrden ?? order.codigo, customerName: order.customerName ?? order.nombreCliente ?? 'Cliente', items, status: order.status ?? order.estado ?? 'Pendiente', total: Number(order.total ?? order.montoTotal ?? orderTotal(items)) };
};
