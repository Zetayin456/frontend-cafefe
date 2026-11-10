import { api } from './api.js';
import './components.js';

window.cafefeApi = api;
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('No se pudo registrar el modo offline:', error)));
}
