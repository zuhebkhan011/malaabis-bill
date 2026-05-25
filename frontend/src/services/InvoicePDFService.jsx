import React from "react";
import { Capacitor } from "@capacitor/core";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * InvoicePDFService
 * Centralized service to generate high-quality premium PDFs from pre-rendered InvoiceTemplate.
 * Reuses server-side saved base64 PDFs across all devices instantly when available.
 */
export const InvoicePDFService = {
  /**
   * Generates and downloads the retail PDF invoice locally.
   * If the invoice already contains pre-saved cloud pdfData, it reuses it instantly!
   * 
   * @param {object} invoice - Full invoice data payload.
   * @returns {Promise<string>} - Resolves with the filename on success.
   */
  async generateAndSave(invoice) {
    if (!invoice) {
      throw new Error("No invoice data available for PDF generation.");
    }

    // 1. Format name as: Invoice-YYYY-MM-DD-Seq.pdf
    const invoiceDate = new Date(invoice.createdAt || Date.now());
    const yyyy = invoiceDate.getFullYear();
    const mm = String(invoiceDate.getMonth() + 1).padStart(2, "0");
    const dd = String(invoiceDate.getDate()).padStart(2, "0");
    
    const rawNum = String(invoice.invoiceNumber || "001");
    const seq = rawNum.length >= 3 ? rawNum.slice(-3) : rawNum.padStart(3, "0");
    const fileName = `Invoice-${yyyy}-${mm}-${dd}-${seq}.pdf`;

    // 2. Optimization: Reuse cloud-stored PDF base64 if it is present!
    if (invoice.pdfData && invoice.pdfData.length > 500) {
      console.log("Reusing cloud-stored pre-generated A4 PDF data...");
      try {
        const rawBase64 = invoice.pdfData.includes(",") 
          ? invoice.pdfData.split(",")[1] 
          : invoice.pdfData;

        if (Capacitor.isNativePlatform()) {
          // Write directly from base64 and share
          const writeResult = await Filesystem.writeFile({
            path: fileName,
            data: rawBase64,
            directory: Directory.Cache,
          });

          await Share.share({
            title: "Share Invoice PDF",
            text: `Malaabis Studio Invoice #${invoice.invoiceNumber || ""}`,
            url: writeResult.uri,
            dialogTitle: "Share or Save Invoice",
          });
        } else {
          // Standard browser blob download from base64
          const byteCharacters = atob(rawBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "application/pdf" });
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
          }, 200);
        }
        return fileName;
      } catch (cloudErr) {
        console.warn("Reusing pre-saved PDF failed, falling back to local render:", cloudErr);
      }
    }

    // 3. Fallback: Locate pre-rendered template in DOM and capture
    const targetNode = document.getElementById("malaabis-invoice-capture");
    if (!targetNode) {
      throw new Error("Invoice template node not found in DOM. Ensure InvoiceTemplate is mounted or use programmatical generation.");
    }

    try {
      const canvas = await html2canvas(targetNode, {
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        windowWidth: 794
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let yPos = 0;
      let pageNum = 0;

      while (yPos < imgHeight) {
        if (pageNum > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, -yPos, imgWidth, imgHeight);
        yPos += pdfHeight;
        pageNum++;
      }

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
        }, 200);
      }
      
      return fileName;
    } catch (err) {
      console.error("html2canvas or jsPDF compilation failed:", err);
      throw err;
    }
  },

  /**
   * Programmatically renders InvoiceTemplate offscreen and generates raw base64 data uri string.
   * Perfect for background PDF generation on checkout without blocking the UI.
   * 
   * @param {object} invoice - Invoice details
   * @returns {Promise<string>} Base64 PDF datauri string
   */
  async generatePDFBase64(invoice) {
    if (!invoice) throw new Error("No invoice data provided");

    const { createRoot } = await import("react-dom/client");
    const { default: InvoiceTemplate } = await import("../components/invoice/InvoiceTemplate");

    // Create temporary offscreen container
    const container = document.createElement("div");
    container.style.cssText =
      "position:absolute;left:-9999px;top:0;z-index:-100;width:794px;background:#ffffff;pointer-events:none;overflow:hidden;";
    document.body.appendChild(container);

    const root = createRoot(container);

    await new Promise((resolve) => {
      root.render(<InvoiceTemplate invoice={invoice} />);
      // Let barcodes / UPI QR codes / watermarks fully load
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

      return pdf.output("datauristring");
    } finally {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  }
};

export default InvoicePDFService;
