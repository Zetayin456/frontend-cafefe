import { emit, employeeFullName, employeeRoleLabel, initBoundary, renderBoundary, roleIncludes } from '../boundary_utils.js';

export class CafefeHeader extends HTMLElement {
  constructor() { super(); initBoundary(this, 'cafefe-header.css'); }
  connectedCallback() {
    renderBoundary(this, `<header class="topbar"><div class="shell topbar-inner"><a class="brand" href="#/pedido"><span class="brand-mark" aria-hidden="true">☕</span>Cafefe</a><nav class="nav" aria-label="Navegación principal"><a href="#/pedido">Pedir</a><a href="#/recepcion" data-kitchen hidden>Recepción</a><a href="#/pago" data-cashier hidden>Caja</a><span class="employee-badge" data-employee hidden role="status"><span data-employee-name></span><span aria-hidden="true"> · </span><span data-employee-role></span></span><a href="#/login" class="pill" data-login>Empleado</a><button type="button" class="nav-logout" data-logout hidden>Cerrar sesión</button><button type="button" class="install" data-install hidden aria-label="Instalar Cafefe en este dispositivo">Instalar app</button></nav></div></header>`);
    this.refs = {
      install: this._boundaryRoot.querySelector('[data-install]'), logout: this._boundaryRoot.querySelector('[data-logout]'),
      kitchen: this._boundaryRoot.querySelector('[data-kitchen]'), cashier: this._boundaryRoot.querySelector('[data-cashier]'), employee: this._boundaryRoot.querySelector('[data-employee]'),
      login: this._boundaryRoot.querySelector('[data-login]'), name: this._boundaryRoot.querySelector('[data-employee-name]'), role: this._boundaryRoot.querySelector('[data-employee-role]')
    };
    this.refs.install.addEventListener('click', () => emit(this, 'instalacion-pwa-solicitada'));
    this.refs.logout.addEventListener('click', () => emit(this, 'cerrar-sesion-solicitado'));
    this.renderEmployee();
  }
  set employee(value) {
    this._employee = value || null;
    this.renderEmployee();
  }
  renderEmployee() {
    if (!this.isConnected) return;
    const employee = this._employee || null;
    const { employee: badge, kitchen, cashier, login, logout, name: nameNode, role: roleNode } = this.refs;
    kitchen.hidden = !roleIncludes(employee, 'BARISTA', 'COCINERO');
    cashier.hidden = !roleIncludes(employee, 'CAJERO');
    badge.hidden = !employee;
    login.hidden = Boolean(employee);
    logout.hidden = !employee;
    if (employee) {
      const name = employeeFullName(employee);
      const role = employeeRoleLabel(employee);
      nameNode.textContent = name;
      roleNode.textContent = role;
      badge.setAttribute('aria-label', `${name} · ${role}`);
    }
  }
  set canInstall(value) {
    const button = this.refs?.install;
    if (button) button.hidden = !value;
  }
}

customElements.define('cafefe-header', CafefeHeader);
