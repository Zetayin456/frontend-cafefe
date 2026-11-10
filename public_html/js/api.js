export const API_BASE = 'http://localhost:9080/cafeteria_pos/api';

async function request(path, { method = 'GET', body, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...options
    });
  } catch (error) {
    if (method === 'GET') {
      const cached = localStorage.getItem(`cafefe-api:${path}`);
      if (cached !== null) { try { const entry = JSON.parse(cached); const headers = new Headers(); if (entry.total != null) headers.set('total-registros', entry.total); return { payload: entry.payload ?? entry, headers }; } catch { localStorage.removeItem(`cafefe-api:${path}`); } }
    }
    throw new Error(`No se pudo conectar con el backend ${API_BASE}. ${error.message}`);
  }
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) throw new Error(payload?.error || payload?.message || `La API respondió HTTP ${response.status}${text ? `: ${text}` : ''}`);
  if (method === 'GET') { try { localStorage.setItem(`cafefe-api:${path}`, JSON.stringify({ payload, total: response.headers.get('total-registros') })); } catch { /* La respuesta API sigue disponible aunque el navegador no permita almacenarla. */ } }
  return { payload, headers: response.headers };
}

async function getAll(path) {
  const result = [];
  let first = 0;
  const max = 100;
  let total = Infinity;
  while (first < total) {
    const { payload, headers } = await request(`${path}?first=${first}&max=${max}`);
    if (!Array.isArray(payload)) throw new Error(`La respuesta de ${path} no es un arreglo JSON.`);
    result.push(...payload);
    const count = Number(headers.get('total-registros'));
    total = Number.isFinite(count) ? count : result.length;
    if (!payload.length) break;
    first += payload.length;
  }
  return result;
}

export const api = {
  login: async (nombre, contrasena) => (await request('/empleado/login', { method: 'POST', body: { nombre, contrasena } })).payload,
  getCategories: () => getAll('/v1/tipos-producto'),
  getProducts: () => getAll('/v1/productos'),
  getBoxes: () => getAll('/v1/cajas'),
  getPendingOrders: async () => (await request('/orden/pendientes')).payload,
  createOrder: async ({ customerName, items, observations = '' }) => (await request('/orden', {
    method: 'POST',
    body: {
      cliente: customerName,
      productos: items.map(item => ({ idProducto: item.idProducto, cantidad: item.quantity, observaciones: [customerName, item.observations, observations].filter(Boolean).join(' · ') }))
    }
  })).payload,
  getPendingInvoices: async () => (await request('/factura/pendientes')).payload,
  createInvoice: async ({ orderId, boxId, employeeRoleId, customer, observations }) => (await request('/factura', {
    method: 'POST', body: { idOrden: orderId, idCaja: boxId, idEmpleadoRol: employeeRoleId, cliente: customer, observaciones }
  })).payload,
  getInvoice: async id => (await request(`/factura/${encodeURIComponent(id)}`)).payload,
  createPayment: async ({ invoiceId, observations, details }) => (await request('/pago', {
    method: 'POST', body: { idFactura: invoiceId, observaciones: observations, detalles: details.map(detail => ({ tipoPago: detail.method, monto: Number(detail.amount), referenciaExterna: detail.reference || null, observaciones: detail.observations || null })) }
  })).payload
};
