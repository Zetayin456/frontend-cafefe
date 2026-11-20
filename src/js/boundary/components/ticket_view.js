import { escapeHTML, formatMoney, productName } from '../boundary_utils.js';

export const formatTicketDate = (value, now = new Date()) => {
  const parsed = value ? new Date(value) : null;
  const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : now;
  return new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const paymentLabel = type => ({ EFECTIVO: 'Efectivo', TARJETA: 'Tarjeta', QR: 'QR' }[String(type || '').toUpperCase()] || type || 'Pago');

export class TicketView extends HTMLElement {
  constructor() {
    super();
    this._root = this.shadowRoot || this.attachShadow?.({ mode: 'open' }) || this;
    this._productsById = new Map();
    this._paymentDetails = null;
  }
  set invoice(value) { this._invoice = value; if (this.isConnected || this._root) this.render(); }
  set productsById(value) { this._productsById = value || new Map(); if (this._invoice) this.render(); }
  set paymentDetails(value) { this._paymentDetails = Array.isArray(value) ? value : null; if (this._invoice) this.render(); }
  connectedCallback() { this.render(); }
  render() {
    if (!this._invoice) return;
    const invoice = this._invoice;
    const embeddedPaymentDetails = invoice.pagos?.flatMap(payment => payment.detalles || []) ?? invoice.pago?.detalles ?? [];
    const paymentDetails = this._paymentDetails?.length ? this._paymentDetails : embeddedPaymentDetails;
    const date = formatTicketDate(invoice.fechaFacturacion || invoice.fechaCreacion);
    const lines = invoice.detalle || invoice.productos || [];
    this._root.innerHTML = `<style>
      :host{display:block;color:var(--color-text,#20342e);font:14px/1.5 var(--font-ui,Arial,sans-serif)}
      *{box-sizing:border-box}
      .ticket-shell{max-width:520px;margin:0 auto;padding:var(--space-5,24px);background:var(--white,#fff);border:1px solid var(--color-line,#e7e7df);border-radius:var(--radius-card,18px);box-shadow:0 4px 18px #20342e12}
      .ticket-title{text-align:center;margin:0 0 var(--space-2,6px);color:var(--color-forest,#173c32);font:700 24px var(--font-display,Georgia,serif)}
      .ticket-meta{text-align:center;color:var(--color-muted,#53615a);margin:var(--space-2,5px) 0}
      .ticket-section{margin:var(--space-4,18px) 0 0;padding-top:var(--space-3,12px);border-top:1px dashed var(--color-line,#b9c1bb)}
      .ticket-row{display:flex;justify-content:space-between;gap:var(--space-3,14px);padding:var(--space-2,8px) 0;border-bottom:1px dashed var(--color-line,#e1e4df)}
      .ticket-row span:first-child{overflow-wrap:anywhere}
      .ticket-total{display:flex;justify-content:space-between;margin-top:var(--space-3,14px);padding-top:var(--space-3,12px);border-top:2px solid var(--color-text,#20342e);font-size:17px;font-weight:700}
      .ticket-thanks{text-align:center;margin:var(--space-5,22px) 0 0;color:var(--color-muted,#53615a)}
      .ticket-actions{margin:0 0 var(--space-4,16px);text-align:center}
      .btn-print{border:0;border-radius:var(--radius-small,9px);padding:10px 14px;background:var(--color-terracotta,#d98250);color:var(--white,#fff);font:600 14px var(--font-ui,Arial,sans-serif);cursor:pointer}
      @media print{
        :host{display:block!important;position:fixed!important;inset:0!important;width:100%!important;height:100%!important;overflow:visible!important;background:#fff!important;color:#000!important;visibility:visible!important;z-index:2147483647!important}
        *,*:before,*:after{visibility:visible!important}
        .ticket-shell{width:80mm;max-width:80mm;margin:0 auto;padding:0;border:0;border-radius:0;box-shadow:none;color:#000}
        .ticket-actions{display:none!important}
        .ticket-row{border-color:#aaa}
      }
    </style><section class="ticket-shell" aria-label="Ticket de pago"><div class="ticket-actions"><button class="btn-print" type="button" data-print>Imprimir / Guardar como PDF</button></div><h1 class="ticket-title">☕ Cafefe</h1><p class="ticket-meta">Ticket · Factura #${escapeHTML(invoice.idFactura)}</p><p class="ticket-meta">Cliente: ${escapeHTML(invoice.cliente)}</p><p class="ticket-meta">Fecha: ${escapeHTML(date)}</p><div class="ticket-section">${lines.map(item => `<div class="ticket-row"><span>${escapeHTML(item.cantidad)} × ${escapeHTML(productName(item, this._productsById))}</span><span>${formatMoney(item.precio * item.cantidad)}</span></div>`).join('')}</div><div class="ticket-total"><span>Total</span><span>${formatMoney(invoice.total)}</span></div><div class="ticket-section"><strong>Medios de pago</strong>${paymentDetails.map(detail => `<div class="ticket-row"><span>${escapeHTML(paymentLabel(detail.tipoPago))}</span><span>${formatMoney(detail.monto)}</span></div>`).join('') || '<p class="ticket-meta">Detalle de pago no disponible.</p>'}</div><p class="ticket-thanks">¡Gracias por preferirnos!</p></section>`;
    this._root.querySelector('[data-print]')?.addEventListener('click', () => window.print());
  }
}

customElements.define('ticket-view', TicketView);
