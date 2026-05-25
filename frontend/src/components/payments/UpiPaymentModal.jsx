import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { formatINR } from "../../utils/currency";

const DEFAULT_UPI_ID = import.meta.env.VITE_UPI_ID || "paytm.s23u1ph@pty";
const DEFAULT_UPI_NAME = "Baloch Imrankhan";
const DEFAULT_UPI_PHONE = "9978922880";

function formatAmount(amount) {
  return Number(amount || 0).toFixed(2);
}

function buildUpiUri({ amount, note }) {
  const encodedName = encodeURIComponent("Malaabis Studio");
  const encodedNote = encodeURIComponent(note || "Malaabis Studio payment");
  return `upi://pay?pa=${encodeURIComponent(DEFAULT_UPI_ID)}&pn=${encodedName}&am=${formatAmount(amount)}&cu=INR&tn=${encodedNote}`;
}

export default function UpiPaymentModal({ open, amount, onClose, onPaymentConfirmed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const upiUri = useMemo(
    () =>
      buildUpiUri({
        amount,
        note: `Malaabis Studio invoice payment ${formatAmount(amount)}`,
      }),
    [amount]
  );

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError("");
      setSuccess(false);
    }
  }, [open]);

  const handlePaymentSuccess = () => {
    setSuccess(true);
    window.setTimeout(() => {
      onPaymentConfirmed?.();
      onClose?.();
    }, 1100);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-[#050505] text-white flex flex-col animate-modal-pop">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10 bg-black/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Malaabis Studio"
            className="h-8 w-auto object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-secondary">
              UPI Payment
            </p>
            <h2 className="text-base font-semibold">Scan to Pay</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
          aria-label="Close UPI modal"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-safe">
        <div className="max-w-2xl mx-auto w-full">
          <div className="rounded-[32px] overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(242,202,80,0.12),_transparent_45%),linear-gradient(180deg,#111111,#050505)] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
            <div className="p-5 sm:p-6 border-b border-white/10 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary">
                  Malaabis Studio
                </p>
                <h3 className="text-2xl sm:text-3xl font-headline text-white mt-2">
                  UPI Payment
                </h3>
                <p className="text-sm text-secondary mt-2 max-w-xl">
                  Scan the Paytm QR below or use any UPI app.
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[10px] uppercase tracking-[0.24em] text-secondary">Amount</span>
                <span className="text-2xl font-semibold text-primary mt-2">
                  {formatINR(amount)}
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
                {/* Left: QR codes */}
                <div className="space-y-4 order-2 lg:order-1">
                  {/* Static Paytm QR */}
                  <div className="rounded-[28px] border border-white/10 bg-white p-4 sm:p-5 text-black overflow-hidden">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-[#444]">
                          Merchant
                        </p>
                        <h4 className="text-lg font-semibold mt-1">Malaabis Studio</h4>
                        <p className="text-xs text-[#555] mt-0.5">{DEFAULT_UPI_NAME}</p>
                        <p className="text-xs text-[#555]">📞 {DEFAULT_UPI_PHONE}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-[#444]">Amount</p>
                        <p className="text-lg font-bold mt-1 text-[#d4af37]">
                          {formatINR(amount)}
                        </p>
                      </div>
                    </div>

                    {/* Paytm Static QR */}
                    <div className="relative rounded-[22px] bg-[#f7f7f7] border border-black/5 p-3 sm:p-4 overflow-hidden">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[#ffe88a] to-primary" />
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src="/paytm-qr.png"
                          alt="Paytm UPI QR Code — Scan to pay Malaabis Studio"
                          className="w-full max-w-[280px] aspect-square rounded-[18px] object-contain shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div className="w-full text-center">
                          <p className="text-[11px] font-semibold text-[#333] tracking-wide">
                            UPI ID: {DEFAULT_UPI_ID}
                          </p>
                          <p className="text-[10px] text-[#666] mt-1">
                            Accepts: Paytm • PhonePe • GPay • BHIM • All UPI Apps
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info row */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-secondary">Business</p>
                      <p className="text-white font-medium mt-2">Malaabis Studio</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-secondary">Invoice amount</p>
                      <p className="text-primary font-semibold mt-2">{formatINR(amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Action panel */}
                <div className="order-1 lg:order-2 space-y-4">
                  <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 sm:p-6">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-secondary">
                      Payment steps
                    </p>
                    <h4 className="text-xl font-semibold mt-3">How to pay</h4>
                    <ul className="space-y-3 mt-5 text-sm text-secondary">
                      <li className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[18px]">qr_code_2</span>
                        Open any UPI app & scan QR
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[18px]">payments</span>
                        Enter amount: {formatINR(amount)}
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
                        Complete payment & confirm below
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-[28px] border border-primary/20 bg-primary/10 p-5 sm:p-6">
                    {!success ? (
                      <>
                        <p className="text-[10px] uppercase tracking-[0.28em] text-primary">
                          After payment
                        </p>
                        <h5 className="text-lg font-semibold text-white mt-2">
                          Mark as received
                        </h5>
                        <p className="text-sm text-secondary mt-2">
                          Tap only after the customer completes the UPI transfer.
                        </p>
                        <button
                          type="button"
                          id="upi-payment-received-btn"
                          onClick={handlePaymentSuccess}
                          className="mt-5 w-full min-h-[50px] rounded-xl bg-primary text-black font-semibold uppercase tracking-wider hover:bg-[#ffe088] transition-colors cursor-pointer"
                        >
                          Payment Received ✓
                        </button>
                      </>
                    ) : (
                      <div className="min-h-[180px] flex flex-col items-center justify-center text-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center animate-pulse">
                          <span className="material-symbols-outlined text-primary text-3xl">
                            check_circle
                          </span>
                        </div>
                        <h5 className="text-xl font-semibold text-white">Payment successful!</h5>
                        <p className="text-sm text-secondary">
                          Saving invoice…
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.24em] text-secondary border-t border-white/10 pt-4">
              <span>Malaabis Studio</span>
              <span>Amount: {formatINR(amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}