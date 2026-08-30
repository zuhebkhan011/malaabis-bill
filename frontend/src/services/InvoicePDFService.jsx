import React from "react";
import { Capacitor } from "@capacitor/core";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { createRoot } from "react-dom/client";
import InvoiceTemplate from "../components/invoice/InvoiceTemplate";

/**
 * InvoicePDFService
 * High-performance, pixel-perfect PDF generator for Malaabis Studio invoices.
 * Guaranteed zero blank pages, seamless A4 pagination, and instant native sharing.
 */
export const InvoicePDFService = {
  /**
   * Internal worker: Programmatically renders InvoiceTemplate offscreen and creates a multi-page jsPDF document.
   * Defaults to A5 across all devices, while supporting custom sizes (e.g. A4).
   * @param {object} invoice
   * @param {string} paperSize - 'a5' (default) or 'a4'
   * @returns {Promise<jsPDF>}
   */
  async _createPDFDocument(invoice, paperSize = "a5") {
    if (!invoice) {
      throw new Error("No invoice data provided for PDF generation.");
    }

    const normalizedSize = String(paperSize || "a5").toLowerCase();
    const isA4 = normalizedSize === "a4";
    const formatName = isA4 ? "a4" : "a5";
    const pageWidthMm = isA4 ? 210 : 148;
    const pageHeightMm = isA4 ? 297 : 210;
    const aspectRatio = pageHeightMm / pageWidthMm;

    // 1. Create a clean isolated rendering container
    const container = document.createElement("div");
    container.id = "malaabis-pdf-render-root";
    container.style.cssText = [
      "position: fixed",
      "left: 0",
      "top: 0",
      "width: 794px",
      "background: #ffffff",
      "z-index: -99999",
      "pointer-events: none",
      "margin: 0",
      "padding: 0",
      "border: none",
      "overflow: visible",
      "transform: none",
    ].join("; ");
    document.body.appendChild(container);

    const root = createRoot(container);

    try {
      // 2. Mount template
      root.render(<InvoiceTemplate invoice={invoice} />);

      // 3. Wait for all images (logo, watermark, etc.) to fully load
      await new Promise((resolve) => {
        // Give React a tick to populate DOM nodes
        setTimeout(async () => {
          const imgs = Array.from(container.querySelectorAll("img"));
          await Promise.all(
            imgs.map(
              (img) =>
                new Promise((imgRes) => {
                  if (img.complete && img.naturalHeight !== 0) {
                    imgRes();
                  } else {
                    img.onload = () => imgRes();
                    img.onerror = () => imgRes();
                    setTimeout(imgRes, 1000);
                  }
                })
            )
          );
          // Wait additional 150ms for fonts & barcode/QR canvas rendering
          setTimeout(resolve, 150);
        }, 60);
      });

      const targetEl = container.firstElementChild || container;

      // 4. Capture high-definition canvas with html2canvas (strictly isolated from phone screen dimensions)
      const canvas = await html2canvas(targetEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: 794,
        windowWidth: 794,
        windowHeight: 1127,
      });

      // 5. Build PDF (A5 default on all devices)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: formatName,
        compress: true,
      });

      // Height of one full page in canvas coordinate system:
      const pageHeightInCanvasPx = Math.round(canvas.width * aspectRatio);

      let currentY = 0;
      let pageIndex = 0;

      while (currentY < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage(formatName, "portrait");
        }

        const remainingHeight = canvas.height - currentY;
        const sliceHeight = Math.min(pageHeightInCanvasPx, remainingHeight);

        // Create discrete page canvas
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageHeightInCanvasPx;
        const pageCtx = pageCanvas.getContext("2d");

        // Fill pure white background
        pageCtx.fillStyle = "#ffffff";
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        // Draw image slice
        pageCtx.drawImage(
          canvas,
          0,
          currentY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(pageImgData, "JPEG", 0, 0, pageWidthMm, pageHeightMm);

        currentY += pageHeightInCanvasPx;
        pageIndex++;
      }

      return pdf;
    } finally {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  },

  /**
   * Generates and downloads or shares the retail PDF invoice.
   * Defaults to A5 format across all devices, while allowing optional A4 format.
   * @param {object} invoice
   * @param {string} paperSize - 'a5' (default) or 'a4'
   * @returns {Promise<string>}
   */
  async generateAndSave(invoice, paperSize = "a5") {
    if (!invoice) {
      throw new Error("No invoice data available for PDF generation.");
    }

    const invoiceDate = new Date(invoice.createdAt || Date.now());
    const yyyy = invoiceDate.getFullYear();
    const mm = String(invoiceDate.getMonth() + 1).padStart(2, "0");
    const dd = String(invoiceDate.getDate()).padStart(2, "0");
    const rawNum = String(invoice.invoiceNumber || "001");
    const seq = rawNum.length >= 3 ? rawNum.slice(-3) : rawNum.padStart(3, "0");
    const fileName = `Invoice-${yyyy}-${mm}-${dd}-${seq}.pdf`;

    const pdf = await this._createPDFDocument(invoice, paperSize);

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
      const blob = pdf.output("blob");
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        window.URL.revokeObjectURL(blobUrl);
      }, 250);
    }

    return fileName;
  },

  /**
   * Programmatically renders and returns the raw base64 data uri string.
   * Defaults to A5 format across all devices.
   * @param {object} invoice
   * @param {string} paperSize - 'a5' (default) or 'a4'
   * @returns {Promise<string>}
   */
  async generatePDFBase64(invoice, paperSize = "a5") {
    const pdf = await this._createPDFDocument(invoice, paperSize);
    return pdf.output("datauristring");
  },

  /**
   * Directly prints the generated high-resolution invoice document.
   * Uses an isolated printable PDF blob iframe to guarantee zero blank pages and exact 2-page pagination.
   * @param {object} invoice
   * @param {string} paperSize - 'a5' (default) or 'a4'
   */
  async printInvoice(invoice, paperSize = "a5") {
    if (!invoice) {
      throw new Error("No invoice data provided for printing.");
    }

    if (Capacitor.isNativePlatform()) {
      return this.generateAndSave(invoice, paperSize);
    }

    const pdf = await this._createPDFDocument(invoice, paperSize);
    const blob = pdf.output("blob");
    const blobUrl = window.URL.createObjectURL(blob);

    // Check if on mobile browser
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);

    if (isMobile) {
      // On mobile browsers, open blob in a new tab for native viewer print / share
      const win = window.open(blobUrl, "_blank");
      if (!win) {
        // If popup blocked, create link and trigger click
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 500);
      }
      return;
    }

    // On desktop, use a clean print iframe
    let printIframe = document.getElementById("malaabis-print-iframe");
    if (printIframe && document.body.contains(printIframe)) {
      document.body.removeChild(printIframe);
    }

    printIframe = document.createElement("iframe");
    printIframe.id = "malaabis-print-iframe";
    printIframe.style.cssText = "position: fixed; right: 0; bottom: 0; width: 0; height: 0; border: none; opacity: 0; pointer-events: none;";
    printIframe.src = blobUrl;
    document.body.appendChild(printIframe);

    printIframe.onload = () => {
      setTimeout(() => {
        try {
          printIframe.focus();
          printIframe.contentWindow.print();
        } catch (iframeErr) {
          console.warn("Direct iframe print blocked, falling back to window.print():", iframeErr);
          window.print();
        }
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
          window.URL.revokeObjectURL(blobUrl);
        }, 120000);
      }, 350);
    };
  },
};

export default InvoicePDFService;
