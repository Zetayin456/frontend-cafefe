import { DefaultError } from '../entity/default_error.js';
import { DefaultResponse } from '../entity/default_response.js';

export class DefaultDAO {
  static API_BASE = 'http://localhost:9080/cafeteria_pos/api';
  constructor(endpoint = '', mapper = value => value) { this.endpoint = endpoint; this.mapper = mapper; this.baseURL = DefaultDAO.API_BASE; }

  async request(path, { method = 'GET', body, ...options } = {}) {
    let response;
    try {
      response = await fetch(`${this.baseURL}${path}`, {
        method,
        headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        ...options
      });
    } catch (cause) {
      if (method === 'GET' && cause instanceof TypeError) {
        const cached = this.readCache(path);
        if (cached) return { payload: cached.payload, headers: new Headers(cached.total == null ? {} : { 'total-registros': cached.total }), fromCache: true };
      }
      throw new DefaultError({ error: 'Error de conexión', mensaje: `No se pudo conectar con ${this.baseURL}: ${cause.message}`, detalle: cause });
    }
    const text = await response.text();
    let payload;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
    if (!response.ok) {
      throw new DefaultError({ error: payload?.error || payload?.message || `HTTP ${response.status}`, mensaje: payload?.mensaje || payload?.error || payload?.message || `La API respondió HTTP ${response.status}${text ? `: ${text}` : ''}`, status: response.status, detalle: payload });
    }
    if (method === 'GET') this.writeCache(path, { payload, total: response.headers.get('total-registros') });
    return { payload, headers: response.headers, fromCache: false };
  }

  async get(path = this.endpoint) { return (await this.request(path)).payload; }
  async post(path = this.endpoint, body) { return (await this.request(path, { method: 'POST', body })).payload; }

  async findRange(first = 0, max = 20) {
    if (!Number.isInteger(first) || first < 0 || !Number.isInteger(max) || max < 1) {
      throw new DefaultError({ error: 'Rango inválido', mensaje: 'first debe ser >= 0 y max debe ser >= 1.', status: 400 });
    }
    const separator = this.endpoint.includes('?') ? '&' : '?';
    const { payload, headers } = await this.request(`${this.endpoint}${separator}first=${first}&max=${max}`);
    if (!Array.isArray(payload)) throw new DefaultError({ error: 'Respuesta inválida', mensaje: `Se esperaba un arreglo JSON para ${this.endpoint}.` });
    const rawTotal = headers.get('total-registros');
    const parsedTotal = rawTotal === null ? -1 : Number(rawTotal);
    const total = Number.isFinite(parsedTotal) ? parsedTotal : -1;
    return new DefaultResponse(payload.map(this.mapper), total);
  }

  async findAll(max = 20) {
    const all = [];
    let first = 0;
    let total = -1;
    do {
      const page = await this.findRange(first, max);
      all.push(...page.datos);
      total = page.totales;
      if (!page.datos.length || page.datos.length < max || total === -1) break;
      first += page.datos.length;
    } while (total < 0 || first < total);
    return new DefaultResponse(all, total);
  }

  readCache(path) {
    try { const value = localStorage.getItem(`cafefe-api:${path}`); return value === null ? null : JSON.parse(value); }
    catch { return null; }
  }
  writeCache(path, value) {
    try { localStorage.setItem(`cafefe-api:${path}`, JSON.stringify(value)); } catch { /* El dato de red se retorna aunque el cache local no esté disponible. */ }
  }
}
