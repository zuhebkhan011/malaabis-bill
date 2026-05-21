import React from "react";

function formatCurrency(value) {
  return `PKR ${Number(value || 0).toLocaleString()}`;
}

export default function InvoicePreviewModal({ open, invoice, onClose, onShareWhatsApp, onPrint }) {
  if (!open || !invoice) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:hidden animate-modal-pop">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-3xl rounded-[32px] overflow-hidden border border-[#4d4635]/25 bg-[radial-gradient(circle_at_top,_rgba(242,202,80,0.12),_transparent_45%),linear-gradient(180deg,#111111,#080808)] shadow-[0_32px_90px_rgba(0,0,0,0.58)]">
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">Invoice preview</p>
            <h2 className="text-2xl sm:text-3xl font-headline text-white mt-2">Invoice #{invoice.invoiceNumber || "MALAABIS"}</h2>
            <p className="text-sm text-secondary mt-2">Premium, print-friendly summary ready for WhatsApp sharing.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Close invoice preview"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="invoice-preview-sheet bg-white text-black rounded-[28px] overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
            <div className="px-5 sm:px-6 py-5 border-b border-black/10 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#444]">Malaabis Studio</p>
                <h3 className="text-2xl font-semibold mt-2">Thank you for shopping with us</h3>
                <p className="text-sm text-[#555] mt-2">A clean invoice snapshot for the customer and your shop records.</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-[0.26em] text-[#555]">Payment</p>
                <p className="text-base font-semibold mt-2">{invoice.paymentMethod}</p>
                <p className="text-xs text-[#666] mt-1">{invoice.customerMobile || "No mobile provided"}</p>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-5 grid gap-4 sm:grid-cols-2 border-b border-black/10">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#666]">Customer</p>
                <p className="text-lg font-semibold mt-2">{invoice.customerName}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#666]">Invoice date</p>
                <p className="text-lg font-semibold mt-2">{new Date(invoice.createdAt || Date.now()).toLocaleString()}</p>
              </div>
            </div>

            <div className="px-5 sm:px-6 py-5 border-b border-black/10">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-[#666] pb-3">
                <span>Item</span>
                <span>Qty</span>
                <span>Amount</span>
              </div>
              <div className="space-y-3">
                {(invoice.items || []).map((item) => (
                  <div key={`${item.product || item.name}-${item.quantity}`} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-[10px] uppercase tracking-wider text-[#666] mt-1">SKU: {item.sku || "ML-N/A"}</p>
                    </div>
                    <div className="w-12 text-center text-[#444]">x{item.quantity}</div>
                    <div className="w-28 text-right font-semibold">{formatCurrency(item.lineTotal || item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 sm:px-6 py-5 bg-[#f7f7f7]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 text-sm text-[#444]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>GST</span>
                    <span className="font-medium">{formatCurrency(invoice.gstAmount)}</span>
                  </div>
                  {Number(invoice.discountAmount || 0) > 0 ? (
                    <div className="flex items-center justify-between gap-3 text-emerald-700">
                      <span>Discount</span>
                      <span className="font-medium">- {formatCurrency(invoice.discountAmount)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 sm:text-right text-sm">
                  <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-6 text-[#444]">
                    <span>Cash change</span>
                    <span className="font-medium">{formatCurrency(invoice.cashChange)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-6 pt-3 border-t border-black/10">
                    <span className="text-base font-semibold text-black">Grand Total</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-black text-white p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/65">Payment method</p>
                  <p className="text-lg font-semibold mt-2">{invoice.paymentMethod}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/65">Status</p>
                  <p className="text-lg font-semibold mt-2 text-primary">Paid</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-primary/20 bg-primary/10 p-4 sm:p-5">
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined">verified</span>
              <p className="font-semibold">Payment captured successfully</p>
            </div>
            <p className="text-sm text-secondary mt-2">You can now print the invoice or send the summary directly to the customer on WhatsApp.</p>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[50px] rounded-xl border border-white/10 text-white uppercase tracking-wider text-xs font-semibold hover:bg-white/5 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="flex-1 min-h-[50px] rounded-xl bg-white text-black uppercase tracking-wider text-xs font-semibold hover:bg-[#f3f3f3] transition-colors"
          >
            Print invoice
          </button>
          <button
            type="button"
            onClick={onShareWhatsApp}
            className="flex-1 min-h-[50px] rounded-xl bg-primary text-black uppercase tracking-wider text-xs font-semibold hover:bg-[#ffe088] transition-colors"
          >
            Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}