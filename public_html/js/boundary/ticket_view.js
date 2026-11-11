import { escapeHTML, formatMoney, lineName } from './boundary_utils.js';

export class TicketView extends HTMLElement {
  set invoice(value) { this._invoice = value; if (this.isConnected) this.render(); }
  connectedCallback() { this.render(); }
  render() {
    if (!this._invoice) return;
    const invoice = this._invoice;
    const paymentDetails = invoice.pagos?.flatMap(payment => payment.detalles || []) ?? invoice.pago?.detalles ?? [];
    this.innerHTML = `<section class="panel"><span class="badge green">${escapeHTML(invoice.estado || 'PAGADA')}</span><h2>Ticket · Factura #${escapeHTML(invoice.idFactura)}</h2><p>${escapeHTML(invoice.cliente)} · ${formatMoney(invoice.total)}</p><button class="btn warm" data-print>Imprimir / Guardar como PDF</button><div class="ticket-preview"><div class="ticket-brand">☕ Cafefe</div><p>Cliente: ${escapeHTML(invoice.cliente)}</p><p>Fecha: ${escapeHTML(invoice.fechaCreacion || '')}</p>${invoice.detalle.map(item => `<div class="list-row"><span>${escapeHTML(item.cantidad)} × ${escapeHTML(lineName(item))}</span><span>${formatMoney(item.precio * item.cantidad)}</span></div>`).join('')}<div class="total"><span>Total</span><span>${formatMoney(invoice.total)}</span></div>${paymentDetails.map(detail => `<div class="list-row"><span>${escapeHTML(detail.tipoPago)}</span><span>${formatMoney(detail.monto)}</span></div>`).join('')}<p class="muted">¡Gracias por preferirnos!</p></div></section>`;
    this.querySelector('[data-print]').addEventListener('click', () => window.print());
  }
}

customElements.define('ticket-view', TicketView);
