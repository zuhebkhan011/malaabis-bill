import React, { useEffect, useMemo, useState } from "react";
import { createBill } from "../services/billingApi";
import { queueBill } from "../services/offlineService";
import BarcodeScanner from "../components/barcode/BarcodeScanner";
import UpiPaymentModal from "../components/payments/UpiPaymentModal";
import InvoicePreviewModal from "../components/invoice/InvoicePreviewModal";

const PAYMENT_METHODS = ["CASH", "UPI", "CARD"];

export default function NewBill({ products = [], onCheckout }) {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [discountMode, setDiscountMode] = useState("NONE");
  const [discountValue, setDiscountValue] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState("");
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiPaid, setUpiPaid] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);

  useEffect(() => {
    if (paymentMethod === "UPI") {
      setIsUpiModalOpen(true);
      setUpiPaid(false);
    } else {
      setIsUpiModalOpen(false);
      setUpiPaid(false);
    }
  }, [paymentMethod]);

  // Search filter
  const searchResults = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const addToCart = (product) => {
    const existing = cart.find((item) => item._id === product._id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert("Cannot add more. Insufficient stock!");
        return;
      }
      setCart(
        cart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (product.stock <= 0) {
        alert("Product is out of stock!");
        return;
      }
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setSearchQuery("");
  };

  const handleBarcodeScan = (barcode) => {
    const normalizedBarcode = String(barcode || "").trim().toUpperCase();
    const matchedProduct = products.find((product) => String(product.sku || "").trim().toUpperCase() === normalizedBarcode);

    if (!matchedProduct) {
      setScanFeedback(`No product found for ${normalizedBarcode}`);
      return;
    }

    addToCart(matchedProduct);
    setScanFeedback(`Added ${matchedProduct.name} to cart`);
  };

  const updateQuantity = (id, delta) => {
    const item = cart.find((i) => i._id === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((i) => i._id !== id));
      return;
    }

    const originalProduct = products.find((p) => p._id === id);
    if (originalProduct && newQty > originalProduct.stock) {
      alert("Insufficient stock!");
      return;
    }

    setCart(cart.map((i) => (i._id === id ? { ...i, quantity: newQty } : i)));
  };

  const subtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cart]
  );
  const gstRate = 0.17;
  const gstTax = Math.round(subtotal * gstRate);

  const normalizedDiscountValue = Number(discountValue) || 0;
  const promoDiscount = discountCode.toUpperCase() === "MALAABIS10" ? Math.round(subtotal * 0.1) : 0;
  const manualDiscount =
    discountMode === "PERCENT"
      ? Math.round(subtotal * (normalizedDiscountValue / 100))
      : discountMode === "FLAT"
      ? Math.min(normalizedDiscountValue, subtotal)
      : 0;
  const discountAmount = Math.min(subtotal, manualDiscount + promoDiscount);
  const total = Math.max(0, subtotal + gstTax - discountAmount);
  const cashReceivedAmount = Number(cashReceived) || 0;
  const cashChange = paymentMethod === "CASH" ? Math.max(0, cashReceivedAmount - total) : 0;
  const isPaymentReady = paymentMethod !== "UPI" || upiPaid;

  const handleCreateInvoice = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    if (paymentMethod === "UPI" && !upiPaid) {
      setSubmitError("Complete the UPI payment first.");
      setIsUpiModalOpen(true);
      return;
    }
    if (paymentMethod === "CASH" && cashReceivedAmount < total) {
      alert("Cash received must be greater than or equal to the grand total.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const billPayload = {
        customerName: customerName || "Walk-in Customer",
        customerMobile: customerMobile || "N/A",
        items: cart.map((item) => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku,
        })),
        subtotal,
        gstRate,
        gstAmount: gstTax,
        discountType: discountCode.toUpperCase() === "MALAABIS10" ? "percent" : discountMode === "FLAT" ? "flat" : discountMode === "PERCENT" ? "percent" : "none",
        discountValue: discountCode.toUpperCase() === "MALAABIS10" ? 10 : normalizedDiscountValue,
        discountAmount,
        total,
        paymentMethod,
        cashReceived: paymentMethod === "CASH" ? cashReceivedAmount : 0,
        cashChange,
      };

      let savedBill = null;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        // Offline: queue bill and create a provisional local invoice object
        const queued = await queueBill(billPayload);
        savedBill = { ...billPayload, _id: queued.id, invoiceNumber: `LOCAL-${queued.id}`, createdAt: new Date().toISOString(), offline: true };
        await onCheckout?.(savedBill);
      } else {
        savedBill = await createBill(billPayload);
        await onCheckout?.(savedBill);
      }
      setSavedInvoice(savedBill);
      setIsInvoicePreviewOpen(true);

      setCart([]);
      setCustomerName("");
      setCustomerMobile("");
      setPaymentMethod("CASH");
      setCashReceived("");
      setDiscountMode("NONE");
      setDiscountValue("");
      setDiscountCode("");
      setIsScannerOpen(false);
      setIsUpiModalOpen(false);
    } catch (error) {
      setSubmitError(error.message || "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareInvoiceOnWhatsApp = () => {
    if (!savedInvoice) {
      return;
    }

    const digitsOnly = String(savedInvoice.customerMobile || customerMobile || "").replace(/\D/g, "");
    const normalizedWhatsAppNumber = digitsOnly.startsWith("0") && digitsOnly.length === 11 ? `92${digitsOnly.slice(1)}` : digitsOnly;

    const itemLines = (savedInvoice.items || [])
      .map((item) => `- ${item.quantity} x ${item.name}`)
      .join("\n");

    const message = [
      `Malaabis Studio Invoice #${savedInvoice.invoiceNumber || "N/A"}`,
      `Customer: ${savedInvoice.customerName || "Walk-in Customer"}`,
      `\nItems:\n${itemLines}`,
      `\nSubtotal: PKR ${Number(savedInvoice.subtotal || 0).toLocaleString()}`,
      `GST: PKR ${Number(savedInvoice.gstAmount || 0).toLocaleString()}`,
      Number(savedInvoice.discountAmount || 0) > 0 ? `Discount: - PKR ${Number(savedInvoice.discountAmount || 0).toLocaleString()}` : null,
      `Grand Total: PKR ${Number(savedInvoice.total || 0).toLocaleString()}`,
      `Payment Method: ${savedInvoice.paymentMethod || "CASH"}`,
      `Thank you for shopping with Malaabis Studio.`,
    ]
      .filter(Boolean)
      .join("\n");

    const waUrl = normalizedWhatsAppNumber
      ? `https://wa.me/${normalizedWhatsAppNumber}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-140px)] md:min-h-[calc(100vh-80px)] -mx-container-margin md:mx-0 overflow-hidden animate-fade-in pb-24 md:pb-0">
      {/* Left Side: POS Cart & Search */}
      <section className="flex-1 flex flex-col h-full bg-[#131313] border-r border-[#4d4635]/10 overflow-hidden p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="font-headline text-2xl text-on-background">New Sale</h1>
          </div>

          {/* Customer Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative group">
              <label className="absolute -top-2 left-3 bg-[#131313] px-1 text-[9px] font-semibold tracking-wider text-outline uppercase group-focus-within:text-primary transition-colors">
                Customer Name
              </label>
              <input
                className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary text-sm h-11"
                placeholder="Walk-in Customer"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="relative group">
              <label className="absolute -top-2 left-3 bg-[#131313] px-1 text-[9px] font-semibold tracking-wider text-outline uppercase group-focus-within:text-primary transition-colors">
                Mobile Number
              </label>
              <input
                className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary text-sm h-11"
                placeholder="e.g. 03001234567"
                type="tel"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
              />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
              search
            </span>
            <input
              className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-xl pl-12 pr-24 py-3.5 focus:outline-none focus:border-primary placeholder:text-secondary font-body text-sm"
              placeholder="Search products by name or SKU..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-outline-variant hover:text-on-surface w-9 h-9 flex items-center justify-center"
                  aria-label="Clear search"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                aria-label="Open barcode scanner"
              >
                <span className="material-symbols-outlined text-[20px]">barcode_scanner</span>
              </button>
            </div>

            {/* Floating Search Results Dropdown */}
            {searchQuery && (
              <div className="absolute left-0 right-0 top-[52px] bg-[#121212] border border-[#4d4635]/30 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-[#4d4635]/15">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-secondary">No products found</div>
                ) : (
                  searchResults.map((product) => (
                    <div
                      key={product._id}
                      onClick={() => addToCart(product)}
                      className="p-3 flex items-center justify-between hover:bg-[#1C1C1C] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-surface-container"
                        />
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{product.name}</p>
                          <p className="text-[10px] text-outline tracking-wider uppercase font-semibold">
                            SKU: {product.sku} • Stock: {product.stock}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">PKR {product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cart Item list */}
        <div className="flex-1 overflow-y-auto mt-6 space-y-4 pr-1">
          {scanFeedback ? (
            <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary mb-2">
              {scanFeedback}
            </div>
          ) : null}

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-secondary opacity-60 border border-dashed border-[#4d4635]/25 rounded-2xl p-8">
              <span className="material-symbols-outlined text-4xl mb-2">shopping_bag</span>
              <p className="text-sm font-medium">Your sales cart is empty</p>
              <p className="text-xs text-outline mt-1 text-center">Search for items in the catalog to add them.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item._id}
                className="bg-[#121212] rounded-xl p-4 flex items-center gap-4 border border-[#4d4635]/10 hover:border-primary/10 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-lg bg-surface-variant overflow-hidden shrink-0 border border-[#4d4635]/10">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-on-background truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[8px] uppercase font-bold bg-black border border-[#4d4635]/20 text-secondary">
                      {item.category || "UNSTITCHED"}
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider text-outline uppercase">
                      SKU: {item.sku}
                    </span>
                  </div>
                </div>
                {/* Quantity adjustments */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => updateQuantity(item._id, -1)}
                    className="w-8 h-8 rounded-full border border-[#4d4635]/30 text-secondary flex items-center justify-center hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, 1)}
                    className="w-8 h-8 rounded-full border border-[#4d4635]/30 text-secondary flex items-center justify-center hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                {/* Total price for product */}
                <div className="text-right w-24 shrink-0">
                  <p className="text-sm font-semibold text-on-background">
                    PKR {(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <BarcodeScanner
        open={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleBarcodeScan}
      />

      {/* Right Side: Order Summary Panel */}
      <section className="w-full lg:w-[380px] bg-[#121212] flex flex-col h-full shrink-0 shadow-[-8px_0_24px_rgba(0,0,0,0.5)] border-t lg:border-t-0 lg:border-l border-[#4d4635]/15 p-4 md:p-6 pb-24 lg:pb-6 overflow-y-auto">
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h2 className="font-headline text-2xl text-on-background mb-8">Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-secondary text-sm">
                <span>Subtotal</span>
                <span className="text-on-background font-medium">PKR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-secondary text-sm">
                <span>GST (17%)</span>
                <span className="text-on-background font-medium">PKR {gstTax.toLocaleString()}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-primary text-sm font-medium">
                  <span>Discount</span>
                  <span>- PKR {discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-4 border-t border-[#4d4635]/20">
                <label className="text-[10px] font-semibold tracking-wider text-outline uppercase mb-2 block">
                  Discount Type
                </label>
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setDiscountMode("NONE")} className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border ${discountMode === "NONE" ? "bg-primary text-black border-primary" : "border-[#4d4635]/35 text-secondary"}`}>
                    None
                  </button>
                  <button type="button" onClick={() => setDiscountMode("FLAT")} className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border ${discountMode === "FLAT" ? "bg-primary text-black border-primary" : "border-[#4d4635]/35 text-secondary"}`}>
                    Flat
                  </button>
                  <button type="button" onClick={() => setDiscountMode("PERCENT")} className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border ${discountMode === "PERCENT" ? "bg-primary text-black border-primary" : "border-[#4d4635]/35 text-secondary"}`}>
                    %
                  </button>
                </div>

                {discountMode !== "NONE" && (
                  <input
                    className="w-full bg-background text-on-background border border-[#4d4635]/35 rounded-lg px-3 py-2 focus:border-primary placeholder:text-[#353535] text-sm focus:outline-none mb-3"
                    placeholder={discountMode === "PERCENT" ? "Enter discount percent" : "Enter discount amount"}
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                )}

                <label className="text-[10px] font-semibold tracking-wider text-outline uppercase mb-2 block">
                  Promo Code
                </label>
                <div className="relative flex gap-2">
                  <input
                    className="flex-1 bg-background text-on-background border border-[#4d4635]/35 rounded-lg px-3 py-2 focus:border-primary placeholder:text-[#353535] text-sm focus:outline-none"
                    placeholder="Enter discount code..."
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#4d4635]/20">
                <label className="text-[10px] font-semibold tracking-wider text-outline uppercase mb-2 block">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-lg text-xs font-semibold uppercase tracking-wider border ${paymentMethod === method ? "bg-primary text-black border-primary" : "border-[#4d4635]/35 text-secondary"}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
                {paymentMethod === "UPI" ? (
                  <button
                    type="button"
                    onClick={() => setIsUpiModalOpen(true)}
                    className="mt-3 w-full min-h-[44px] rounded-xl border border-primary/25 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider hover:bg-primary/15 transition-colors"
                  >
                    {upiPaid ? "UPI payment completed" : "Open UPI QR"}
                  </button>
                ) : null}
                {paymentMethod === "CASH" && (
                  <div className="mt-3">
                    <label className="text-[10px] font-semibold tracking-wider text-outline uppercase mb-2 block">
                      Cash Received
                    </label>
                    <input
                      className="w-full bg-background text-on-background border border-[#4d4635]/35 rounded-lg px-3 py-2 focus:border-primary placeholder:text-[#353535] text-sm focus:outline-none"
                      placeholder="Enter cash amount"
                      type="number"
                      min="0"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                    />
                    <p className="text-xs text-outline mt-2">Change: PKR {cashChange.toLocaleString()}</p>
                    {cashReceivedAmount >= total && total > 0 ? (
                      <p className="text-xs text-primary mt-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        Cash payment ready
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-primary/20">
            <div className="flex justify-between items-end mb-6">
              <span className="text-sm text-secondary pb-1">Total Amount</span>
              <span className="font-headline text-3xl text-primary tracking-tight">
                PKR {total.toLocaleString()}
              </span>
            </div>
            {submitError ? <p className="text-sm text-error mb-3">{submitError}</p> : null}
            <button
              onClick={handleCreateInvoice}
              disabled={isSubmitting || !isPaymentReady || (paymentMethod === "CASH" && cashReceivedAmount < total && total > 0)}
              className="w-full bg-primary text-black font-semibold text-xs uppercase tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#ffe088] transition-all duration-200 active:scale-98 shadow-[0_0_15px_rgba(212,175,55,0.2)] cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">point_of_sale</span>
              {isSubmitting
                ? "PROCESSING..."
                : paymentMethod === "UPI" && !upiPaid
                ? "COMPLETE UPI PAYMENT"
                : "GENERATE INVOICE"}
            </button>
          </div>
        </div>
      </section>

      <UpiPaymentModal
        open={isUpiModalOpen}
        amount={total}
        onClose={() => setIsUpiModalOpen(false)}
        onPaymentConfirmed={() => setUpiPaid(true)}
      />

      <InvoicePreviewModal
        open={isInvoicePreviewOpen}
        invoice={savedInvoice}
        onClose={() => setIsInvoicePreviewOpen(false)}
        onShareWhatsApp={shareInvoiceOnWhatsApp}
        onPrint={printInvoice}
      />
    </div>
  );
}
