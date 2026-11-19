import { initBoundary, renderBoundary } from '../boundary_utils.js';

export class LoginView extends HTMLElement {
  constructor() { super(); initBoundary(this, 'login-view.css'); }
  connectedCallback() {
    renderBoundary(this, `<section class="login-wrap"><div class="panel"><span class="eyebrow">Cafefe · equipo</span><h1>Bienvenido de vuelta</h1><p class="muted">Ingresa tu nombre y el identificador UUID de empleado.</p><form><div class="field"><label for="employee-name">Nombre</label><input id="employee-name" name="nombre" autocomplete="username" required></div><div class="field"><label for="employee-uuid">ID único del empleado</label><input id="employee-uuid" name="contrasena" type="password" autocomplete="current-password" required></div><button class="btn">Ingresar</button><p class="form-note" role="alert" aria-live="polite"></p></form></div></section>`);
    this.form = this._boundaryRoot.querySelector('form'); this.submitButton = this.form.querySelector('button'); this.message = this.form.querySelector('[role="alert"]');
    this.form.addEventListener('submit', event => this.login(event));
  }
  login(event) {
    event.preventDefault();
    const data = new FormData(this.form);
    this.setPending(true); this.message.textContent = 'Validando…';
    this.dispatchEvent(new CustomEvent('autenticacion-solicitada', { detail: { nombre: String(data.get('nombre')).trim(), contrasena: String(data.get('contrasena')).trim() }, bubbles: true, composed: true }));
  }
  setPending(value) { if (this.submitButton) this.submitButton.disabled = value; }
  showError(message) { if (this.message) this.message.textContent = message; this.setPending(false); }
}

customElements.define('login-view', LoginView);
