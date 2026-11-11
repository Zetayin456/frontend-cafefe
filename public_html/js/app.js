import { cafefeController } from './control/cafefe_controller.js';
import './boundary/cafefe_header.js';
import './boundary/login_view.js';
import './boundary/tipo_producto_list.js';
import './boundary/producto_list.js';
import './boundary/orden_cart.js';
import './boundary/catalog_view.js';
import './boundary/orden_pendiente_list.js';
import './boundary/orden_detail.js';
import './boundary/factura_pendiente_list.js';
import './boundary/factura_form.js';
import './boundary/pago_form.js';
import './boundary/ticket_view.js';
import './boundary/cafefe_app.js';

document.querySelector('cafefe-app').controller = cafefeController;

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('No se pudo registrar el modo offline:', error));
  }, { once: true });
}
