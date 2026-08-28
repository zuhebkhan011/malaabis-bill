import React from "react";
import { formatINR } from "../../utils/currency";

export default function SummaryCard({ summary, supplier }) {
  if (!summary || !supplier) return null;

  return (
    <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Import Summary</h4>
      
      <div className="space-y-3.5 text-sm">
        {/* Supplier */}
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <span className="text-secondary text-xs">Supplier:</span>
          <span className="font-semibold text-on-surface text-right">{supplier.name}</span>
        </div>

        {/* Invoice Number */}
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <span className="text-secondary text-xs">Invoice No:</span>
          <span className="font-mono text-xs font-bold text-on-surface bg-white/5 px-2 py-0.5 rounded border border-white/10">{supplier.invoiceNumber}</span>
        </div>

        {/* Total Products Found */}
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <span className="text-secondary text-xs">Products Found:</span>
          <span className="font-semibold text-on-surface">{summary.totalProductsFound} Items</span>
        </div>

        {/* Existing Products */}
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <span className="text-secondary text-xs">Existing Products:</span>
          <span className="font-semibold text-emerald-400">{summary.existingCount} Lines</span>
        </div>

        {/* New Products */}
        <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
          <span className="text-secondary text-xs">New Products:</span>
          <span className="font-semibold text-blue-400">{summary.newCount} Lines</span>
        </div>

        {/* Estimated Total */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-secondary text-xs font-bold uppercase tracking-wider">Estimated Total Cost:</span>
          <span className="text-xl font-headline font-bold text-primary">{formatINR(summary.estimatedTotal)}</span>
        </div>
      </div>
    </div>
  );
}
