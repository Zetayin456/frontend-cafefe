import { employeeGreeting, initBoundary, renderBoundary, roleIncludes } from '../boundary_utils.js';

export class CafefeApp extends HTMLElement {
  constructor() {
    super();
    initBoundary(this, 'cafefe-app.css');
    try { this.employee = JSON.parse(sessionStorage.getItem('cafefe-user')); } catch { this.employee = null; }
    this.installPrompt = null; this.productCatalogById = new Map(); this.routeGeneration = 0; this.detailGeneration = 0;
  }
  set controller(value) { this._controller = value; if (this.isConnected) this.renderRoute(); }
  connectedCallback() {
    renderBoundary(this, `<cafefe-header></cafefe-header><main id="view"></main><div id="toast" hidden class="toast" role="status" aria-live="polite"></div><footer class="footer"><div class="shell">Cafefe · Un buen café hace el día. <span id="connection"></span></div></footer>`);
    this.refs = { header: this._boundaryRoot.querySelector('cafefe-header'), view: this._boundaryRoot.querySelector('#view'), toast: this._boundaryRoot.querySelector('#toast'), connection: this._boundaryRoot.querySelector('#connection') };
    this.refs.header.employee = this.employee;
    this.addEventListener('autenticacion-solicitada', event => this.onLoginRequest(event));
    this.addEventListener('orden-enviada', event => this.onOrderRequest(event));
    this.addEventListener('tipo-seleccionado', event => this.onCategorySelected(event));
    this.addEventListener('producto-agregado', event => this.onProductAdded(event));
    this.addEventListener('carrito-actualizado', event => { this.cartItems = event.detail.items; });
    this.addEventListener('orden-seleccionada', event => event.detail.facturar ? this.showInvoiceForm(event.detail.order) : this.showOrderDetail(event.detail.order));
    this.addEventListener('despacho-solicitado', event => this.onDispatchRequest(event));
    this.addEventListener('factura-seleccionada', event => this.showPaymentForm(event.detail.idFactura));
    this.addEventListener('factura-solicitada', event => this.onInvoiceRequest(event));
    this.addEventListener('pago-solicitado', event => this.onPaymentRequest(event));
    this.addEventListener('instalacion-pwa-solicitada', () => this.install());
    this.addEventListener('cerrar-sesion-solicitado', () => this.onLogoutRequest());
    this.refs.view.addEventListener('click', event => { if (event.target.closest('[data-refresh]')) this.renderRoute(); });
    window.addEventListener('hashchange', () => this.renderRoute());
    window.addEventListener('online', () => this.updateConnection()); window.addEventListener('offline', () => this.updateConnection());
    window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); this.installPrompt = event; this.refs.header.canInstall = true; });
    window.addEventListener('appinstalled', () => { this.installPrompt = null; this.refs.header.canInstall = false; });
    this.orderChannel = 'BroadcastChannel' in window ? new BroadcastChannel('cafefe-orders') : null;
    this.orderChannel?.addEventListener('message', event => { if (event.data?.type === 'order-created' && this.currentRoute === 'recepcion') this.refreshReception(); });
    this.updateConnection(); if (!location.hash) location.hash = '#/pedido'; if (this._controller) this.renderRoute();
  }
  onAuthenticated(employee) {
    this.employee = employee; sessionStorage.setItem('cafefe-user', JSON.stringify(employee)); this.refs.header.employee = employee;
    if (roleIncludes(employee, 'CAJERO')) location.hash = '#/pago';
    else if (roleIncludes(employee, 'BARISTA', 'COCINERO')) location.hash = '#/recepcion';
    else { sessionStorage.removeItem('cafefe-user'); this.employee = null; this.refs.header.employee = null; this.toast('Tu usuario no tiene un rol de caja o cocina habilitado.'); location.hash = '#/login'; }
  }
  onLogoutRequest() { sessionStorage.removeItem('cafefe-user'); this.employee = null; this.refs.header.employee = null; location.hash = '#/login'; }
  onLoginRequest(event) {
    const boundary = event.composedPath()[0]; boundary.setPending(true);
    this._controller.loginEmpleado(event.detail.nombre, event.detail.contrasena)
      .then(employee => this.onAuthenticated(employee))
      .catch(error => boundary.showError(error.message || error.mensaje || 'No se pudo validar el empleado.'));
  }
  onOrderRequest(event) {
    const boundary = this.catalogView?.cart || event.composedPath()[0]; boundary.setPending(true);
    this._controller.crearOrden(event.detail)
      .then(order => {
        boundary.items = []; this.cartItems = []; this.toast(`Orden ${order.idOrden ? `#${order.idOrden} ` : ''}enviada a cocina.`);
        this.orderChannel?.postMessage({ type: 'order-created', idOrden: order.idOrden });
        if (this.currentRoute === 'recepcion') this.refreshReception();
      })
      .catch(error => boundary.setError(error.message || error.mensaje || 'No se pudo enviar el pedido.')).finally(() => boundary.setPending(false));
  }
  onCategorySelected(event) { if (this.catalogView) this.catalogView.selectedCategory = event.detail; }
  onProductAdded(event) {
    if (!this.catalogView) return;
    const product = event.detail.product; const current = this.cartItems || [];
    const line = current.find(item => String(item.idProducto) === String(product.idProducto));
    this.cartItems = line
      ? current.map(item => item === line ? { ...item, cantidad: item.cantidad + 1 } : { ...item })
      : [...current.map(item => ({ ...item })), { idProducto: product.idProducto, nombreProducto: product.nombre, precio: product.precioSugerido, cantidad: 1, observaciones: '' }];
    this.catalogView.cart.items = this.cartItems;
  }
  onDispatchRequest(event) {
    const { idOrden, ready } = event.detail;
    try {
      const updated = this._controller.actualizarDespachoOrden(idOrden, ready);
        if (updated) { fetch('/cafefe/api/orden/' + encodeURIComponent(idOrden) + '/despachar', { method: 'PUT' }).catch(() => {}); this.orderDetail?.close(); }
      this.orderList?.setOrderReady(idOrden, updated);
      if (this.orderDetail && String(this.orderDetail.order?.idOrden) === String(idOrden)) this.orderDetail.dispatched = updated;
      this.toast(updated ? 'Orden marcada como lista / despachada.' : 'Orden devuelta a pendiente.');
    } catch (error) { this.toast(error.message || 'No se pudo actualizar el despacho de la orden.'); }
  }
  onInvoiceRequest(event) {
    const boundary = event.composedPath?.()[0] || event.target;
    boundary?.setPending?.(true);
    const routeGeneration = this.routeGeneration;
    this._controller.crearFactura(event.detail)
      .then(invoice => {
        if (!invoice?.idFactura) throw new Error('El servidor no devolvió el identificador de la factura.');
        if (routeGeneration === this.routeGeneration) return this.afterInvoiceCreated(invoice);
      })
      .catch(error => {
        const msg = error?.message || error?.mensaje || 'No se pudo crear la factura.';
        if (boundary?.setError) boundary.setError(msg);
        else { boundary?.setPending?.(false); this.toast(msg); }
      });
  }
  onPaymentRequest(event) {
    const boundary = event.composedPath?.()[0] || event.target;
    boundary?.setPending?.(true);
    const routeGeneration = this.routeGeneration;
    const detailGeneration = this.detailGeneration;
    this._controller.registrarPago(event.detail)
      .then(pago => {
        if (routeGeneration !== this.routeGeneration) return;
        const refresh = this.refreshCashier();
        const ticket = detailGeneration === this.detailGeneration
          ? this.showTicket(event.detail.factura.idFactura, pago?.detalles?.length ? pago.detalles : event.detail.detalles)
          : Promise.resolve();
        return Promise.all([refresh, ticket]);
      })
      .catch(error => {
        const msg = error?.message || error?.mensaje || 'No se pudo registrar el pago.';
        if (boundary?.setError) boundary.setError(msg);
        else { boundary?.setPending?.(false); this.toast(msg); }
      });
  }
  renderRoute() {
    if (!this._controller) return Promise.resolve();
    clearInterval(this.pollTimer); this.routeGeneration++; this.detailGeneration++;
    const generation = this.routeGeneration;
    this.currentRoute = location.hash.replace(/^#\/?/, '').split('/')[0] || 'pedido';
    const route = this.currentRoute;
    const view = this.refs.view;
    if (route === 'pedido') {
      const catalog = document.createElement('catalog-view'); this.catalogView = catalog; view.replaceChildren(catalog);
      return Promise.all([this._controller.cargarTiposProducto(), this._controller.cargarProductos()])
        .then(([categories, products]) => { if (generation !== this.routeGeneration) return; catalog.categories = categories; catalog.products = products; this.productCatalogById = catalog.productsById; })
        .catch(error => { if (generation === this.routeGeneration) this.toast(`No se pudo cargar el menú: ${error.message}`); });
    }
    this.catalogView = null;
    if (route === 'login') { const shell = document.createElement('div'); shell.className = 'shell'; shell.append(document.createElement('login-view')); view.replaceChildren(shell); return Promise.resolve(); }
    if (route === 'recepcion') {
      if (!roleIncludes(this.employee, 'BARISTA', 'COCINERO')) { location.hash = '#/login'; return Promise.resolve(); }
      const shell = this.pageShell('Cocina y barra', 'Recepción de órdenes', 'Órdenes pendientes de preparar.', employeeGreeting(this.employee));
      const layout = document.createElement('div'); layout.className = 'reception-layout';
      const ordersSection = document.createElement('section'); ordersSection.className = 'reception-orders';
      const title = document.createElement('h2'); title.textContent = 'Cola de cocina';
      this.orderList = document.createElement('orden-pendiente-list'); this.orderList.mode = 'reception';
      ordersSection.append(title, this.orderList);
      const detailPanel = document.createElement('aside'); detailPanel.className = 'reception-detail'; detailPanel.setAttribute('aria-label', 'Detalle de la orden seleccionada');
      this.orderDetail = document.createElement('orden-detail'); detailPanel.append(this.orderDetail);
      layout.append(ordersSection, detailPanel); shell.append(layout); view.replaceChildren(shell);
      this.pollTimer = setInterval(() => this.refreshReception(), 5000);
      return this.refreshReception(generation);
    }
    if (route === 'pago') {
      if (!roleIncludes(this.employee, 'CAJERO')) { location.hash = '#/login'; return Promise.resolve(); }
      const shell = this.pageShell('Caja', 'Facturación y pagos', 'Factura órdenes pendientes y registra pagos divididos.', employeeGreeting(this.employee));
      const split = document.createElement('div'); split.className = 'split';
      const invoicesSection = document.createElement('section'); invoicesSection.className = 'pending-invoices';
      const invoiceTitle = document.createElement('h2'); invoiceTitle.textContent = 'Facturas pendientes'; this.invoiceList = document.createElement('factura-pendiente-list'); invoicesSection.append(invoiceTitle, this.invoiceList);
      const ordersSection = document.createElement('section'); ordersSection.className = 'orders-to-invoice';
      const orderTitle = document.createElement('h2'); orderTitle.textContent = 'Órdenes por facturar'; this.orderList = document.createElement('orden-pendiente-list'); this.orderList.mode = 'invoice'; ordersSection.append(orderTitle, this.orderList);
      split.append(invoicesSection, ordersSection); this.cashierDetail = document.createElement('div'); this.cashierDetail.id = 'cashier-detail'; this.cashierDetail.className = 'cashier-detail'; shell.append(split, this.cashierDetail); view.replaceChildren(shell);
      return this.refreshCashier(generation);
    }
    const message = document.createElement('div'); message.className = 'shell page'; message.textContent = 'No existe esta vista.'; view.replaceChildren(message); return Promise.resolve();
  }
  pageShell(eyebrow, title, description, greeting = '') {
    const shell = document.createElement('div'); shell.className = 'shell page';
    const heading = document.createElement('div'); heading.className = 'page-heading row';
    const copy = document.createElement('div'); const eyebrowNode = document.createElement('span'); eyebrowNode.className = 'eyebrow'; eyebrowNode.textContent = eyebrow;
    const titleNode = document.createElement('h1'); titleNode.textContent = title; const descriptionNode = document.createElement('p'); descriptionNode.textContent = description;
    copy.append(eyebrowNode, titleNode, descriptionNode);
    if (greeting) { const salutation = document.createElement('p'); salutation.className = 'employee-greeting'; salutation.textContent = greeting; copy.append(salutation); }
    const refresh = document.createElement('button'); refresh.className = 'btn secondary'; refresh.dataset.refresh = ''; refresh.textContent = 'Actualizar'; heading.append(copy, refresh); shell.append(heading); return shell;
  }
  refreshReception(generation = this.routeGeneration) {
    if (!this.orderList || this.currentRoute !== 'recepcion') return Promise.resolve();
    return Promise.all([this._controller.cargarOrdenesPendientes(), this._controller.cargarProductos()])
      .then(([orders, products]) => {
        if (generation !== this.routeGeneration || !this.orderList) return;
        this.orderList.products = products; this.orderList.dispatchedIds = this._controller.obtenerOrdenesListas(); this.orderList.items = orders;
        this.productCatalogById = new Map(products.map(product => [String(product.idProducto), product]));
      })
      .catch(error => this.toast(`No se pudieron actualizar las órdenes: ${error.message}`));
  }
  refreshCashier(generation = this.routeGeneration) {
    if (this.currentRoute !== 'pago') return Promise.resolve();
    return Promise.all([this._controller.cargarOrdenesPendientes(), this._controller.cargarFacturasPendientes(), this._controller.cargarProductos()])
      .then(([orders, invoices, products]) => {
        if (generation !== this.routeGeneration || this.currentRoute !== 'pago') return;
        this.productCatalogById = new Map(products.map(product => [String(product.idProducto), product]));
        this.orderList.products = products; this.orderList.dispatchedIds = this._controller.obtenerOrdenesListas(); this.orderList.items = orders;
        this.invoiceList.items = invoices;
      }).catch(error => this.toast(`No se pudo actualizar Caja: ${error.message}`));
  }
  showOrderDetail(order) {
    if (!this.orderDetail) return;
    this.orderDetail.productsById = this.productCatalogById; this.orderDetail.dispatched = this._controller.obtenerOrdenesListas().has(String(order.idOrden)); this.orderDetail.order = order;
    if (window.matchMedia('(max-width: 899px)').matches) this.orderDetail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  showInvoiceForm(order) {
    if (!this.cashierDetail) return;
    this.detailGeneration++;
    this.cashierDetail.replaceChildren();
    const role = this.employee.roles.find(item => String(item.nombre).toUpperCase().includes('CAJERO'));
    const form = document.createElement('factura-form'); form.context = { order, employeeRoleId: role?.idEmpleadoRol, productsById: this.productCatalogById }; this.invoiceForm = form; this.cashierDetail.replaceChildren(form);
    this._controller.cargarCajasActivas().then(boxes => { if (this.invoiceForm === form) form.activeBoxes = boxes; }).catch(error => form.setError(`No se pudieron cargar cajas: ${error.message}`));
    if (window.matchMedia('(max-width: 899px)').matches) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  afterInvoiceCreated(invoice) {
    const generation = ++this.detailGeneration;
    return Promise.all([this.refreshCashier(), this._controller.consultarFactura(invoice.idFactura).catch(() => invoice)])
      .then(([, refreshedInvoice]) => {
        if (!this.cashierDetail || this.currentRoute !== 'pago' || generation !== this.detailGeneration) return;
        const form = document.createElement('pago-form'); form.productsById = this.productCatalogById; form.invoice = refreshedInvoice; this.cashierDetail.replaceChildren(form); this.toast(`Factura #${invoice.idFactura} creada.`);
      });
  }
  showPaymentForm(idFactura) {
    if (!this.cashierDetail) return;
    const generation = ++this.detailGeneration;
    this.cashierDetail.replaceChildren();
    this._controller.consultarFactura(idFactura).then(invoice => {
      if (!this.cashierDetail || this.currentRoute !== 'pago' || generation !== this.detailGeneration) return;
      const form = document.createElement('pago-form'); form.productsById = this.productCatalogById; form.invoice = invoice; this.cashierDetail.replaceChildren(form);
    }).catch(error => this.toast(`No se pudo abrir la factura: ${error.message}`));
  }
  showTicket(idFactura, paymentDetails = []) {
    const generation = ++this.detailGeneration;
    return this._controller.consultarFactura(idFactura).then(invoice => {
      if (!this.cashierDetail || this.currentRoute !== 'pago' || generation !== this.detailGeneration) return;
      const ticket = document.createElement('ticket-view'); ticket.productsById = this.productCatalogById; ticket.paymentDetails = paymentDetails; ticket.invoice = invoice;
      this.cashierDetail.replaceChildren(ticket); ticket.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(error => this.toast(`Pago registrado; no se pudo cargar el ticket: ${error.message}`));
  }
  install() {
    if (!this.installPrompt) { this.toast("Para instalar Cafefe usa el menú del navegador (⋮ -> Instalar Cafefe) en una ventana normal (no InPrivate)."); return Promise.resolve(); }
    const prompt = this.installPrompt; this.installPrompt = null; this.refs.header.canInstall = false;
    try { return Promise.resolve(prompt.prompt()).catch(() => this.toast('No se pudo iniciar la instalación de Cafefe.')); }
    catch { this.toast('No se pudo iniciar la instalación de Cafefe.'); return Promise.resolve(); }
  }
  updateConnection() { if (this.refs?.connection) this.refs.connection.textContent = navigator.onLine ? ' · En línea' : ' · Sin conexión'; }
  toast(message) { const element = this.refs.toast; element.textContent = message; element.hidden = false; clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { element.hidden = true; }, 3600); }
}

customElements.define('cafefe-app', CafefeApp);
