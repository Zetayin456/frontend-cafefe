# Cafefe frontend

SPA/PWA desarrollada con ECMAScript, Custom Elements y CSS propio. No usa librerías, frameworks, icon packs ni componentes de terceros.

## Ejecución local

Sirve `public_html` desde un servidor HTTP local (por ejemplo `npx http-server public_html`) y abre la dirección local que indique. El service worker y la instalación PWA necesitan `localhost` o HTTPS.

## Backend

La base URL local sigue la guía de integración: `http://localhost:9080/cafeteria_pos/api`. Se requiere iniciar Open Liberty con la aplicación `cafeteria_pos` y disponer de los datos oficiales, en particular empleado/rol `Mesero Virtual`, empleados con roles activos, productos, tipos de producto y cajas activas.

El frontend consume únicamente estos recursos documentados:

- `POST /empleado/login` (`nombre`, `contrasena`), con el UUID del empleado como contraseña.
- `GET /v1/tipos-producto`, `GET /v1/productos` y `GET /v1/cajas`, con paginación `first`/`max`.
- `POST /orden` y `GET /orden/pendientes`.
- `POST /factura`, `GET /factura/pendientes` y `GET /factura/{id}`.
- `POST /pago`.

## Historias incluidas

- **HU1:** login empleado con nombre e ID UUID, y navegación por los roles activos que devuelve el backend.
- **HU2:** catálogo activo por tipo, carrito, nombre de cliente y envío de productos/cantidades al endpoint público. El backend calcula precios y asigna Mesero Virtual.
- **HU3:** cola de órdenes pendientes y detalle de productos, cantidades, observaciones y total.
- **HU4:** facturación de una orden con caja y rol de cajero; pagos divididos entre efectivo, tarjeta y QR; consulta del ticket JSON y vista de impresión que el navegador puede guardar como PDF.

El esquema del backend no tiene una operación para cambiar el estado de cocina ni guardar despacho. Por eso HU3 presenta las órdenes pendientes y el detalle, pero no simula una acción de despacho persistente. El DTO de producto debe incluir la relación con el tipo para poder filtrar con precisión; si el backend omite esa relación, se muestran los productos activos sin filtro.

## PWA y modo offline

El service worker sirve el shell de la aplicación desde caché si no hay red. Las respuestas exitosas de los GET del backend también se guardan en el navegador para consultar el último catálogo y los últimos pendientes vistos sin conexión. Las operaciones POST requieren conexión con el backend y nunca se simulan ni se ponen en cola localmente.

## Pruebas

Las pruebas unitarias usan el runner nativo de Node.js: `npm test`.
