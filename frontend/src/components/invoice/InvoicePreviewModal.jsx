import React from "react";
import { Capacitor } from "@capacitor/core";
import { InvoicePDFService } from "../../services/InvoicePDFService";
import InvoiceTemplate from "./InvoiceTemplate";
import { formatINR } from "../../utils/currency";

export default function InvoicePreviewModal({
  open,
  invoice,
  onClose,
  onShareWhatsApp,
  onPrint,
  onEdit,
}) {
  // ⚠️ Hooks MUST be before any conditional return (Rules of Hooks)
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  // Default to A5 paper size across all devices (OnePlus, Android, iPhone, Windows, Mac)
  const [paperSize, setPaperSize] = React.useState("A5");

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await InvoicePDFService.generateAndSave(invoice, paperSize.toLowerCase());
    } catch (err) {
      console.error("PDF generation failed:", err);
      onPrint?.(paperSize.toLowerCase());
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    setIsGeneratingPDF(true);
    try {
      await InvoicePDFService.printInvoice(invoice, paperSize.toLowerCase());
    } catch (err) {
      console.error("PDF Print failed, falling back to window.print():", err);
      if (onPrint) {
        onPrint(paperSize.toLowerCase());
      } else {
        window.print();
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!open || !invoice) return null;

  return (
    <div className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto invoice-modal-root animate-modal-pop">
      <div className="absolute inset-0 print:hidden" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-3xl rounded-[32px] overflow-hidden border border-[#4d4635]/25 bg-[radial-gradient(circle_at_top,_rgba(242,202,80,0.12),_transparent_45%),linear-gradient(180deg,#111111,#080808)] shadow-[0_32px_90px_rgba(0,0,0,0.58)] invoice-modal-card">
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt="Malaabis Studio"
              className="h-14 w-auto object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] shrink-0"
              onError={(e) => { e.target.style.display = "none"; }}
            />
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">
                Invoice preview
              </p>
              <h2 className="text-2xl sm:text-3xl font-headline text-white mt-1">
                Invoice #{invoice.invoiceNumber || "MALAABIS"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Paper Size Selector (Default A5 across all devices) */}
            <div className="flex items-center gap-1 bg-black/50 border border-[#4d4635]/30 rounded-xl p-1 shrink-0">
              <span className="text-[9px] text-outline font-semibold uppercase px-1.5 hidden sm:inline">Size:</span>
              <button
                type="button"
                onClick={() => setPaperSize("A5")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  paperSize === "A5"
                    ? "bg-primary text-black shadow-[0_0_12px_rgba(242,202,80,0.3)]"
                    : "text-secondary hover:text-white"
                }`}
              >
                A5 (Default)
              </button>
              <button
                type="button"
                onClick={() => setPaperSize("A4")}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  paperSize === "A4"
                    ? "bg-primary text-black shadow-[0_0_12px_rgba(242,202,80,0.3)]"
                    : "text-secondary hover:text-white"
                }`}
              >
                A4
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0"
              aria-label="Close invoice preview"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Scrollable container for the actual premium InvoiceTemplate */}
          <div className="w-full overflow-x-auto p-4 sm:p-6 bg-white border border-[#4d4635]/20 rounded-[28px] shadow-[0_18px_45px_rgba(0,0,0,0.25)] flex justify-start sm:justify-center max-h-[50vh] overflow-y-auto invoice-scroll-area">
            <div className="shrink-0" style={{ width: "794px" }}>
              <InvoiceTemplate invoice={invoice} />
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-primary/20 bg-primary/10 p-4 sm:p-5 print:hidden">
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined">verified</span>
              <p className="font-semibold">Payment captured successfully</p>
            </div>
            <p className="text-sm text-secondary mt-2">
              Download PDF, print the invoice, or send it to the customer on WhatsApp.
            </p>
          </div>

          {invoice.revisions && invoice.revisions.length > 0 && (
            <div className="mt-4 rounded-[28px] border border-[#d4af37]/20 bg-[#d4af37]/5 p-4 sm:p-5 print:hidden">
              <div className="flex items-center gap-3 text-primary">
                <span className="material-symbols-outlined">history</span>
                <p className="font-semibold">Revision History Log</p>
              </div>
              <div className="mt-3 space-y-3 max-h-40 overflow-y-auto divide-y divide-[#4d4635]/25">
                {invoice.revisions.map((rev, idx) => (
                  <div key={idx} className="pt-2.5 first:pt-0">
                    <div className="flex justify-between text-xs font-semibold text-secondary">
                      <span>User: {rev.user}</span>
                      <span>{new Date(rev.date).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-outline mt-0.5">
                      <span>Original Total: {formatINR(rev.originalAmount)}</span>
                      <span>Updated Total: {formatINR(rev.updatedAmount)}</span>
                    </div>
                    <ul className="list-disc pl-4 text-xs text-secondary/80 mt-1.5 space-y-0.5">
                      {rev.changesMade.map((chg, cIdx) => (
                        <li key={cIdx}>{chg}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[50px] rounded-xl border border-white/10 text-white uppercase tracking-wider text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(invoice);
              }}
              className="flex-1 min-h-[50px] rounded-xl border border-primary/20 bg-primary/5 text-primary uppercase tracking-wider text-xs font-semibold hover:bg-primary/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit
            </button>
          )}
          <button
            type="button"
            id="download-pdf-btn"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex-1 min-h-[50px] rounded-xl bg-white text-black uppercase tracking-wider text-xs font-semibold hover:bg-[#f3f3f3] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={onShareWhatsApp}
            className="flex-1 min-h-[50px] rounded-xl bg-primary text-black uppercase tracking-wider text-xs font-semibold hover:bg-[#ffe088] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">share</span>
            WhatsApp
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isGeneratingPDF}
            className="flex-1 min-h-[50px] rounded-xl border border-[#ffe088]/30 bg-[#ffe088]/5 text-[#f2ca50] uppercase tracking-wider text-xs font-semibold hover:bg-[#ffe088]/10 hover:border-[#ffe088]/50 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            {isGeneratingPDF ? "Preparing..." : "Print"}
          </button>
        </div>
      </div>
    </div>
  );
}