import React from "react";
import BarcodeGenerator from "../BarcodeGenerator";
import { formatINR } from "../../utils/currency";

export default function BarcodePrintPreview({ product, onClose }) {
  if (!product) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 print:hidden">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md rounded-[28px] bg-[#121212] border border-[#4d4635]/30 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-secondary">Printable barcode preview</p>
            <h3 className="text-2xl font-headline text-on-surface mt-2">{product.name}</h3>
            <p className="text-xs text-outline mt-2 uppercase tracking-wider">SKU: {product.sku || "ML-N/A"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
            aria-label="Close preview"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="barcode-print-area p-6 bg-white barcode-preview-sheet text-black">
          <div className="space-y-1 mb-5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#353535]">Malaabis Studio</p>
            <h4 className="text-xl font-semibold leading-tight">{product.name}</h4>
            <p className="text-sm text-[#353535]">{formatINR(product.price)} • {product.category || "UNSTITCHED"}</p>
          </div>
          <BarcodeGenerator value={product.sku || "MALAABIS"} height={72} widthScale={2} />
          <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[#353535]">
            <span>{product.sku || "ML-N/A"}</span>
            <span>Ready to print</span>
          </div>
        </div>

        <div className="p-4 flex gap-3 bg-[#121212]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl border border-white/10 text-white uppercase tracking-wider text-xs font-semibold hover:bg-white/5 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 min-h-[48px] rounded-xl bg-primary text-black uppercase tracking-wider text-xs font-semibold hover:bg-[#ffe088] transition-colors"
          >
            Print label
          </button>
        </div>
      </div>
    </div>
  );
}