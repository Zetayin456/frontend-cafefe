# Cafefe frontend

Frontend SPA/PWA para las historias de usuario de la segunda evaluación de PPI115. Está implementado con ECMAScript y Web Components nativos, sin framework ni dependencias de interfaz.

## Inicio

Sirve la carpeta `public_html` mediante un servidor HTTP local. El service worker y la instalación PWA requieren `localhost` o HTTPS; abrir `index.html` como archivo no activa esas capacidades.

## API del backend

El cliente usa por defecto `http://localhost:8080` y estas rutas:

- `POST /api/empleados/login` con `{ nombre, username, password, identificador }`.
- `GET /api/categorias` y `GET /api/productos`.
- `GET /api/ordenes`, `POST /api/ordenes`.
- `POST /api/ordenes/{id}/pagos` y `PATCH /api/ordenes/{id}/despachar`.

El contrato de rutas puede cambiarse sin tocar las pantallas guardando configuración en la consola del navegador:

```js
localStorage.setItem('cafefe-config', JSON.stringify({
  apiBase: 'http://localhost:8080',
  paths: { login: '/ruta/login', categories: '/ruta/categorias', products: '/ruta/productos', orders: '/ruta/ordenes' }
}));
```

Las rutas de pagos y despacho son funciones derivadas de la ruta de órdenes. Las respuestas de colecciones aceptan arreglo directo o envoltorios `content`, `data` e `items`. Para el backend se reconocen nombres de campos comunes en español e inglés. Productos y categorías tienen datos de demostración si la API no responde; órdenes creadas sin conexión se guardan en el almacenamiento local. El login requiere API disponible.

## Flujos implementados

- Pedido anónimo por categoría, selección de productos, cantidades, nombre y envío.
- Login de empleado y navegación a recepción o caja según el rol devuelto por la API.
- Recepción con detalle y acción para despachar una orden pendiente.
- Pagos parciales por varias formas hasta cubrir el saldo, con ticket en vista imprimible del navegador (desde allí se puede guardar como PDF).
- Navegación SPA por hash, diseño adaptable, instalación PWA y shell cacheado para uso offline.

## Pruebas

Las pruebas unitarias nativas de Node.js están en `tests/data.test.js`; correr con `npm test`.
