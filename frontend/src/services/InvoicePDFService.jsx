import React from "react";
import { Capacitor } from "@capacitor/core";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * InvoicePDFService
 * Centralized service to generate high-quality premium PDFs from pre-rendered InvoiceTemplate.
 * Works seamlessly in Browser, Android Emulator, APK viewports, and thermal scales.
 */
export const InvoicePDFService = {
  /**
   * Generates and downloads the retail PDF invoice locally from pre-rendered DOM nodes.
   * 
   * @param {object} invoice - Full invoice data payload.
   * @returns {Promise<string>} - Resolves with the filename on success.
   */
  async generateAndSave(invoice) {
    if (!invoice) {
      throw new Error("No invoice data available for PDF generation.");
    }

    // 1. Static imports completed at top of file for Cordova/Capacitor webview safety

    // 2. Format name as: Invoice-YYYY-MM-DD-Seq.pdf
    const invoiceDate = new Date(invoice.createdAt || Date.now());
    const yyyy = invoiceDate.getFullYear();
    const mm = String(invoiceDate.getMonth() + 1).padStart(2, "0");
    const dd = String(invoiceDate.getDate()).padStart(2, "0");
    
    const rawNum = String(invoice.invoiceNumber || "001");
    const seq = rawNum.length >= 3 ? rawNum.slice(-3) : rawNum.padStart(3, "0");
    const fileName = `Invoice-${yyyy}-${mm}-${dd}-${seq}.pdf`;

    // 3. Locate the pre-rendered template node in DOM
    const targetNode = document.getElementById("malaabis-invoice-capture");
    if (!targetNode) {
      throw new Error("Pre-rendered invoice template node not found in DOM. Ensure InvoiceTemplate is mounted.");
    }

    try {
      // 4. Capture with html2canvas (scaled up for high-definition print quality)
      const canvas = await html2canvas(targetNode, {
        scale: 2, // 2x scale for sharp text and crisp scannable barcodes/QR codes
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        windowWidth: 794
      });

      // 5. Generate jsPDF instance (A4 proportions)
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

      // Handle multi-page splits gracefully if invoice is long
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

      // 6. Save file locally with hybrid Android-safe triggers or native Capacitor share
      if (Capacitor.isNativePlatform()) {
        // Get raw base64 string from the jsPDF instance
        const base64Data = pdf.output("datauristring").split(",")[1];

        // Write the PDF file to the native cache directory
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        // Share the PDF file natively
        await Share.share({
          title: "Share Invoice PDF",
          text: `Malaabis Studio Invoice #${invoice.invoiceNumber || ""}`,
          url: writeResult.uri,
          dialogTitle: "Share or Save Invoice",
        });
      } else {
        // Fallback: Standard Web Browser blob download triggers
        const blob = pdf.output("blob");
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Keep link for a moment to let mobile browser process threads
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
  }
};

export default InvoicePDFService;
