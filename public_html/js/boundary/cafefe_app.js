import { roleIncludes } from './boundary_utils.js';

export class CafefeApp extends HTMLElement {
  constructor() {
    super();
    try { this.employee = JSON.parse(sessionStorage.getItem('cafefe-user')); } catch { this.employee = null; }
    this.installPrompt = null;
  }
  set controller(value) { this._controller = value; if (this.isConnected) this.renderRoute(); }
  connectedCallback() {
    this.innerHTML = `<cafefe-header></cafefe-header><main id="view"></main><div id="toast" hidden class="toast" role="status" aria-live="polite"></div><footer class="footer"><div class="shell">Cafefe · Un buen café hace el día. <span id="connection"></span></div></footer>`;
    this.header = this.querySelector('cafefe-header'); this.header.employee = this.employee;
    this.addEventListener('autenticacion-solicitada', event => this.onLoginRequest(event));
    this.addEventListener('orden-enviada', event => this.onOrderRequest(event));
    this.addEventListener('orden-seleccionada', event => event.detail.facturar ? this.showInvoiceForm(event.detail.order) : this.showOrderDetail(event.detail.order));
    this.addEventListener('factura-seleccionada', event => this.showPaymentForm(event.detail.idFactura));
    this.addEventListener('factura-solicitada', event => this.onInvoiceRequest(event));
    this.addEventListener('pago-solicitado', event => this.onPaymentRequest(event));
    this.addEventListener('instalacion-pwa-solicitada', () => this.install());
    this.addEventListener('click', event => { if (event.target.closest('[data-refresh]')) this.renderRoute(); });
    window.addEventListener('hashchange', () => this.renderRoute());
    window.addEventListener('online', () => this.updateConnection()); window.addEventListener('offline', () => this.updateConnection());
    window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); this.installPrompt = event; this.header.canInstall = true; });
    this.updateConnection(); if (!location.hash) location.hash = '#/pedido'; if (this._controller) this.renderRoute();
  }
  onAuthenticated(employee) {
    this.employee = employee; sessionStorage.setItem('cafefe-user', JSON.stringify(employee)); this.header.employee = employee;
    if (roleIncludes(employee, 'CAJERO')) location.hash = '#/pago';
    else if (roleIncludes(employee, 'BARISTA', 'COCINERO')) location.hash = '#/recepcion';
    else { sessionStorage.removeItem('cafefe-user'); this.employee = null; this.toast('Tu usuario no tiene un rol de caja o cocina habilitado.'); location.hash = '#/login'; }
  }
  async onLoginRequest(event) {
    const boundary = event.target; boundary.setPending(true);
    try { const employee = await this._controller.loginEmpleado(event.detail.nombre, event.detail.contrasena); this.onAuthenticated(employee); }
    catch (error) { boundary.showError(error.message || error.mensaje || 'No se pudo validar el empleado.'); }
  }
  async onOrderRequest(event) {
    const boundary = event.target; boundary.setPending(true);
    try { const order = await this._controller.crearOrden(event.detail); boundary.clearCart(); this.toast(`Orden ${order.idOrden ? `#${order.idOrden} ` : ''}enviada a cocina.`); }
    catch (error) { boundary.setError(error.message || error.mensaje || 'No se pudo enviar el pedido.'); }
  }
  async onInvoiceRequest(event) {
    const boundary = event.target; boundary.setPending(true);
    try { const invoice = await this._controller.crearFactura(event.detail); await this.afterInvoiceCreated(invoice); }
    catch (error) { boundary.setError(error.message || error.mensaje || 'No se pudo crear la factura.'); }
  }
  async onPaymentRequest(event) {
    const boundary = event.target; boundary.setPending(true);
    try { await this._controller.registrarPago(event.detail); await this.showTicket(event.detail.factura.idFactura); }
    catch (error) { boundary.setError(error.message || error.mensaje || 'No se pudo registrar el pago.'); }
  }
  async renderRoute() {
    if (!this._controller) return;
    const route = location.hash.replace(/^#\/?/, '').split('/')[0] || 'pedido'; const view = this.querySelector('#view');
    if (route === 'pedido') { const catalog = document.createElement('catalog-view'); catalog.controller = this._controller; view.replaceChildren(catalog); return; }
    if (route === 'login') { const shell = document.createElement('div'); shell.className = 'shell'; shell.append(document.createElement('login-view')); view.replaceChildren(shell); return; }
    if (route === 'recepcion') {
      if (!roleIncludes(this.employee, 'BARISTA', 'COCINERO')) { location.hash = '#/login'; return; }
      const shell = this.pageShell('Cocina y barra', 'Recepción de órdenes', 'Órdenes pendientes de preparar.'); const list = document.createElement('orden-pendiente-list'); list.controller = this._controller; const detail = document.createElement('orden-detail'); shell.append(list, detail); view.replaceChildren(shell); return;
    }
    if (route === 'pago') {
      if (!roleIncludes(this.employee, 'CAJERO')) { location.hash = '#/login'; return; }
      const shell = this.pageShell('Caja', 'Facturación y pagos', 'Factura órdenes pendientes y registra pagos divididos.'); const split = document.createElement('div'); split.className = 'split';
      const ordersSection = document.createElement('section'); ordersSection.innerHTML = '<h2>Órdenes por facturar</h2>'; const orders = document.createElement('orden-pendiente-list'); orders.controller = this._controller; orders.mode = 'invoice'; ordersSection.append(orders);
      const invoicesSection = document.createElement('section'); invoicesSection.innerHTML = '<h2>Facturas pendientes</h2>'; const invoices = document.createElement('factura-pendiente-list'); invoices.controller = this._controller; invoicesSection.append(invoices);
      split.append(ordersSection, invoicesSection); const detail = document.createElement('div'); detail.id = 'cashier-detail'; detail.className = 'cashier-detail'; shell.append(split, detail); view.replaceChildren(shell); return;
    }
    view.innerHTML = '<div class="shell page"><div class="empty">No existe esta vista. <a href="#/pedido">Volver al menú</a></div>';
  }
  pageShell(eyebrow, title, description) {
    const shell = document.createElement('div'); shell.className = 'shell page';
    const heading = document.createElement('div'); heading.className = 'page-heading row';
    heading.innerHTML = `<div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${description}</p></div><button class="btn secondary" data-refresh>Actualizar</button>`;
    shell.append(heading); return shell;
  }
  showOrderDetail(order) { const detail = this.querySelector('orden-detail'); if (detail) { detail.order = order; detail.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
  async showInvoiceForm(order) {
    const panel = this.querySelector('#cashier-detail'); if (!panel) return;
    const role = this.employee.roles.find(item => String(item.nombre).toUpperCase().includes('CAJERO'));
    const form = document.createElement('factura-form'); form.controller = this._controller; form.context = { order, employeeRoleId: role?.idEmpleadoRol }; panel.replaceChildren(form); form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  async afterInvoiceCreated(invoice) {
    if (!this.querySelector('#cashier-detail')) return;
    await this.renderRoute();
    const panel = this.querySelector('#cashier-detail'); if (!panel) return;
    const refreshedInvoice = await this._controller.consultarFactura(invoice.idFactura).catch(() => invoice);
    const form = document.createElement('pago-form'); form.invoice = refreshedInvoice; panel.replaceChildren(form); form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.toast(`Factura #${invoice.idFactura} creada.`);
  }
  async showPaymentForm(idFactura) {
    const panel = this.querySelector('#cashier-detail'); if (!panel) return;
    try { const invoice = await this._controller.consultarFactura(idFactura); const form = document.createElement('pago-form'); form.invoice = invoice; panel.replaceChildren(form); form.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    catch (error) { this.toast(`No se pudo abrir la factura: ${error.message}`); }
  }
  async showTicket(idFactura) {
    if (!this.querySelector('#cashier-detail')) return;
    try { await this.renderRoute(); const invoice = await this._controller.consultarFactura(idFactura); const panel = this.querySelector('#cashier-detail'); if (!panel) return; const ticket = document.createElement('ticket-view'); ticket.invoice = invoice; panel.replaceChildren(ticket); ticket.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    catch (error) { this.toast(`Pago registrado; no se pudo cargar el ticket: ${error.message}`); }
  }
  async install() {
    if (!this.installPrompt) return;
    await this.installPrompt.prompt(); this.installPrompt = null; this.header.canInstall = false;
  }
  updateConnection() { const node = this.querySelector('#connection'); if (node) node.textContent = navigator.onLine ? ' · En línea' : ' · Sin conexión'; }
  toast(message) { const element = this.querySelector('#toast'); element.textContent = message; element.hidden = false; clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { element.hidden = true; }, 3600); }
}

customElements.define('cafefe-app', CafefeApp);
