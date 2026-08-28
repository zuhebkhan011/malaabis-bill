import React, { useState } from "react";
import { formatINR } from "../../utils/currency";

/**
 * PriceOverrideModal
 * Allows temporary custom price for a cart item (current bill only).
 * Does NOT modify the product database price.
 */
export default function PriceOverrideModal({ open, item, onSave, onClose }) {
  const [customPrice, setCustomPrice] = useState(
    item?.customPrice ?? item?.originalPrice ?? item?.price ?? ""
  );
  const [reason, setReason] = useState(item?.priceReason || "");
  const [error, setError] = useState("");

  // Reset when item changes
  React.useEffect(() => {
    if (open && item) {
      setCustomPrice(item.customPrice ?? item.originalPrice ?? item.price ?? "");
      setReason(item.priceReason || "");
      setError("");
    }
  }, [open, item]);

  if (!open || !item) return null;

  const originalPrice = item.originalPrice ?? item.price ?? 0;

  const handleSave = () => {
    const parsed = Number(customPrice);
    if (!customPrice || isNaN(parsed) || parsed < 0) {
      setError("Please enter a valid price (₹0 or more).");
      return;
    }
    onSave({ customPrice: parsed, priceReason: reason });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-modal-pop">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#4d4635]/30 bg-[#111111] shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Gold accent top line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        {/* Header */}
        <div className="p-5 border-b border-white/8 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-secondary">
              Price Override
            </p>
            <h2 className="text-xl font-headline text-primary mt-1">
              Custom Pricing
            </h2>
            <p className="text-xs text-outline mt-1 max-w-xs truncate">
              {item.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-secondary hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Original Price (read-only) */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
            <p className="text-[10px] uppercase tracking-[0.28em] text-secondary mb-2">
              Original Database Price
            </p>
            <p className="text-2xl font-headline text-outline line-through">
              {formatINR(originalPrice)}
            </p>
            <p className="text-[10px] text-outline mt-1">
              This price remains unchanged in the database.
            </p>
          </div>

          {/* Custom Price Input */}
          <div className="relative group">
            <label className="absolute -top-2 left-3 bg-[#111111] px-1 text-[9px] font-semibold tracking-wider text-outline uppercase group-focus-within:text-primary transition-colors z-10">
              Custom Price for This Bill
            </label>
            <div className="flex items-center">
              <span className="absolute left-4 text-primary font-bold text-lg select-none pointer-events-none">
                ₹
              </span>
              <input
                id="custom-price-input"
                className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-xl pl-9 pr-4 py-3.5 text-on-surface text-lg font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                placeholder="0"
                type="number"
                min="0"
                step="1"
                value={customPrice}
                onChange={(e) => {
                  setCustomPrice(e.target.value);
                  setError("");
                }}
                autoFocus
              />
            </div>
            {customPrice && Number(customPrice) !== originalPrice && (
              <p className="text-[10px] text-primary mt-1.5 ml-1">
                Difference:{" "}
                {Number(customPrice) < originalPrice
                  ? `−${formatINR(originalPrice - Number(customPrice))} discount`
                  : `+${formatINR(Number(customPrice) - originalPrice)} markup`}
              </p>
            )}
          </div>

          {/* Reason (optional) */}
          <div className="relative group">
            <label className="absolute -top-2 left-3 bg-[#111111] px-1 text-[9px] font-semibold tracking-wider text-outline uppercase group-focus-within:text-primary transition-colors z-10">
              Reason (Optional)
            </label>
            <input
              className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-xl px-4 py-3.5 text-on-surface text-sm focus:outline-none focus:border-primary transition-all"
              placeholder="e.g. Customer bargain, damaged item…"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl border border-white/10 text-secondary text-xs uppercase tracking-wider font-semibold hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-[48px] rounded-xl bg-primary text-black text-xs uppercase tracking-wider font-semibold hover:bg-[#ffe088] transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] cursor-pointer active:scale-[0.98]"
          >
            Apply Price
          </button>
        </div>
      </div>
    </div>
  );
}
