export const formatMoney = value => new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const emit = (element, name, detail = {}) => element.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
export const roleIncludes = (employee, ...names) => (employee?.roles || []).some(role => names.some(name => String(role.nombre || '').toUpperCase().includes(name)));
export const lineName = line => line.nombreProducto || line.producto?.nombre || line.nombre || 'Producto';
export const productName = (line, productsById = new Map()) => {
  const idProducto = line?.idProducto ?? line?.producto?.idProducto;
  const catalogName = idProducto == null ? '' : productsById.get(String(idProducto))?.nombre;
  return catalogName || lineName(line || {});
};
export const orderClientName = order => {
  const client = String(order?.cliente || '').trim();
  const isPlaceholder = /^(cliente\s+(de\s+)?mostrador|mostrador)$/i.test(client);
  if (client && !isPlaceholder) return client;
  const firstObservation = order?.productos?.map(item => item?.observaciones).find(value => typeof value === 'string' && value.trim());
  const observedClient = firstObservation?.split(/\s+·\s+/)[0]?.trim();
  return observedClient || client || 'Cliente mostrador';
};
export const employeeFullName = employee => [employee?.nombre, employee?.apellido]
  .map(value => String(value || '').trim())
  .filter(Boolean)
  .join(' ') || 'Empleado';
export const employeeRoleLabel = employee => {
  if (roleIncludes(employee, 'CAJERO')) return 'Cajera';
  if (roleIncludes(employee, 'BARISTA')) return 'Barista';
  if (roleIncludes(employee, 'COCINERO')) return 'Cocinero';
  const role = String(employee?.roles?.[0]?.nombre || '').trim();
  return role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'Empleado';
};
export const employeeGreeting = employee => `¡Hola, ${employeeRoleLabel(employee)} ${employeeFullName(employee)}!`;
export const initBoundary = (element, stylesheet) => {
  element._boundaryRoot = element.shadowRoot || element.attachShadow({ mode: 'open' });
  element._boundaryStylesheet = new URL(`../../resources/estilos/components/${stylesheet}`, import.meta.url).href;
  return element._boundaryRoot;
};
export const renderBoundary = (element, content) => {
  element._boundaryRoot.innerHTML = `<link rel="stylesheet" href="${element._boundaryStylesheet}">${content}`;
};
