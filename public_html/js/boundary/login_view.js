export class LoginView extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<section class="login-wrap"><div class="panel"><span class="eyebrow">Cafefe · equipo</span><h1>Bienvenido de vuelta</h1><p class="muted">Ingresa tu nombre y el identificador UUID de empleado.</p><form><div class="field"><label for="employee-name">Nombre</label><input id="employee-name" name="nombre" autocomplete="username" required></div><div class="field"><label for="employee-uuid">ID único del empleado</label><input id="employee-uuid" name="contrasena" type="password" autocomplete="current-password" required></div><button class="btn">Ingresar</button><p class="form-note" role="alert" aria-live="polite"></p></form></div></section>`;
    this.querySelector('form').addEventListener('submit', event => this.login(event));
  }
  async login(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector('button');
    const message = form.querySelector('[role="alert"]');
    submit.disabled = true; message.textContent = 'Validando…';
    const data = new FormData(form);
    this.dispatchEvent(new CustomEvent('autenticacion-solicitada', { detail: { nombre: data.get('nombre').trim(), contrasena: data.get('contrasena').trim() }, bubbles: true, composed: true }));
  }
  setPending(value) { const button = this.querySelector('form button'); if (button) button.disabled = value; }
  showError(message) { const target = this.querySelector('[role="alert"]'); if (target) target.textContent = message; this.setPending(false); }
}

customElements.define('login-view', LoginView);
