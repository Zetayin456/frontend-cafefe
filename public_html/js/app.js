import { cafefeController } from './control/cafefe_controller.js';
import './boundary/components/cafefe_header.js';
import './boundary/components/login_view.js';
import './boundary/components/tipo_producto_list.js';
import './boundary/components/producto_list.js';
import './boundary/components/orden_cart.js';
import './boundary/components/catalog_view.js';
import './boundary/components/orden_pendiente_list.js';
import './boundary/components/orden_detail.js';
import './boundary/components/factura_pendiente_list.js';
import './boundary/components/factura_form.js';
import './boundary/components/pago_form.js';
import './boundary/components/ticket_view.js';
import './boundary/components/cafefe_app.js';

document.querySelector('cafefe-app').controller = cafefeController;

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('No se pudo registrar el modo offline:', error));
  }, { once: true });
}
