import React, { useRef } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import Barcode from "react-barcode";
import { QRCodeSVG } from "react-qr-code";
import { formatINR } from "../../utils/currency";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * InvoicePDF
 * Renders a hidden off-screen invoice DOM node and provides
 * generateInvoicePDF() to capture it with html2canvas → jsPDF.
 *
 * Usage:
 *   const ref = useRef();
 *   <InvoicePDF ref={ref} invoice={...} />
 *   await ref.current.generatePDF();
 */

const STORE_INFO = {
  name: "Malaabis Studio",
  tagline: "Premium Fashion Atelier",
  address: "Flagship Store, India",
  phone: "+91 99789 22880",
  upiId: "paytm.s23u1ph@pty",
  gst: "", // GST removed
};

function InvoiceDocument({ invoice }) {
  if (!invoice) return null;

  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || 0);
  const discountAmount = Number(invoice.discountAmount || 0);
  const total = Number(invoice.total || 0);
  const invoiceDate = new Date(invoice.createdAt || Date.now());

  return (
    <div
      id="malaabis-invoice-print"
      style={{
        width: "794px",
        minHeight: "1123px",
        background: "#ffffff",
        color: "#111111",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        fontSize: "13px",
        lineHeight: "1.5",
        padding: "0",
        boxSizing: "border-box",
      }}
    >
      {/* ── HEADER BAND ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #111111 0%, #1a1a1a 100%)",
          padding: "32px 40px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {/* Logo + Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img
            src="/logo.png"
            alt="Malaabis Studio"
            style={{ height: "64px", width: "auto", objectFit: "contain" }}
            crossOrigin="anonymous"
          />
          <div>
            <div
              style={{
                color: "#f2ca50",
                fontSize: "18px",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {STORE_INFO.name}
            </div>
            <div
              style={{
                color: "#99907c",
                fontSize: "10px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginTop: "4px",
              }}
            >
              {STORE_INFO.tagline}
            </div>
            <div style={{ color: "#c6c6c7", fontSize: "11px", marginTop: "6px" }}>
              {STORE_INFO.address} • {STORE_INFO.phone}
            </div>
          </div>
        </div>

        {/* Invoice meta */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              color: "#f2ca50",
              fontSize: "22px",
              fontWeight: "700",
              letterSpacing: "0.05em",
            }}
          >
            INVOICE
          </div>
          <div style={{ color: "#c6c6c7", fontSize: "12px", marginTop: "6px" }}>
            #{invoice.invoiceNumber || "MALAABIS"}
          </div>
          <div style={{ color: "#99907c", fontSize: "11px", marginTop: "4px" }}>
            {invoiceDate.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div style={{ color: "#99907c", fontSize: "11px" }}>
            {invoiceDate.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Gold accent line */}
      <div style={{ height: "3px", background: "linear-gradient(90deg, #f2ca50, #ffe88a, #d4af37)" }} />

      {/* ── CUSTOMER + PAYMENT INFO ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <div style={{ padding: "20px 40px" }}>
          <div
            style={{
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "#888",
              marginBottom: "8px",
            }}
          >
            Billed To
          </div>
          <div style={{ fontWeight: "700", fontSize: "16px", color: "#111" }}>
            {invoice.customerName || "Walk-in Customer"}
          </div>
          {invoice.customerMobile && invoice.customerMobile !== "N/A" && (
            <div style={{ color: "#555", fontSize: "12px", marginTop: "4px" }}>
              📞 {invoice.customerMobile}
            </div>
          )}
        </div>
        <div
          style={{
            padding: "20px 40px",
            borderLeft: "1px solid #e5e5e5",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "#888",
              marginBottom: "8px",
            }}
          >
            Payment
          </div>
          <div style={{ fontWeight: "700", fontSize: "16px", color: "#111" }}>
            {invoice.paymentMethod || "CASH"}
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: "6px",
              padding: "2px 10px",
              background: "#f0f9f0",
              border: "1px solid #86efac",
              borderRadius: "999px",
              color: "#166534",
              fontSize: "10px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            ✓ PAID
          </div>
        </div>
      </div>

      {/* ── ITEMS TABLE ── */}
      <div style={{ padding: "24px 40px" }}>
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 120px 120px",
            padding: "10px 12px",
            background: "#111111",
            borderRadius: "8px",
            marginBottom: "8px",
          }}
        >
          {["Item Description", "Qty", "Unit Price", "Total"].map((h) => (
            <div
              key={h}
              style={{
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "#f2ca50",
                fontWeight: "700",
                textAlign: h === "Item Description" ? "left" : "right",
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Item rows */}
        {items.map((item, idx) => {
          const effectivePrice = item.customPrice ?? item.price ?? 0;
          const lineTotal = effectivePrice * item.quantity;
          const isOverridden =
            item.customPrice !== undefined &&
            item.customPrice !== item.originalPrice;
          return (
            <div
              key={idx}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 120px 120px",
                padding: "12px 12px",
                borderBottom: "1px solid #f0f0f0",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: "600", fontSize: "13px" }}>
                  {item.name}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#888",
                    marginTop: "2px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  SKU: {item.sku || "ML-N/A"}
                </div>
              </div>
              <div
                style={{ textAlign: "right", fontWeight: "500", color: "#555" }}
              >
                × {item.quantity}
              </div>
              <div style={{ textAlign: "right" }}>
                {isOverridden && (
                  <div
                    style={{
                      fontSize: "10px",
                      textDecoration: "line-through",
                      color: "#aaa",
                    }}
                  >
                    {formatINR(item.originalPrice)}
                  </div>
                )}
                <div
                  style={{
                    fontWeight: "600",
                    color: isOverridden ? "#d97706" : "#111",
                  }}
                >
                  {formatINR(effectivePrice)}
                </div>
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontWeight: "700",
                  fontSize: "14px",
                  color: "#111",
                }}
              >
                {formatINR(lineTotal)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TOTALS ── */}
      <div
        style={{
          padding: "0 40px 24px",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            width: "300px",
            background: "#f7f7f7",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e5e5e5",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
              fontSize: "13px",
              color: "#555",
            }}
          >
            <span>Subtotal</span>
            <span style={{ fontWeight: "600" }}>{formatINR(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
                fontSize: "13px",
                color: "#16a34a",
              }}
            >
              <span>Discount</span>
              <span style={{ fontWeight: "600" }}>
                − {formatINR(discountAmount)}
              </span>
            </div>
          )}

          <div
            style={{
              height: "1px",
              background: "#d4af37",
              margin: "12px 0",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                fontWeight: "700",
                color: "#111",
              }}
            >
              Grand Total
            </span>
            <span
              style={{
                fontSize: "22px",
                fontWeight: "800",
                color: "#d4af37",
              }}
            >
              {formatINR(total)}
            </span>
          </div>

          {invoice.cashReceived > 0 && invoice.paymentMethod === "CASH" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#777",
                }}
              >
                <span>Cash Received</span>
                <span>{formatINR(invoice.cashReceived)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: "#777",
                }}
              >
                <span>Change</span>
                <span>{formatINR(invoice.cashChange)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── BARCODE + QR ── */}
      <div
        style={{
          padding: "24px 40px",
          borderTop: "1px solid #e5e5e5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        {/* Barcode */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#888",
              marginBottom: "8px",
            }}
          >
            Invoice Barcode
          </div>
          <Barcode
            value={invoice.invoiceNumber || "MALAABIS"}
            width={1.4}
            height={48}
            fontSize={10}
            displayValue={true}
            background="#ffffff"
            lineColor="#111111"
          />
        </div>

        {/* UPI QR */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#888",
              marginBottom: "8px",
            }}
          >
            Pay via UPI
          </div>
          <QRCodeSVG
            value={`upi://pay?pa=${STORE_INFO.upiId}&pn=Malaabis+Studio&am=${total}&cu=INR&tn=Invoice+${invoice.invoiceNumber || ""}`}
            size={96}
            bgColor="#ffffff"
            fgColor="#111111"
          />
          <div
            style={{
              fontSize: "9px",
              color: "#888",
              marginTop: "4px",
            }}
          >
            {STORE_INFO.upiId}
          </div>
        </div>

        {/* Thank you note */}
        <div style={{ flex: 1, minWidth: "200px", textAlign: "right" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#111",
            }}
          >
            Thank you for shopping!
          </div>
          <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
            Visit us again at Malaabis Studio
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#d4af37",
              marginTop: "8px",
              fontWeight: "600",
            }}
          >
            Premium Fashion • Quality Guaranteed
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          background: "#111111",
          padding: "14px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "10px", color: "#99907c" }}>
          Malaabis Studio — Premium Fashion Atelier
        </span>
        <span style={{ fontSize: "10px", color: "#99907c" }}>
          {STORE_INFO.phone} • {STORE_INFO.upiId}
        </span>
      </div>
    </div>
  );
}

/**
 * generateInvoicePDF
 * Mounts a hidden invoice DOM node, captures with html2canvas, saves as PDF.
 * @param {object} invoice - invoice data object
 * @returns {Promise<void>}
 */
export async function generateInvoicePDF(invoice) {
  if (!invoice) throw new Error("No invoice data provided");

  // Create a temporary container
  const container = document.createElement("div");
  container.style.cssText =
    "position:absolute;left:0;top:0;z-index:-100;width:794px;background:#fff;opacity:0.01;pointer-events:none;overflow:hidden;";
  document.body.appendChild(container);

  // Render the React invoice into the container
  const root = createRoot(container);

  await new Promise((resolve) => {
    root.render(<InvoiceDocument invoice={invoice} />);
    // Wait for fonts / images to load
    setTimeout(resolve, 800);
  });

  try {
    const canvas = await html2canvas(container.firstChild, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let yPos = 0;
    let pageNum = 0;

    while (yPos < imgHeight) {
      if (pageNum > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, -yPos, imgWidth, imgHeight);
      yPos += pdfHeight;
      pageNum++;
    }

    const fileName = `Malaabis-Invoice-${invoice.invoiceNumber || Date.now()}.pdf`;
    
    if (Capacitor.isNativePlatform()) {
      const base64Data = pdf.output("datauristring").split(",")[1];

      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: "Share Invoice PDF",
        text: `Malaabis Studio Invoice #${invoice.invoiceNumber || ""}`,
        url: writeResult.uri,
        dialogTitle: "Share or Save Invoice",
      });
    } else {
      pdf.save(fileName);
    }
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

export default InvoiceDocument;
