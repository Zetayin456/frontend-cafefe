const CACHE = 'cafefe-bce-shell-v3';
const SHELL = [
  './', './index.html', './styles.css', './manifest.webmanifest', './assets/icon.svg', './js/app.js',
  './js/entity/default_response.js', './js/entity/default_error.js', './js/entity/producto.js', './js/entity/tipo_producto.js',
  './js/entity/caja.js', './js/entity/empleado.js', './js/entity/empleado_rol.js', './js/entity/orden.js',
  './js/entity/orden_producto.js', './js/entity/factura.js', './js/entity/factura_orden_producto.js', './js/entity/pago.js', './js/entity/pago_detalle.js',
  './js/control/default_dao.js', './js/control/producto_dao.js', './js/control/tipo_producto_dao.js', './js/control/caja_dao.js',
  './js/control/empleado_dao.js', './js/control/orden_dao.js', './js/control/factura_dao.js', './js/control/pago_dao.js', './js/control/cafefe_controller.js',
  './js/boundary/boundary_utils.js', './js/boundary/cafefe_app.js', './js/boundary/cafefe_header.js', './js/boundary/login_view.js',
  './js/boundary/catalog_view.js', './js/boundary/tipo_producto_list.js', './js/boundary/producto_list.js', './js/boundary/orden_cart.js',
  './js/boundary/orden_pendiente_list.js', './js/boundary/orden_detail.js', './js/boundary/factura_pendiente_list.js',
  './js/boundary/factura_form.js', './js/boundary/pago_form.js', './js/boundary/ticket_view.js'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('cafefe-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => { if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); } return response; }).catch(() => caches.match(event.request).then(response => response || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
