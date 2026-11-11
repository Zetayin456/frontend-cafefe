import { emit, roleIncludes } from './boundary_utils.js';

export class CafefeHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<header class="topbar"><div class="shell topbar-inner"><a class="brand" href="#/pedido"><span class="brand-mark" aria-hidden="true">☕</span>Cafefe</a><nav class="nav" aria-label="Navegación principal"><a href="#/pedido">Pedir</a><a href="#/recepcion" data-kitchen hidden>Recepción</a><a href="#/pago" data-cashier hidden>Caja</a><a href="#/login" class="pill">Empleado</a><button class="install" data-install hidden>Instalar app</button></nav></div></header>`;
    this.querySelector('[data-install]').addEventListener('click', () => emit(this, 'instalacion-pwa-solicitada'));
  }
  set employee(value) {
    this.querySelector('[data-kitchen]').hidden = !roleIncludes(value, 'BARISTA', 'COCINERO');
    this.querySelector('[data-cashier]').hidden = !roleIncludes(value, 'CAJERO');
  }
  set canInstall(value) { this.querySelector('[data-install]').hidden = !value; }
}

customElements.define('cafefe-header', CafefeHeader);
