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
export default function InvoiceTemplate({ invoice }) {
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
    itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
    merchant: STORE_INFO.name
  });

  return (
    <div
      id="malaabis-invoice-capture"
      style={{
        width: "794px",
        minHeight: "1123px",
        background: "#ffffff",
        color: "#111111",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        fontSize: "12px",
        lineHeight: "1.4",
        padding: "40px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* ── WATERMARK LOGO (behind all content) ── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "520px",
          height: "520px",
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
          borderBottom: "3px solid #d4af37",
          paddingBottom: "20px",
          marginBottom: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Dress Logo - Centered */}
        <img
          src="/logo.png"
          alt="Malaabis Logo"
          style={{ height: "95px", width: "auto", objectFit: "contain", marginBottom: "12px" }}
          crossOrigin="anonymous"
        />
        {/* Single Centered Heading */}
        <h1
          style={{
            color: "#111111",
            fontSize: "26px",
            fontWeight: "800",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            margin: "0",
            textAlign: "center"
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
          <div style={{ fontSize: "11px", color: "#555" }}>
            Date: {invoiceDate.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
            Time: {invoiceDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              background: "#111111",
              color: "#f2ca50",
              padding: "4px 10px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: "700",
              letterSpacing: "0.1em",
              display: "inline-block",
              marginBottom: "4px",
              textTransform: "uppercase",
            }}
          >
            Invoice Paid
          </div>
          <div style={{ fontSize: "13px", fontWeight: "700", color: "#111111" }}>
            #{invoice.invoiceNumber || "ML-N/A"}
          </div>
        </div>
      </div>

      {/* ── STORE & CUSTOMER DETAIL COLUMNS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          marginBottom: "25px",
          borderBottom: "1px solid #eeeeee",
          paddingBottom: "20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Store Details */}
        <div>
          <h3
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#d4af37",
              fontWeight: "700",
              margin: "0 0 8px 0",
            }}
          >
            Store Details
          </h3>
          <p style={{ fontWeight: "700", fontSize: "12px", margin: "0 0 4px 0" }}>{STORE_INFO.name}</p>
          <p style={{ color: "#444", margin: "0 0 2px 0" }}>{STORE_INFO.addressLine1}</p>
          <p style={{ color: "#444", margin: "0 0 2px 0" }}>{STORE_INFO.addressLine2}</p>
          <p style={{ color: "#444", margin: "0 0 2px 0" }}>{STORE_INFO.addressLine3}</p>
          <p style={{ color: "#111", fontWeight: "600", margin: "6px 0 0 0" }}>Phone: +91 {STORE_INFO.phone}</p>
        </div>

        {/* Customer Details */}
        <div>
          <h3
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#d4af37",
              fontWeight: "700",
              margin: "0 0 8px 0",
            }}
          >
            Customer Details
          </h3>
          <p style={{ fontWeight: "700", fontSize: "12px", margin: "0 0 4px 0" }}>
            {invoice.customerName || "Walk-in Customer"}
          </p>
          <p style={{ color: "#444", margin: "0 0 2px 0" }}>
            Mobile: {invoice.customerMobile ? `+91 ${invoice.customerMobile.replace(/^\+?91/, "")}` : "Not provided"}
          </p>
          <p style={{ color: "#444", margin: "0 0 2px 0" }}>
            Invoice ID: {invoice._id || "Draft Mode"}
          </p>
          <p style={{ color: "#444", margin: "0 0 2px 0" }}>
            Payment: {invoice.paymentMethod || "CASH"}
          </p>
        </div>
      </div>

      {/* ── PRODUCT TABLE ── */}
      <div style={{ marginBottom: "25px", position: "relative", zIndex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#111111", color: "#ffffff" }}>
              <th style={{ padding: "10px 12px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>Product</th>
              <th style={{ padding: "10px 12px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em" }}>SKU</th>
              <th style={{ padding: "10px 12px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>Qty</th>
              <th style={{ padding: "10px 12px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>Price</th>
              <th style={{ padding: "10px 12px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>Discount</th>
              <th style={{ padding: "10px 12px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right" }}>Total</th>
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
                  <td style={{ padding: "12px", fontWeight: "600", fontSize: "11px" }}>
                    {item.name}
                  </td>
                  <td style={{ padding: "12px", color: "#555", fontSize: "11px" }}>
                    {item.sku || "ML-N/A"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center", fontSize: "11px" }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", fontSize: "11px" }}>
                    {formatINR(item.originalPrice || item.price)}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", color: discountValue > 0 ? "#10b981" : "#555", fontSize: "11px" }}>
                    {discountValue > 0 ? `-${formatINR(discountValue)}` : "—"}
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", fontWeight: "700", fontSize: "11px" }}>
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
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "40px",
          marginBottom: "30px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left Side: Payment details breakdown */}
        <div
          style={{
            background: "#fcfcfc",
            border: "1px solid #eeeeee",
            borderRadius: "12px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#d4af37",
                fontWeight: "700",
                margin: "0 0 10px 0",
              }}
            >
              Payment Summary
            </h4>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px" }}>
              <span style={{ color: "#666" }}>Method:</span>
              <span style={{ fontWeight: "700", color: "#111" }}>{invoice.paymentMethod || "CASH"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px" }}>
              <span style={{ color: "#666" }}>Status:</span>
              <span style={{ fontWeight: "700", color: "#10b981" }}>PAID</span>
            </div>
            {invoice.paymentMethod === "CASH" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px" }}>
                  <span style={{ color: "#666" }}>Cash Tendered:</span>
                  <span style={{ fontWeight: "600" }}>{formatINR(Number(invoice.total) + Number(invoice.cashChange || 0))}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                  <span style={{ color: "#666" }}>Balance Returned:</span>
                  <span style={{ fontWeight: "700", color: "#d4af37" }}>{formatINR(invoice.cashChange)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Pricing subtotals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyContent: "flex-end" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#444" }}>
            <span>Subtotal:</span>
            <span style={{ fontWeight: "600" }}>{formatINR(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#10b981" }}>
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
              border: "1px solid #d4af37",
              borderRadius: "8px",
              padding: "10px 14px",
              marginTop: "8px",
            }}
          >
            <span style={{ color: "#ffffff", fontWeight: "700", fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Grand Total
            </span>
            <span style={{ color: "#f2ca50", fontWeight: "800", fontSize: "18px" }}>
              {formatINR(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ── BARCODE + QR CODE SECTION ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px dashed #d4af37",
          borderBottom: "1px dashed #d4af37",
          padding: "20px 0",
          marginBottom: "25px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Barcode block */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
          {/* react-barcode renders canvas perfectly for html2canvas capturing */}
          <ReactBarcode
            value={(invoice.invoiceNumber || "ML-INVOICE").replace("#", "")}
            height={55}
            width={2.2}
            fontSize={10}
            background="#ffffff"
            lineColor="#111111"
            renderer="svg"
            margin={0}
          />
          <span style={{ fontSize: "8px", color: "#888", trackingSpacing: "0.1em", textTransform: "uppercase", marginTop: "2px" }}>
            Scannable Invoice Barcode
          </span>
        </div>

        {/* QR Code block */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontWeight: "700", fontSize: "11px", margin: "0 0 2px 0", color: "#111" }}>Scan to Verify</p>
            <p style={{ fontSize: "8px", color: "#888", margin: "0" }}>Secure Digital Receipt Info</p>
          </div>
          <div
            style={{
              padding: "6px",
              border: "1px solid #dddddd",
              borderRadius: "8px",
              background: "#ffffff",
              display: "inline-block"
            }}
          >
            <ReactQRCode
              value={qrValue}
              size={56}
              level="M"
              style={{ display: "block" }}
            />
          </div>
        </div>
      </div>

      {/* ── FOOTER Return Policy ── */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontWeight: "700", fontSize: "11px", color: "#111", margin: "0 0 6px 0" }}>
          Thank you for shopping with Malaabis Studio.
        </p>
        <p style={{ fontSize: "9px", color: "#666", margin: "0 0 4px 0", fontStyle: "italic" }}>
          Exchange Policy: Exchanges permitted within 7 days from purchase, provided original tags are intact and invoice is presented. Strictly no refunds.
        </p>
        <p style={{ fontSize: "10px", fontWeight: "700", color: "#d4af37", margin: "0" }}>
          For Customer Support, contact us at +91 {STORE_INFO.support}
        </p>
      </div>
    </div>
  );
}
