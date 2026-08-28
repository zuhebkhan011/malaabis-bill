import React from "react";

export default function ConfidenceBadge({ confidence }) {
  if (!confidence) return null;

  const renderBadge = (label, score) => {
    const isLow = score < 90;
    const colorClass = isLow
      ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
      : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";

    return (
      <div className={`p-4 rounded-xl bg-[#121212] border ${isLow ? "border-amber-500/30 shadow-md shadow-amber-500/5 animate-pulse" : "border-[#4d4635]/15"} flex items-center justify-between gap-4`}>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-outline block">{label} Confidence</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-lg font-bold ${isLow ? "text-amber-400 font-extrabold" : "text-emerald-400 font-bold"}`}>{score}%</span>
            {isLow && (
              <span className="text-[9px] uppercase tracking-wider bg-amber-500 text-black px-1.5 py-0.5 rounded font-black flex items-center gap-0.5 shrink-0">
                <span className="material-symbols-outlined text-[10px]">warning</span>
                Please Verify
              </span>
            )}
          </div>
        </div>
        <span className={`material-symbols-outlined text-2xl ${isLow ? "text-amber-400" : "text-emerald-400"}`}>
          {isLow ? "rule" : "verified"}
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#0e0e0e]/40 p-4 rounded-2xl border border-[#4d4635]/15">
      {renderBadge("Supplier Details", confidence.supplier)}
      {renderBadge("Product Lines", confidence.products)}
      {renderBadge("Pricing & Totals", confidence.prices)}
    </div>
  );
}
