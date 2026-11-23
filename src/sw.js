const CACHE_PREFIX = 'cafefe-v20261123065752';
const CACHE_NAME = `${CACHE_PREFIX}v16`;
const SHELL = [
  './', './index.html', './resources/estilos/styles.css',
  './resources/estilos/components/cafefe-v20261123065752', './resources/estilos/components/cafefe-v20261123065752', './resources/estilos/components/catalog-view.css',
  './resources/estilos/components/login-view.css', './resources/estilos/components/tipo-producto-list.css', './resources/estilos/components/producto-list.css',
  './resources/estilos/components/orden-cart.css', './resources/estilos/components/orden-pendiente-list.css', './resources/estilos/components/orden-detail.css',
  './resources/estilos/components/factura-pendiente-list.css', './resources/estilos/components/factura-form.css', './resources/estilos/components/pago-form.css', './manifest.webmanifest',
  './resources/iconos/icon.svg', './resources/iconos/icon-192.png', './resources/iconos/icon-512.png', './js/app.js',
  './js/entity/default_response.js', './js/entity/default_error.js', './js/entity/producto.js', './js/entity/tipo_producto.js',
  './js/entity/caja.js', './js/entity/empleado.js', './js/entity/empleado_rol.js', './js/entity/orden.js',
  './js/entity/orden_producto.js', './js/entity/factura.js', './js/entity/factura_orden_producto.js', './js/entity/pago.js', './js/entity/pago_detalle.js',
  './js/control/default_dao.js', './js/control/producto_dao.js', './js/control/tipo_producto_dao.js', './js/control/caja_dao.js',
  './js/control/empleado_dao.js', './js/control/orden_dao.js', './js/control/factura_dao.js', './js/control/pago_dao.js', './js/control/orden_despacho_store.js', './js/control/cafefe_controller.js',
  './js/boundary/boundary_utils.js', './js/boundary/components/cafefe_app.js', './js/boundary/components/cafefe_header.js', './js/boundary/components/login_view.js',
  './js/boundary/components/catalog_view.js', './js/boundary/components/tipo_producto_list.js', './js/boundary/components/producto_list.js', './js/boundary/components/orden_cart.js',
  './js/boundary/components/orden_pendiente_list.js', './js/boundary/components/orden_detail.js', './js/boundary/components/factura_pendiente_list.js',
  './js/boundary/components/factura_form.js', './js/boundary/components/pago_form.js', './js/boundary/components/ticket_view.js'
];
const SHELL_URLS = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));
const APP_INDEX = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then(cache => cache.addAll([...SHELL_URLS]))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestURL = new URL(request.url);
  if (requestURL.origin !== self.location.origin) return;

  const isAppNavigation = request.mode === 'navigate';
  const shellURL = isAppNavigation ? APP_INDEX : SHELL_URLS.has(requestURL.href) ? requestURL.href : null;
  if (!shellURL) return;

  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached = await cache.match(shellURL);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok && response.type !== 'opaque') await cache.put(shellURL, response.clone());
      return response;
    } catch (error) {
      if (isAppNavigation) return cache.match(APP_INDEX).then(fallback => fallback || Response.error());
      throw error;
    }
  }));
});
