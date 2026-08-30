import React from "react";
import Barcode from "react-barcode";
import QRCode from "react-qr-code";
import { formatINR } from "../../utils/currency";

const ReactBarcode = Barcode.default || Barcode;
const ReactQRCode = QRCode.default || QRCode;

const STORE_INFO = {
  name: "Malaabis Studio",
  subtitle: "Luxury Designer Clothing",
  addressLine1: "24/E, Falaknuma,",
  addressLine2: "B/h. Royal Akbar, Juhapura,",
  addressLine3: "Ahmedabad-380055",
  phone: "7863813922",
  support: "7863813922"
};

/**
 * InvoiceTemplate
 * A professional premium retail invoice template.
 * Tailored with a luxury black + gold theme.
 * Uses ₹ INR only, handles scannable QR and Barcode.
 * 
 * @param {object} props.invoice - The invoice data object.
 */
export default function InvoiceTemplate({ invoice, responsive = false }) {
  if (!invoice) return null;

  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || 0);
  const discountAmount = Number(invoice.discountAmount || 0);
  const grandTotal = Number(invoice.total || 0);
  const invoiceDate = new Date(invoice.createdAt || Date.now());

  // JSON string for QR Code scanning
  const qrValue = JSON.stringify({
    invoiceNo: invoice.invoiceNumber || "ML-N/A",
    date: invoiceDate.toISOString().split("T")[0],
    total: grandTotal,
    itemsCount: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    merchant: STORE_INFO.name
  });

  return (
    <div
      id="malaabis-invoice-capture"
      style={{
        width: responsive ? "100%" : "794px",
        maxWidth: "794px",
        minHeight: responsive ? "auto" : "1123px",
        background: "#ffffff",
        color: "#111111",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: responsive ? "13px" : "14px",
        lineHeight: "1.4",
        padding: responsive ? "20px 16px" : "36px 36px 30px 36px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* ── WATERMARK LOGO (behind all content) ── */}
      <div
        style={{
          position: "absolute",
          top: "46%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "480px",
          height: "480px",
          opacity: 0.07,
          pointerEvents: "none",
          zIndex: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/logo.png"
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          crossOrigin="anonymous"
        />
      </div>

      {/* ── TOP HEADER BAND ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderBottom: "2px solid #111111",
          paddingBottom: "18px",
          marginBottom: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Dress Logo - Centered */}
        <img
          src="/logo.png"
          alt="Malaabis Logo"
          style={{ height: "90px", width: "auto", objectFit: "contain", marginBottom: "10px" }}
          crossOrigin="anonymous"
        />
        {/* Single Centered Heading */}
        <h1
          style={{
            color: "#111111",
            fontSize: "30px",
            fontWeight: "800",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            margin: "0",
            textAlign: "center",
          }}
        >
          MALAABIS STUDIO
        </h1>
      </div>

      {/* ── INVOICE METADATA BAND ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div>
          <div style={{ fontSize: "14px", color: "#222222" }}>
            Date: {invoiceDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </div>
          <div style={{ fontSize: "14px", color: "#222222", marginTop: "2px" }}>
            Time: {invoiceDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase()}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              background: "#111111",
              color: "#ffffff",
              padding: "5px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "0.1em",
              display: "inline-block",
              marginBottom: "4px",
              textTransform: "uppercase",
            }}
          >
            INVOICE PAID
          </div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#111111" }}>
            #{invoice.invoiceNumber || "ML-N/A"}
          </div>
        </div>
      </div>

      {/* ── STORE & CUSTOMER DETAIL COLUMNS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: responsive ? "repeat(auto-fit, minmax(200px, 1fr))" : "1fr 1fr",
          gap: responsive ? "16px" : "40px",
          marginBottom: "22px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Store Details */}
        <div>
          <h3
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#111111",
              fontWeight: "700",
              margin: "0 0 8px 0",
            }}
          >
            STORE DETAILS
          </h3>
          <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 3px 0" }}>{STORE_INFO.name}</p>
          <p style={{ color: "#222222", fontSize: "13px", margin: "0 0 2px 0" }}>{STORE_INFO.addressLine1}</p>
          <p style={{ color: "#222222", fontSize: "13px", margin: "0 0 2px 0" }}>{STORE_INFO.addressLine2}</p>
          <p style={{ color: "#222222", fontSize: "13px", margin: "0 0 2px 0" }}>{STORE_INFO.addressLine3}</p>
          <p style={{ color: "#111111", fontWeight: "600", fontSize: "13px", margin: "5px 0 0 0" }}>Phone: +91 {STORE_INFO.phone}</p>
        </div>

        {/* Customer Details */}
        <div>
          <h3
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#111111",
              fontWeight: "700",
              margin: "0 0 8px 0",
            }}
          >
            CUSTOMER DETAILS
          </h3>
          <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 3px 0" }}>
            {invoice.customerName || "Walk-in Customer"}
          </p>
          <p style={{ color: "#222222", fontSize: "13px", margin: "0 0 2px 0" }}>
            Mobile: {invoice.customerMobile ? (invoice.customerMobile.startsWith("+91") ? invoice.customerMobile : `+91 ${invoice.customerMobile.replace(/^\+?91/, "").trim()}`) : "+91"}
          </p>
          <p style={{ color: "#222222", fontSize: "13px", margin: "0 0 2px 0" }}>
            Invoice ID: {invoice._id || "Draft Mode"}
          </p>
          <p style={{ color: "#222222", fontSize: "13px", margin: "0 0 2px 0" }}>
            Payment: {invoice.paymentMethod || "CASH"}
          </p>
        </div>
      </div>

      {/* ── PRODUCT TABLE ── */}
      <div style={{ marginBottom: "22px", position: "relative", zIndex: 1, overflowX: responsive ? "auto" : "visible", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", minWidth: responsive ? "460px" : "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#111111", color: "#ffffff" }}>
              <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>PRODUCT</th>
              <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>SKU</th>
              <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>QTY</th>
              <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>PRICE</th>
              <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>DISCOUNT</th>
              <th style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const effectivePrice = item.customPrice ?? item.price ?? 0;
              const hasDiscount = item.originalPrice && item.customPrice && item.customPrice < item.originalPrice;
              const discountValue = hasDiscount ? (item.originalPrice - item.customPrice) * item.quantity : 0;
              
              return (
                <tr
                  key={`${item.product || item.name}-${index}`}
                  style={{ borderBottom: "1px solid #eeeeee" }}
                >
                  <td style={{ padding: "11px 12px", fontWeight: "500", fontSize: "13px" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "11px 12px", color: "#555555", fontSize: "13px" }}>
                    {item.sku || "ML-N/A"}
                  </td>
                  <td style={{ padding: "11px 12px", textAlign: "center", fontSize: "13px" }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "11px 12px", textAlign: "right", fontSize: "13px" }}>
                    {formatINR(item.originalPrice || item.price)}
                  </td>
                  <td style={{ padding: "11px 12px", textAlign: "right", color: discountValue > 0 ? "#10b981" : "#555555", fontSize: "13px" }}>
                    {discountValue > 0 ? `-${formatINR(discountValue)}` : "—"}
                  </td>
                  <td style={{ padding: "11px 12px", textAlign: "right", fontWeight: "700", fontSize: "13px" }}>
                    {formatINR(effectivePrice * item.quantity)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── BILLING SUMMARY SECTION ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: responsive ? "repeat(auto-fit, minmax(220px, 1fr))" : "1.1fr 0.9fr",
          gap: responsive ? "16px" : "35px",
          marginBottom: "22px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left Side: Payment details breakdown */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #eeeeee",
            borderRadius: "10px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#111111",
                fontWeight: "700",
                margin: "0 0 10px 0",
              }}
            >
              PAYMENT SUMMARY
            </h4>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
              <span style={{ color: "#666666" }}>Method:</span>
              <span style={{ fontWeight: "700", color: "#111111" }}>{invoice.paymentMethod || "CASH"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
              <span style={{ color: "#666666" }}>Status:</span>
              <span style={{ fontWeight: "700", color: "#10b981" }}>PAID</span>
            </div>
            {invoice.paymentMethod === "CASH" && Number(invoice.cashChange) > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                  <span style={{ color: "#666666" }}>Cash Tendered:</span>
                  <span style={{ fontWeight: "600" }}>{formatINR(Number(invoice.total) + Number(invoice.cashChange || 0))}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "#666666" }}>Balance Returned:</span>
                  <span style={{ fontWeight: "700", color: "#111111" }}>{formatINR(invoice.cashChange)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Pricing subtotals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#222222" }}>
            <span>Subtotal:</span>
            <span style={{ fontWeight: "600" }}>{formatINR(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#10b981" }}>
              <span>Shop Discount:</span>
              <span style={{ fontWeight: "600" }}>-{formatINR(discountAmount)}</span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#111111",
              borderRadius: "8px",
              padding: "10px 14px",
              marginTop: "6px",
            }}
          >
            <span style={{ color: "#ffffff", fontWeight: "700", fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              GRAND TOTAL
            </span>
            <span style={{ color: "#ffffff", fontWeight: "800", fontSize: "22px" }}>
              {formatINR(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ── BARCODE + QR CODE SECTION ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: responsive ? "12px" : "0",
          borderTop: "1px dashed #cccccc",
          borderBottom: "1px dashed #cccccc",
          padding: "16px 0",
          marginBottom: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Barcode block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px" }}>
          <ReactBarcode
            value={(invoice.invoiceNumber || "ML-INVOICE").replace("#", "")}
            height={48}
            width={1.8}
            fontSize={12}
            background="#ffffff"
            lineColor="#111111"
            renderer="canvas"
            margin={0}
          />
          <span style={{ fontSize: "10px", color: "#666666", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "2px" }}>
            SCANNABLE INVOICE BARCODE
          </span>
        </div>

        {/* QR Code block */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontWeight: "700", fontSize: "13px", margin: "0 0 2px 0", color: "#111111" }}>Scan to Verify</p>
            <p style={{ fontSize: "11px", color: "#666666", margin: "0" }}>Secure Digital Receipt Info</p>
          </div>
          <div
            style={{
              padding: "5px",
              border: "1px solid #dddddd",
              borderRadius: "6px",
              background: "#ffffff",
              display: "inline-block"
            }}
          >
            <ReactQRCode
              value={qrValue}
              size={52}
              level="M"
              style={{ display: "block" }}
            />
          </div>
        </div>
      </div>

      {/* ── FOOTER Return Policy ── */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1, paddingTop: "4px" }}>
        <p style={{ fontWeight: "700", fontSize: "13px", color: "#111111", margin: "0 0 4px 0" }}>
          Thank you for shopping with Malaabis Studio.
        </p>
        <p style={{ fontSize: "11px", color: "#666666", margin: "0 0 4px 0", fontStyle: "italic" }}>
          Exchange Policy: Exchanges permitted within 7 days from purchase, provided original tags are intact and invoice is presented. Strictly no refunds.
        </p>
        <p style={{ fontSize: "12px", fontWeight: "700", color: "#111111", margin: "0" }}>
          For Customer Support, contact us at +91 {STORE_INFO.support}
        </p>
      </div>
    </div>
  );
}
