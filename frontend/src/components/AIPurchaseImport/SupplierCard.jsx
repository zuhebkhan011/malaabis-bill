import React from "react";
import { formatINR } from "../../utils/currency";

export default function SupplierCard({ supplier, confidence }) {
  if (!supplier) return null;

  const isLowConfidence = confidence && confidence.supplier < 90;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className={`transition-all duration-300 rounded-2xl p-5 space-y-4 ${
      isLowConfidence 
        ? "bg-amber-950/10 border border-amber-500/30 shadow-md shadow-amber-500/5" 
        : "bg-[#121212] border border-[#4d4635]/15"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Supplier Information</h4>
        {isLowConfidence && (
          <span className="text-[9px] uppercase tracking-wider bg-amber-500 text-black px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 shrink-0">
            <span className="material-symbols-outlined text-[10px]">warning</span>
            Please Verify
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
        {/* Supplier Name */}
        <div className="col-span-2 sm:col-span-3">
          <span className="text-[10px] uppercase tracking-wider text-outline block">Supplier Name</span>
          <span className="text-sm font-semibold text-on-surface mt-0.5 block">{supplier.name}</span>
        </div>

        {/* GST Number */}
        {supplier.gstNumber && (
          <div className="col-span-2 sm:col-span-3">
            <span className="text-[10px] uppercase tracking-wider text-outline block">GSTIN</span>
            <span className="text-xs font-mono font-bold text-primary mt-0.5 block">{supplier.gstNumber}</span>
          </div>
        )}

        {/* Invoice Number */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-outline block">Invoice Number</span>
          <span className="text-xs font-semibold text-on-surface mt-0.5 block">{supplier.invoiceNumber || "N/A"}</span>
        </div>

        {/* Invoice Date */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-outline block">Invoice Date</span>
          <span className="text-xs font-semibold text-on-surface mt-0.5 block">
            {formatDate(supplier.invoiceDate)}
          </span>
        </div>

        {/* Purchase Date */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-outline block">Purchase Date</span>
          <span className="text-xs font-semibold text-on-surface mt-0.5 block">
            {formatDate(supplier.purchaseDate)}
          </span>
        </div>

        {/* Phone Number */}
        {supplier.phone && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-outline block">Phone</span>
            <span className="text-xs font-semibold text-on-surface mt-0.5 block">{supplier.phone}</span>
          </div>
        )}

        {/* Address */}
        {supplier.address && (
          <div className="col-span-2">
            <span className="text-[10px] uppercase tracking-wider text-outline block">Address</span>
            <span className="text-xs text-secondary leading-snug mt-0.5 block">{supplier.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}
