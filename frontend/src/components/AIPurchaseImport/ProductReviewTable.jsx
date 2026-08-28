import React from "react";
import { formatINR } from "../../utils/currency";

export default function ProductReviewTable({ products = [], confidence }) {
  const isProductsLow = confidence && confidence.products < 90;
  const isPricesLow = confidence && confidence.prices < 90;

  const getStatusBadge = (status) => {
    switch (status) {
      case "existing":
        return (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
            Existing
          </span>
        );
      case "new":
        return (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded">
            New
          </span>
        );
      case "missing":
      default:
        return (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded">
            Missing
          </span>
        );
    }
  };

  return (
    <div className={`transition-all duration-300 rounded-2xl p-5 space-y-4 ${
      isProductsLow || isPricesLow 
        ? "bg-amber-950/5 border border-amber-500/20"
        : "bg-[#121212] border border-[#4d4635]/15"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Extracted Products</h4>
        {(isProductsLow || isPricesLow) && (
          <span className="text-[9px] uppercase tracking-wider bg-amber-500 text-black px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 shrink-0 animate-pulse">
            <span className="material-symbols-outlined text-[10px]">warning</span>
            Verify highlighted values
          </span>
        )}
      </div>
      
      {/* Desktop/Tablet Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#4d4635]/20 text-[10px] uppercase tracking-wider text-outline font-semibold">
              <th className="pb-3 pl-2">Product Name</th>
              <th className="pb-3">SKU / Barcode</th>
              <th className="pb-3 text-center">Qty</th>
              <th className="pb-3 text-right">Purchase Price</th>
              <th className="pb-3 text-right">Selling / MRP</th>
              <th className="pb-3 pr-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#4d4635]/10 text-xs">
            {products.map((prod) => (
              <tr key={prod._id} className="hover:bg-white/[0.01] transition-colors">
                {/* Product Name (Highlighted if products confidence is low) */}
                <td className={`py-3 pl-2 font-medium ${isProductsLow ? "bg-amber-500/[0.04] text-amber-300" : "text-on-surface"}`}>
                  <div className="font-semibold">{prod.name}</div>
                  {(prod.brand || prod.category) && (
                    <div className="text-[10px] text-outline mt-0.5 flex gap-2">
                      {prod.brand && <span>Brand: {prod.brand}</span>}
                      {prod.category && <span>Category: {prod.category}</span>}
                    </div>
                  )}
                </td>

                {/* SKU / Barcode */}
                <td className="py-3 text-outline font-mono">
                  {prod.sku && <div>SKU: {prod.sku}</div>}
                  {prod.barcode && <div>BC: {prod.barcode}</div>}
                  {!prod.sku && !prod.barcode && <span className="text-[10px] italic">None</span>}
                </td>

                {/* Qty */}
                <td className="py-3 text-center font-semibold text-on-surface">{prod.quantity}</td>

                {/* Purchase Price */}
                <td className={`py-3 text-right font-medium ${isPricesLow ? "bg-amber-500/[0.04] text-amber-300" : "text-on-surface"}`}>
                  {formatINR(prod.purchasePrice)}
                </td>

                {/* Selling Price / MRP */}
                <td className={`py-3 text-right font-semibold ${isPricesLow ? "bg-amber-500/[0.04] text-amber-300" : ""}`}>
                  <div className={prod.sellingPrice > 0 ? "text-primary" : "text-amber-500/80"}>
                    {prod.sellingPrice > 0 ? formatINR(prod.sellingPrice) : "Required"}
                  </div>
                  {prod.mrp > 0 && (
                    <div className="text-[10px] text-outline mt-0.5">MRP: {formatINR(prod.mrp)}</div>
                  )}
                </td>

                {/* Status */}
                <td className="py-3 pr-2 text-right">{getStatusBadge(prod.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="block md:hidden space-y-3">
        {products.map((prod) => (
          <div key={prod._id} className={`p-4 rounded-xl space-y-3 border ${
            isProductsLow || isPricesLow 
              ? "bg-amber-950/5 border-amber-500/20" 
              : "bg-black/20 border-[#4d4635]/10"
          }`}>
            <div className="flex justify-between items-start gap-2">
              <div className={`${isProductsLow ? "text-amber-300 font-bold" : "text-on-surface font-semibold"} text-sm leading-snug`}>
                <div>{prod.name}</div>
                {(prod.brand || prod.category) && (
                  <div className="text-[9px] text-outline mt-0.5 flex gap-1.5 font-normal">
                    {prod.brand && <span>{prod.brand}</span>}
                    {prod.brand && prod.category && <span>•</span>}
                    {prod.category && <span>{prod.category}</span>}
                  </div>
                )}
              </div>
              <div className="shrink-0">{getStatusBadge(prod.status)}</div>
            </div>

            {(prod.sku || prod.barcode) && (
              <div className="text-[10px] text-outline font-mono flex gap-3">
                {prod.sku && <span>SKU: {prod.sku}</span>}
                {prod.barcode && <span>BC: {prod.barcode}</span>}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/5 text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-outline block">Quantity</span>
                <span className="font-semibold text-on-surface mt-0.5 block">{prod.quantity} units</span>
              </div>
              <div className={isPricesLow ? "text-amber-300" : ""}>
                <span className="text-[9px] uppercase tracking-wider text-outline block">Purchase</span>
                <span className="font-medium mt-0.5 block">{formatINR(prod.purchasePrice)}</span>
              </div>
              <div className={`text-right ${isPricesLow ? "text-amber-300" : ""}`}>
                <span className="text-[9px] uppercase tracking-wider text-outline block">Selling / MRP</span>
                <span className={`font-semibold mt-0.5 block ${prod.sellingPrice > 0 ? "text-primary" : "text-amber-500/80"}`}>
                  {prod.sellingPrice > 0 ? formatINR(prod.sellingPrice) : "Required"}
                </span>
                {prod.mrp > 0 && (
                  <span className="text-[9px] text-outline mt-0.5 block">MRP: {formatINR(prod.mrp)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
