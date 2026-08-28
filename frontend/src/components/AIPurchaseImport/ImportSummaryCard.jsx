import React from "react";
import { formatINR } from "../../utils/currency";

export default function ImportSummaryCard({ products = [], supplier = {}, invoice = {} }) {
  const totalProducts = products.length;
  const exactCount = products.filter((p) => p.matchStatus === "exact").length;
  const similarCount = products.filter((p) => p.matchStatus === "similar").length;
  const newCount = products.filter((p) => p.matchStatus === "new").length;
  
  const estimatedStockIncrease = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
  const estimatedCost = products.reduce((acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.purchasePrice) || 0)), 0);

  return (
    <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Import Preview Summary</h4>
      
      <div className="space-y-3.5 text-sm">
        {/* Supplier details */}
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <span className="text-secondary text-xs">Supplier:</span>
          <span className="font-semibold text-on-surface">{supplier.name || "N/A"}</span>
        </div>

        {/* Invoice Number */}
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <span className="text-secondary text-xs">Invoice Number:</span>
          <span className="font-mono text-xs font-bold text-on-surface bg-white/5 px-2 py-0.5 rounded border border-white/10">
            {invoice.number || supplier.invoiceNumber || "N/A"}
          </span>
        </div>

        {/* Breakdown statistics */}
        <div className="grid grid-cols-3 gap-3 py-2 text-center text-xs">
          <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
            <span className="text-emerald-400 font-bold block">{exactCount}</span>
            <span className="text-[9px] uppercase tracking-wider text-outline block mt-0.5">Exact Matches</span>
          </div>
          <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl">
            <span className="text-amber-400 font-bold block">{similarCount}</span>
            <span className="text-[9px] uppercase tracking-wider text-outline block mt-0.5">Similar Matches</span>
          </div>
          <div className="p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
            <span className="text-blue-400 font-bold block">{newCount}</span>
            <span className="text-[9px] uppercase tracking-wider text-outline block mt-0.5">New Products</span>
          </div>
        </div>

        {/* Stock Increase */}
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <span className="text-secondary text-xs">Estimated Stock Increase:</span>
          <span className="font-bold text-on-surface text-sm">+{estimatedStockIncrease} Units</span>
        </div>

        {/* Cost estimate */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-secondary text-xs font-bold uppercase tracking-wider">Estimated Total Cost:</span>
          <span className="text-xl font-headline font-bold text-primary">{formatINR(estimatedCost)}</span>
        </div>
      </div>
    </div>
  );
}
