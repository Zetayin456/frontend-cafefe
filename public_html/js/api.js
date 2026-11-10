import { categories as sampleCategories, products as sampleProducts, normalizeOrder } from './data.js';

const config = JSON.parse(localStorage.getItem('cafefe-config') || '{}');
export const API_BASE = config.apiBase || 'http://localhost:8080';
export const API_PATHS = { login: '/api/empleados/login', categories: '/api/categorias', products: '/api/productos', orders: '/api/ordenes', payments: id => `/api/ordenes/${encodeURIComponent(id)}/pagos`, ...config.paths };

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`API ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}
const collection = value => Array.isArray(value) ? value : value?.content ?? value?.data ?? value?.items ?? [];
const cache = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(`cafefe-${key}`)) ?? fallback; } catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(`cafefe-${key}`, JSON.stringify(value));

export const api = {
  async login(name, password) {
    try { return await request(API_PATHS.login, { method: 'POST', body: JSON.stringify({ nombre: name, username: name, password, identificador: password }) }); }
    catch (error) { throw new Error(`No se pudo validar el empleado. Revisa que la API esté disponible en ${API_BASE}.`); }
  },
  async getCategories() {
    try { const list = collection(await request(API_PATHS.categories)); save('categories', list); return list; }
    catch { return cache('categories', sampleCategories); }
  },
  async getProducts() {
    try { const list = collection(await request(API_PATHS.products)); save('products', list); return list; }
    catch { return cache('products', sampleProducts); }
  },
  async getOrders() {
    try { const list = collection(await request(API_PATHS.orders)); save('orders', list); return list.map(normalizeOrder); }
    catch { return cache('orders', []).map(normalizeOrder); }
  },
  async createOrder(order) {
    try { const created = await request(API_PATHS.orders, { method: 'POST', body: JSON.stringify({ nombreCliente: order.customerName, descripcion: order.description, detalles: order.items.map(i => ({ productoId: i.id, cantidad: i.quantity, descripcion: `${order.customerName}: ${i.name}` })) }) }); return normalizeOrder(created); }
    catch { const list = cache('orders', []); const created = normalizeOrder({ ...order, id: `local-${Date.now()}`, status: 'Pendiente' }); list.push(created); save('orders', list); return created; }
  },
  async addPayment(order, payment) {
    try { return await request(API_PATHS.payments(order.id), { method: 'POST', body: JSON.stringify({ monto: payment.amount, formaPago: payment.method, metodo: payment.method }) }); }
    catch { const list = cache('orders', []).map(normalizeOrder); const index = list.findIndex(o => String(o.id) === String(order.id)); if (index < 0) throw new Error('La API no está disponible para registrar el pago.'); list[index].paid = (list[index].paid || 0) + payment.amount; if (list[index].paid >= list[index].total) list[index].status = 'Pagada'; save('orders', list); return list[index]; }
  },
  async completeOrder(order) {
    try { return await request(`${API_PATHS.orders}/${encodeURIComponent(order.id)}/despachar`, { method: 'PATCH' }); }
    catch { const list = cache('orders', []).map(normalizeOrder); const index = list.findIndex(o => String(o.id) === String(order.id)); if (index >= 0) { list[index].status = 'Despachada'; save('orders', list); } return list[index]; }
  },
  isOnline: () => navigator.onLine
};
