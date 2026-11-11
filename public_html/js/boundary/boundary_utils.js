export const formatMoney = value => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const emit = (element, name, detail = {}) => element.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
export const roleIncludes = (employee, ...names) => (employee?.roles || []).some(role => names.some(name => String(role.nombre || '').toUpperCase().includes(name)));
export const lineName = line => line.nombreProducto || line.producto?.nombre || line.nombre || 'Producto';
