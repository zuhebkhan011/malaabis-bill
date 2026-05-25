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
}) {
  // ⚠️ Hooks MUST be before any conditional return (Rules of Hooks)
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Make the offscreen template visible for capture
      const captureEl = document.getElementById("malaabis-invoice-capture");
      const wrapper = captureEl?.parentElement;
      const prevHeight = wrapper?.style.height;
      const prevOverflow = wrapper?.style.overflow;
      if (wrapper) {
        wrapper.style.height = "auto";
        wrapper.style.overflow = "visible";
      }
      await InvoicePDFService.generateAndSave(invoice);
      if (wrapper) {
        wrapper.style.height = prevHeight || "1px";
        wrapper.style.overflow = prevOverflow || "hidden";
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      onPrint?.();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (Capacitor.isNativePlatform()) {
      // On Android/iOS, share PDF instead of window.print()
      setIsGeneratingPDF(true);
      try {
        const captureEl = document.getElementById("malaabis-invoice-capture");
        const wrapper = captureEl?.parentElement;
        const prevHeight = wrapper?.style.height;
        const prevOverflow = wrapper?.style.overflow;
        if (wrapper) {
          wrapper.style.height = "auto";
          wrapper.style.overflow = "visible";
        }
        await InvoicePDFService.generateAndSave(invoice);
        if (wrapper) {
          wrapper.style.height = prevHeight || "1px";
          wrapper.style.overflow = prevOverflow || "hidden";
        }
      } catch (err) {
        console.error("Print generation failed:", err);
      } finally {
        setIsGeneratingPDF(false);
      }
    } else {
      onPrint?.();
    }
  };

  if (!open || !invoice) return null;

  return (
    <div className="fixed inset-0 z-[95] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:hidden animate-modal-pop">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-3xl rounded-[32px] overflow-hidden border border-[#4d4635]/25 bg-[radial-gradient(circle_at_top,_rgba(242,202,80,0.12),_transparent_45%),linear-gradient(180deg,#111111,#080808)] shadow-[0_32px_90px_rgba(0,0,0,0.58)]">
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4">
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
            <h2 className="text-2xl sm:text-3xl font-headline text-white mt-2">
              Invoice #{invoice.invoiceNumber || "MALAABIS"}
            </h2>
            <p className="text-sm text-secondary mt-2">
              Premium invoice ready for download, print or WhatsApp sharing.
            </p>
          </div>
        </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Close invoice preview"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Scrollable container for the actual premium InvoiceTemplate */}
          <div className="w-full overflow-x-auto p-4 sm:p-6 bg-white border border-[#4d4635]/20 rounded-[28px] shadow-[0_18px_45px_rgba(0,0,0,0.25)] flex justify-start sm:justify-center max-h-[50vh] overflow-y-auto">
            <div className="shrink-0" style={{ width: "794px" }}>
              <InvoiceTemplate invoice={invoice} />
            </div>
          </div>

          <div className="mt-4 rounded-[28px] border border-primary/20 bg-primary/10 p-4 sm:p-5">
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined">verified</span>
              <p className="font-semibold">Payment captured successfully</p>
            </div>
            <p className="text-sm text-secondary mt-2">
              Download PDF, print the invoice, or send it to the customer on WhatsApp.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-white/10 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[50px] rounded-xl border border-white/10 text-white uppercase tracking-wider text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
          >
            Close
          </button>
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

      {/* Offscreen high-definition template for PDF screenshot capture */}
      <div 
        style={{ 
          position: "fixed", 
          left: "-9999px", 
          top: 0, 
          zIndex: -1, 
          width: "794px", 
          pointerEvents: "none", 
          background: "#ffffff",
          overflow: "hidden",
          height: "1px"
        }}
      >
        <InvoiceTemplate invoice={invoice} />
      </div>
    </div>
  );
}