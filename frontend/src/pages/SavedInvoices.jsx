import React, { useState } from "react";
import { InvoicePDFService } from "../services/InvoicePDFService";
import InvoicePreviewModal from "../components/invoice/InvoicePreviewModal";
import InvoiceTemplate from "../components/invoice/InvoiceTemplate";
import { formatINR } from "../utils/currency";

export default function SavedInvoices({ invoices = [], onDelete, onBack }) {
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [pdfActiveInvoice, setPdfActiveInvoice] = useState(null);

  const handlePreview = (invoice) => {
    setPreviewInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (invoice) => {
    setDownloadingId(invoice._id);
    setPdfActiveInvoice(invoice);
    
    // Allow a small delay for React to render the InvoiceTemplate in the DOM
    setTimeout(async () => {
      try {
        await InvoicePDFService.generateAndSave(invoice);
      } catch (err) {
        alert("Failed to generate PDF: " + (err.message || "Unknown error"));
      } finally {
        setDownloadingId(null);
        setPdfActiveInvoice(null);
      }
    }, 150);
  };

  const handleDelete = (invoice) => {
    if (window.confirm(`Delete invoice #${invoice.invoiceNumber || invoice._id}? This cannot be undone.`)) {
      onDelete?.(invoice._id);
    }
  };

  const handleWhatsApp = (invoice) => {
    const digitsOnly = String(invoice.customerMobile || "").replace(/\D/g, "");
    const itemLines = (invoice.items || []).map((it) => `- ${it.quantity} x ${it.name}`).join("\n");
    const message = [
      `🛍️ Malaabis Studio Invoice #${invoice.invoiceNumber || "N/A"}`,
      `👤 Customer: ${invoice.customerName || "Walk-in Customer"}`,
      `\nItems:\n${itemLines}`,
      `\nSubtotal: ${formatINR(invoice.subtotal)}`,
      Number(invoice.discountAmount || 0) > 0 ? `Discount: - ${formatINR(invoice.discountAmount)}` : null,
      `💰 Grand Total: ${formatINR(invoice.total)}`,
      `Payment: ${invoice.paymentMethod || "CASH"}`,
      `\nThank you for shopping with Malaabis Studio! 🌟`,
    ].filter(Boolean).join("\n");
    const waUrl = digitsOnly ? `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const printInvoice = () => window.print();

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer border border-[#4d4635]/20"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h2 className="font-headline text-3xl text-on-surface">Saved Invoices</h2>
          <p className="text-secondary text-sm mt-0.5">All invoices stored on this device</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">info</span>
        <p className="text-sm text-secondary">
          Invoices are automatically saved to your device after every sale — available even when offline.
        </p>
      </div>

      {/* Empty state */}
      {invoices.length === 0 ? (
        <div className="text-center py-24 text-secondary border border-dashed border-[#4d4635]/20 rounded-2xl bg-[#121212]">
          <span className="material-symbols-outlined text-5xl text-outline mb-3 block">receipt_long</span>
          <p className="text-base font-semibold text-on-surface">No saved invoices yet</p>
          <p className="text-sm mt-1">Create a bill and it will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const date = new Date(invoice.createdAt || invoice.savedAt || Date.now());
            const isOffline = !!invoice.offline;

            return (
              <div
                key={invoice._id}
                className="bg-[#121212] rounded-2xl border border-[#4d4635]/15 hover:border-primary/25 transition-all duration-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="px-5 py-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
                        #{invoice.invoiceNumber || invoice._id?.slice(-8) || "N/A"}
                      </span>
                      {isOffline && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          Offline
                        </span>
                      )}
                    </div>
                    <p className="text-on-surface font-semibold mt-1 truncate">
                      {invoice.customerName || "Walk-in Customer"}
                    </p>
                    <p className="text-secondary text-xs mt-0.5">
                      {invoice.customerMobile || "—"} · {date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-primary font-headline text-xl">{formatINR(invoice.total)}</p>
                    <p className="text-secondary text-[10px] uppercase tracking-wider mt-0.5">{invoice.paymentMethod || "CASH"}</p>
                  </div>
                </div>

                {/* Items preview */}
                <div className="px-5 pb-3">
                  <div className="text-xs text-secondary line-clamp-2">
                    {(invoice.items || []).map((it) => `${it.name} ×${it.quantity}`).join(", ")}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => handlePreview(invoice)}
                    className="flex-1 min-w-[80px] h-9 rounded-xl border border-[#4d4635]/30 text-secondary hover:text-on-surface hover:border-primary/30 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(invoice)}
                    disabled={downloadingId === invoice._id}
                    className="flex-1 min-w-[80px] h-9 rounded-xl border border-white/10 bg-white/5 text-on-surface hover:bg-white/10 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                    {downloadingId === invoice._id ? "..." : "PDF"}
                  </button>
                  <button
                    onClick={() => handleWhatsApp(invoice)}
                    className="flex-1 min-w-[80px] h-9 rounded-xl bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    WA
                  </button>
                  <button
                    onClick={() => handleDelete(invoice)}
                    className="w-9 h-9 rounded-xl bg-error-container/30 border border-error/15 text-on-error-container hover:bg-error-container/50 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        open={isPreviewOpen}
        invoice={previewInvoice}
        onClose={() => setIsPreviewOpen(false)}
        onShareWhatsApp={() => previewInvoice && handleWhatsApp(previewInvoice)}
        onPrint={printInvoice}
      />

      {/* Offscreen A4 template for PDF capture */}
      <div 
        style={{ 
          position: "fixed", 
          left: "-9999px", 
          top: 0, 
          zIndex: -1, 
          width: "794px", 
          pointerEvents: "none", 
          background: "#ffffff",
          overflow: "visible",
          height: "auto"
        }}
      >
        {pdfActiveInvoice && <InvoiceTemplate invoice={pdfActiveInvoice} />}
      </div>
    </div>
  );
}
