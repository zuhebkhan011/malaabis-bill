import React from "react";
import { formatINR } from "../../utils/currency";
import MatchStatusBadge from "./MatchStatusBadge";

export default function MatchReviewTable({ products = [], onUpdateProduct, onEditProduct }) {
  // Check duplicates in invoice list
  const getValidationWarnings = (p, idx) => {
    const warnings = [];
    
    if (p.quantity < 0) {
      warnings.push("Negative Quantity Detected");
    }
    
    if (p.barcode) {
      const dupBarcode = products.some((o, oIdx) => o.barcode === p.barcode && oIdx !== idx);
      if (dupBarcode) {
        warnings.push("Duplicate Barcode Found");
      }
    }
    
    if (p.sku) {
      const dupSku = products.some((o, oIdx) => o.sku === p.sku && oIdx !== idx);
      if (dupSku) {
        warnings.push("Duplicate SKU Found");
      }
    }
    
    return warnings;
  };

  const isPriceInvalid = (p) => {
    return p.purchasePrice <= 0 || (p.sellingPrice > 0 && p.sellingPrice < p.purchasePrice);
  };

  const handleSimilarResponse = (idx, response) => {
    const p = products[idx];
    if (response === "yes") {
      onUpdateProduct(idx, { matchStatus: "exact" });
    } else {
      onUpdateProduct(idx, {
        matchStatus: "new",
        matchedProductId: null,
        matchedProductName: null,
        currentStock: 0,
      });
    }
  };

  return (
    <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Intelligent Match Review</h4>
      
      {/* Desktop View Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#4d4635]/20 text-[10px] uppercase tracking-wider text-outline font-semibold">
              <th className="pb-3 pl-2">Product Name</th>
              <th className="pb-3 text-center">Inv Qty</th>
              <th className="pb-3 text-center">Stock</th>
              <th className="pb-3 text-right">Purchase Price</th>
              <th className="pb-3 text-right">Selling Price</th>
              <th className="pb-3 text-center">Status</th>
              <th className="pb-3 pr-2 text-right">Action / Choice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4d4635]/10 text-xs">
            {products.map((p, idx) => {
              const warnings = getValidationWarnings(p, idx);
              const priceErr = isPriceInvalid(p);
              const hasAlert = warnings.length > 0 || priceErr;

              return (
                <tr 
                  key={p._id || idx} 
                  className={`transition-colors hover:bg-white/[0.01] ${hasAlert ? "bg-red-500/[0.02]" : ""}`}
                >
                  {/* Name and Matched info */}
                  <td className="py-3.5 pl-2 font-medium">
                    <div className="text-on-surface font-semibold">{p.name}</div>
                    {p.matchedProductName && p.matchStatus === "exact" && (
                      <div className="text-[10px] text-emerald-400 mt-0.5">
                        Matched: {p.matchedProductName}
                      </div>
                    )}
                    {p.matchedProductName && p.matchStatus === "similar" && (
                      <div className="text-[10px] text-amber-400 mt-0.5">
                        Suggested: {p.matchedProductName}
                      </div>
                    )}
                    {p.priceAnalysis && p.priceAnalysis.alertType !== "normal" && (
                      <div className={`text-[10px] font-bold mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                        p.priceAnalysis.alertType === "abnormal" 
                          ? "bg-red-500/10 text-red-400 border-red-500/20" 
                          : p.priceAnalysis.alertType === "increase"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        <span className="material-symbols-outlined text-[10px]">
                          {p.priceAnalysis.alertType === "decrease" ? "trending_down" : "trending_up"}
                        </span>
                        {p.priceAnalysis.message}
                      </div>
                    )}
                    {warnings.map((w, wIdx) => (
                      <span key={wIdx} className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-400 mt-1 mr-2 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                        <span className="material-symbols-outlined text-[10px]">warning</span>
                        {w}
                      </span>
                    ))}
                  </td>

                  {/* Quantity */}
                  <td className={`py-3.5 text-center font-bold ${p.quantity < 0 ? "text-red-400" : "text-on-surface"}`}>
                    {p.quantity}
                  </td>

                  {/* Current Stock -> Future Stock */}
                  <td className="py-3.5 text-center text-outline">
                    {p.matchStatus === "exact" ? (
                      <div className="flex flex-col items-center">
                        <span className="text-on-surface font-medium">{p.currentStock}</span>
                        <span className="text-[9px] text-emerald-400 mt-0.5">➔ {Number(p.currentStock) + Number(p.quantity)}</span>
                      </div>
                    ) : (
                      <span className="italic">—</span>
                    )}
                  </td>

                  {/* Purchase Price */}
                  <td className={`py-3.5 text-right font-medium ${priceErr ? "text-red-400 bg-red-500/5 font-bold" : "text-on-surface"}`}>
                    {formatINR(p.purchasePrice)}
                  </td>

                  {/* Selling Price */}
                  <td className={`py-3.5 text-right font-semibold ${priceErr ? "text-red-400 bg-red-500/5 font-bold" : "text-primary"}`}>
                    {p.sellingPrice > 0 ? formatINR(p.sellingPrice) : <span className="text-amber-500/80 italic">Required</span>}
                    {p.mrp > 0 && <div className="text-[9px] text-outline font-normal mt-0.5">MRP: {formatINR(p.mrp)}</div>}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 text-center">
                    <MatchStatusBadge status={p.matchStatus} />
                  </td>

                  {/* Actions / Buttons */}
                  <td className="py-3.5 pr-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {p.matchStatus === "similar" ? (
                        <div className="flex items-center gap-1.5 bg-amber-500/5 p-1 rounded-lg border border-amber-500/10">
                          <span className="text-[9px] uppercase tracking-wider text-amber-400 font-bold px-1 block">Use suggestion?</span>
                          <button
                            onClick={() => handleSimilarResponse(idx, "yes")}
                            className="bg-emerald-500 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase hover:bg-emerald-400 cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleSimilarResponse(idx, "no")}
                            className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase hover:bg-red-500/35 cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : p.matchStatus === "exact" ? (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Update Stock</span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Create New</span>
                      )}

                      {/* Edit Details Trigger */}
                      <button
                        onClick={() => onEditProduct(p, idx)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-outline hover:text-on-surface hover:bg-white/10 transition-colors cursor-pointer"
                        title="Edit Match Details"
                      >
                        <span className="material-symbols-outlined text-base">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List layout */}
      <div className="block lg:hidden space-y-4">
        {products.map((p, idx) => {
          const warnings = getValidationWarnings(p, idx);
          const priceErr = isPriceInvalid(p);
          const hasAlert = warnings.length > 0 || priceErr;

          return (
            <div 
              key={p._id || idx} 
              className={`p-4 rounded-xl border space-y-3 relative ${
                hasAlert 
                  ? "bg-red-950/5 border-red-500/20" 
                  : p.matchStatus === "similar"
                    ? "bg-amber-950/5 border-amber-500/20"
                    : "bg-black/20 border-[#4d4635]/15"
              }`}
            >
              {/* Header Info */}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h5 className="text-sm font-semibold text-on-surface leading-snug">{p.name}</h5>
                  {p.matchedProductName && (
                    <p className={`text-[10px] mt-0.5 ${p.matchStatus === "exact" ? "text-emerald-400" : "text-amber-400"}`}>
                      {p.matchStatus === "exact" ? "Matched" : "Suggested"}: {p.matchedProductName}
                    </p>
                  )}
                  {p.priceAnalysis && p.priceAnalysis.alertType !== "normal" && (
                    <div className={`text-[9px] font-bold mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                      p.priceAnalysis.alertType === "abnormal" 
                        ? "bg-red-500/10 text-red-400 border-red-500/20" 
                        : p.priceAnalysis.alertType === "increase"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      <span className="material-symbols-outlined text-[9px]">
                        {p.priceAnalysis.alertType === "decrease" ? "trending_down" : "trending_up"}
                      </span>
                      {p.priceAnalysis.message}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <MatchStatusBadge status={p.matchStatus} />
                </div>
              </div>

              {/* Warnings List */}
              {warnings.map((w, wIdx) => (
                <div key={wIdx} className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 w-fit">
                  <span className="material-symbols-outlined text-[10px]">warning</span>
                  {w}
                </div>
              ))}

              {/* Data parameters */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-outline block">Invoice Qty</span>
                  <span className={`font-semibold mt-0.5 block ${p.quantity < 0 ? "text-red-400" : "text-on-surface"}`}>
                    {p.quantity} units
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-outline block">Stock after</span>
                  <span className="font-semibold text-on-surface mt-0.5 block">
                    {p.matchStatus === "exact" ? `${p.currentStock} ➔ ${Number(p.currentStock) + Number(p.quantity)}` : "—"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-outline block">Prices (P / S)</span>
                  <span className={`font-semibold mt-0.5 block ${priceErr ? "text-red-400" : ""}`}>
                    {formatINR(p.purchasePrice)} / {p.sellingPrice > 0 ? formatINR(p.sellingPrice) : "Req"}
                  </span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <div>
                  {p.matchStatus === "similar" ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-outline font-bold uppercase">Use suggestion?</span>
                      <button
                        onClick={() => handleSimilarResponse(idx, "yes")}
                        className="bg-emerald-500 text-black px-2.5 py-0.5 rounded text-[10px] font-black uppercase cursor-pointer"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleSimilarResponse(idx, "no")}
                        className="bg-red-500/20 text-red-400 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : p.matchStatus === "exact" ? (
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Update Stock</span>
                  ) : (
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Create New Product</span>
                  )}
                </div>

                <button
                  onClick={() => onEditProduct(p, idx)}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-outline hover:text-on-surface hover:bg-white/10 cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">edit</span>
                  Edit details
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
