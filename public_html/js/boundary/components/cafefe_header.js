import { emit, employeeFullName, employeeRoleLabel, roleIncludes } from '../boundary_utils.js';

export class CafefeHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<header class="topbar"><div class="shell topbar-inner"><a class="brand" href="#/pedido"><span class="brand-mark" aria-hidden="true">☕</span>Cafefe</a><nav class="nav" aria-label="Navegación principal"><a href="#/pedido">Pedir</a><a href="#/recepcion" data-kitchen hidden>Recepción</a><a href="#/pago" data-cashier hidden>Caja</a><span class="employee-badge" data-employee hidden role="status"><span data-employee-name></span><span aria-hidden="true"> · </span><span data-employee-role></span></span><a href="#/login" class="pill" data-login>Empleado</a><button type="button" class="nav-logout" data-logout hidden>Cerrar sesión</button><button type="button" class="install" data-install hidden aria-label="Instalar Cafefe en este dispositivo">Instalar app</button></nav></div></header>`;
    this.querySelector('[data-install]').addEventListener('click', () => emit(this, 'instalacion-pwa-solicitada'));
    this.querySelector('[data-logout]').addEventListener('click', () => emit(this, 'cerrar-sesion-solicitado'));
    this.renderEmployee();
  }
  set employee(value) {
    this._employee = value || null;
    this.renderEmployee();
  }
  renderEmployee() {
    if (!this.isConnected) return;
    const employee = this._employee || null;
    const badge = this.querySelector('[data-employee]');
    this.querySelector('[data-kitchen]').hidden = !roleIncludes(employee, 'BARISTA', 'COCINERO');
    this.querySelector('[data-cashier]').hidden = !roleIncludes(employee, 'CAJERO');
    badge.hidden = !employee;
    this.querySelector('[data-login]').hidden = Boolean(employee);
    this.querySelector('[data-logout]').hidden = !employee;
    if (employee) {
      const name = employeeFullName(employee);
      const role = employeeRoleLabel(employee);
      this.querySelector('[data-employee-name]').textContent = name;
      this.querySelector('[data-employee-role]').textContent = role;
      badge.setAttribute('aria-label', `${name} · ${role}`);
    }
  }
  set canInstall(value) {
    const button = this.querySelector('[data-install]');
    if (button) button.hidden = !value;
  }
}

customElements.define('cafefe-header', CafefeHeader);
