const CACHE_NAME = 'cafefe-pwa-v20261123090354';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './js/app.js',
  './js/boundary/boundary_utils.js',
  './js/boundary/components/cafefe_app.js',
  './js/boundary/components/cafefe_header.js',
  './js/boundary/components/catalog_view.js',
  './js/boundary/components/factura_form.js',
  './js/boundary/components/factura_pendiente_list.js',
  './js/boundary/components/login_view.js',
  './js/boundary/components/orden_cart.js',
  './js/boundary/components/orden_detail.js',
  './js/boundary/components/orden_pendiente_list.js',
  './js/boundary/components/pago_form.js',
  './js/boundary/components/producto_list.js',
  './js/boundary/components/ticket_view.js',
  './js/boundary/components/tipo_producto_list.js',
  './js/control/cafefe_controller.js',
  './js/control/caja_dao.js',
  './js/control/default_dao.js',
  './js/control/empleado_dao.js',
  './js/control/factura_dao.js',
  './js/control/orden_dao.js',
  './js/control/orden_despacho_store.js',
  './js/control/pago_dao.js',
  './js/control/producto_dao.js',
  './js/control/tipo_producto_dao.js',
  './js/entity/caja.js',
  './js/entity/default_error.js',
  './js/entity/default_response.js',
  './js/entity/empleado.js',
  './js/entity/empleado_rol.js',
  './js/entity/factura.js',
  './js/entity/factura_orden_producto.js',
  './js/entity/orden.js',
  './js/entity/orden_producto.js',
  './js/entity/pago.js',
  './js/entity/pago_detalle.js',
  './js/entity/producto.js',
  './js/entity/tipo_producto.js',
  './resources/estilos/styles.css',
  './resources/estilos/components/cafefe-app.css',
  './resources/estilos/components/cafefe-header.css',
  './resources/estilos/components/catalog-view.css',
  './resources/estilos/components/factura-form.css',
  './resources/estilos/components/factura-pendiente-list.css',
  './resources/estilos/components/login-view.css',
  './resources/estilos/components/orden-cart.css',
  './resources/estilos/components/orden-detail.css',
  './resources/estilos/components/orden-pendiente-list.css',
  './resources/estilos/components/pago-form.css',
  './resources/estilos/components/producto-list.css',
  './resources/estilos/components/tipo-producto-list.css',
  './resources/iconos/icon-192.png',
  './resources/iconos/icon-512.png',
  './resources/iconos/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.includes('/api/')) return;
  event.respondWith(
    fetch(event.request).then(resp => {
      if (resp && resp.status === 200 && url.origin === self.location.origin) {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return resp;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});