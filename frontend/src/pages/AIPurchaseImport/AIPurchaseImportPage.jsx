import React, { useState, useEffect } from "react";
import PurchaseUploader from "../../components/AIPurchaseImport/PurchaseUploader";
import InvoicePreview from "../../components/AIPurchaseImport/InvoicePreview";
import SupplierCard from "../../components/AIPurchaseImport/SupplierCard";
import MatchReviewTable from "../../components/AIPurchaseImport/MatchReviewTable";
import ImportSummaryCard from "../../components/AIPurchaseImport/ImportSummaryCard";
import ConfidenceBadge from "../../components/AIPurchaseImport/ConfidenceBadge";
import MatchDetailsModal from "../../components/AIPurchaseImport/MatchDetailsModal";
import { purchaseImportService } from "../../services/purchaseImportService";
import { formatINR } from "../../utils/currency";

export default function AIPurchaseImportPage({ products = [], onBack, onGoToCatalog, onImportSuccess }) {
  const [viewState, setViewState] = useState("home"); // 'home' | 'loading' | 'error' | 'review' | 'report'
  const [selectedFile, setSelectedFile] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState({ status: "idle", percentage: 0 });

  // Match details modal states
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  // Phase 4 Commit & Report states
  const [reportData, setReportData] = useState(null);
  const [activeImportId, setActiveImportId] = useState(null);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [isUndoing, setIsUndoing] = useState(false);

  // Duplicate warning states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState(null);

  // 5-minute undo timer countdown effect
  useEffect(() => {
    if (undoCountdown <= 0 || viewState !== "report") return;
    const interval = setInterval(() => {
      setUndoCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [undoCountdown, viewState]);

  const handleFileSelected = async (file) => {
    setSelectedFile(file);
    setViewState("loading");
    setLoadingStatus({ status: "preparing", percentage: 0 });
    setError(null);
    
    let progressTimer = null;
    try {
      const data = await purchaseImportService.processInvoiceFile(file, (progress) => {
        setLoadingStatus(progress);
        
        // Transition immediately once upload is complete
        if (progress.status === "uploading" && progress.percentage === 100) {
          setLoadingStatus({ status: "reading", percentage: 100 });
          
          let stage = 0;
          progressTimer = setInterval(() => {
            stage += 1;
            if (stage === 1) {
              setLoadingStatus({ status: "extracting", percentage: 100 });
            } else if (stage === 2) {
              setLoadingStatus({ status: "previewing", percentage: 100 });
            } else {
              clearInterval(progressTimer);
            }
          }, 3000);
        }
      });
      
      if (progressTimer) clearInterval(progressTimer);
      setInvoiceData(data);
      setViewState("review");
    } catch (err) {
      if (progressTimer) clearInterval(progressTimer);
      console.error("AI Invoice extraction failed:", err);
      
      let friendlyError = "An unexpected error occurred during invoice extraction.";
      const msg = String(err.message || "");
      const status = err.status;

      if (status === 404 || msg.includes("404")) {
        friendlyError = "Wrong API Route (HTTP 404): The server did not recognize the AI import route. Please check backend server routing settings.";
      } else if (status === 413 || msg.includes("413") || msg.includes("too large") || msg.includes("Payload Too Large")) {
        friendlyError = "File Too Large (HTTP 413): The uploaded document size exceeds the server's maximum size limit. Try a smaller file or compressed image.";
      } else if (status === 403 || msg.includes("403") || msg.includes("authentication failed") || msg.includes("API Key")) {
        friendlyError = "Gemini Authentication Failed: The API key stored in the backend .env is invalid or has expired.";
      } else if (msg.includes("timed out") || msg.includes("timeout") || msg.includes("AbortError")) {
        friendlyError = "Gemini Timeout: The AI model took too long to read and parse the document. Please try a simpler invoice or verify server network speed.";
      } else if (msg.includes("valid JSON") || msg.includes("JSON") || msg.includes("malformed JSON")) {
        friendlyError = "Invalid JSON Output: Google Gemini succeeded in OCR reading, but failed to format the catalog items into a clean data layout. Please upload a clearer scan.";
      } else if (msg.includes("Unsupported file type") || msg.includes("Unsupported") || msg.includes("mime")) {
        friendlyError = "Unsupported File Format: The uploaded document format is not supported. Please upload a clear JPG, JPEG, PNG, or PDF file.";
      } else if (status === 0 || msg.includes("Network") || msg.includes("fetch failed") || msg.includes("Failed to fetch") || msg.includes("ENOTFOUND")) {
        friendlyError = "Network Connection Failure: Unable to establish contact with the backend server. Please verify your network connections and server status.";
      } else if (status >= 500 || msg.includes("500") || msg.includes("Google Gemini API returned status")) {
        friendlyError = "Server Crash / Model Error: The backend server or Gemini AI model encountered an error processing this request.";
      } else {
        friendlyError = err.message || friendlyError;
      }

      setError(friendlyError);
      setViewState("error");
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setInvoiceData(null);
    setError(null);
    setEditingProduct(null);
    setEditingIndex(-1);
    setReportData(null);
    setActiveImportId(null);
    setUndoCountdown(0);
    setShowDuplicateModal(false);
    setViewState("home");
  };

  const handleUpdateProductInList = (index, updatedFields) => {
    if (!invoiceData) return;
    const list = [...invoiceData.products];
    list[index] = { ...list[index], ...updatedFields };
    setInvoiceData({
      ...invoiceData,
      products: list,
    });
  };

  const handleSaveModalProduct = (index, updatedProduct) => {
    handleUpdateProductInList(index, updatedProduct);
    setEditingProduct(null);
    setEditingIndex(-1);
  };

  // Commit Import
  const handleCommitImport = async (override = false) => {
    setViewState("loading");
    setLoadingStatus({ status: "committing", percentage: 50 });
    setError(null);
    try {
      const fileBase64 = selectedFile ? await purchaseImportService.fileToBase64(selectedFile) : "";
      
      const payload = {
        supplier: invoiceData.supplier,
        invoice: invoiceData.invoice,
        products: invoiceData.products,
        originalInvoiceImage: selectedFile && selectedFile.type.startsWith("image/") ? fileBase64 : "",
        originalInvoicePdf: selectedFile && selectedFile.type === "application/pdf" ? fileBase64 : "",
        aiExtractedJson: JSON.stringify(invoiceData),
        importedBy: "admin"
      };

      const result = await purchaseImportService.commitPurchaseImport(payload, override);
      
      setReportData(result.report);
      setActiveImportId(result.purchaseHistoryId);
      setUndoCountdown(300); // 300 seconds = 5 minutes
      setViewState("report");
      setShowDuplicateModal(false);

      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      if (err.code === "DUPLICATE_INVOICE") {
        setDuplicateDetails(err.details);
        setShowDuplicateModal(true);
        setViewState("review");
      } else {
        console.error("Import commit failed:", err);
        setError(err.message || "Failed to commit invoice import.");
        setViewState("error");
      }
    }
  };

  // Undo Import rollback
  const handleUndoImport = async () => {
    if (!activeImportId) return;
    setIsUndoing(true);
    try {
      await purchaseImportService.undoPurchaseImport(activeImportId);
      alert("✅ Import successfully rolled back. Inventory stock restored and new products deleted.");
      handleCancel();
    } catch (err) {
      console.error("Undo import failed:", err);
      alert(`❌ Undo failed: ${err.message}`);
    } finally {
      setIsUndoing(false);
    }
  };

  // Validation calculations
  const hasNegativeQty = invoiceData?.products?.some((p) => p.quantity < 0) || false;
  const hasPriceErrors = invoiceData?.products?.some(
    (p) => p.purchasePrice <= 0 || (p.sellingPrice > 0 && p.sellingPrice < p.purchasePrice)
  ) || false;

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getLoadingMessage = () => {
    switch (loadingStatus.status) {
      case "compressing":
        return {
          title: "Optimizing Invoice",
          desc: "Compressing image file to speed up AI transmission..."
        };
      case "uploading":
        return {
          title: "Uploading...",
          desc: `Transferring invoice file to backend server (${loadingStatus.percentage}%)...`
        };
      case "reading":
        return {
          title: "AI Reading Invoice...",
          desc: "Google Gemini is performing OCR text analysis on the document..."
        };
      case "extracting":
        return {
          title: "Extracting Products...",
          desc: "Locating line items, quantities, and pricing data..."
        };
      case "previewing":
        return {
          title: "Preparing Preview...",
          desc: "Matching extracted products against existing catalog inventory..."
        };
      case "retrying":
        return {
          title: "Auto-Retrying...",
          desc: "Re-establishing connection and retrying document upload..."
        };
      case "committing":
        return {
          title: "Applying Database Commit",
          desc: "Safely recording import logs and incrementing catalog stocks..."
        };
      case "preparing":
      default:
        return {
          title: "AI Processing Started",
          desc: "Initializing invoice analysis pipeline..."
        };
    }
  };

  const loadingMsg = getLoadingMessage();

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Central Header */}
      {viewState !== "loading" && (
        <div className="flex items-center gap-4">
          <button
            onClick={viewState !== "home" ? handleCancel : onBack}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer border border-[#4d4635]/25"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <h2 className="font-headline text-2xl md:text-3xl text-on-surface">AI Purchase Import</h2>
            <p className="text-secondary text-xs mt-0.5">
              {viewState === "review" 
                ? "Smart Product Matching & Preview" 
                : viewState === "report" 
                  ? "Import Report Summary" 
                  : "Scan and upload supplier invoices"}
            </p>
          </div>
        </div>
      )}

      {/* Screen 1: Home/Uploader */}
      {viewState === "home" && (
        <div className="bg-[#0e0e0e]/40 p-6 md:p-8 rounded-3xl border border-[#4d4635]/15">
          <PurchaseUploader onFileSelected={handleFileSelected} />
        </div>
      )}

      {/* Screen 2: Loading State */}
      {viewState === "loading" && (
        <div className="flex flex-col items-center justify-center py-28 space-y-6">
          {/* Luxury gold loading spinner */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
          </div>
          <div className="text-center space-y-2">
            <h4 className="text-lg font-semibold text-on-surface">{loadingMsg.title}</h4>
            <p className="text-xs text-outline tracking-wide uppercase font-semibold">{loadingMsg.desc}</p>
          </div>
        </div>
      )}

      {/* Screen 3: Error Handler Card */}
      {viewState === "error" && (
        <div className="max-w-xl mx-auto bg-[#121212] border border-red-500/20 rounded-2xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/25 mx-auto">
            <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-on-surface">Import Error</h4>
            <p className="text-sm text-secondary leading-relaxed px-4">{error}</p>
          </div>
          <div className="pt-2 flex gap-4 justify-center">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-white uppercase tracking-wider text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer"
            >
              Go Back
            </button>
            {selectedFile && (
              <button
                onClick={() => handleFileSelected(selectedFile)}
                className="px-6 py-2.5 rounded-xl bg-primary text-black uppercase tracking-wider text-xs font-semibold hover:bg-[#ffe088] transition-all cursor-pointer"
              >
                Retry Scan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Screen 4: Review / Preview (Smart Matching) */}
      {viewState === "review" && invoiceData && (
        <div className="space-y-6">
          {/* Confidence Badge Banner */}
          <ConfidenceBadge confidence={invoiceData.confidence} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left side: Invoice preview and Supplier Details */}
            <div className="lg:col-span-1 space-y-6">
              <InvoicePreview file={selectedFile} />
              <SupplierCard supplier={invoiceData.supplier} confidence={invoiceData.confidence} />
            </div>

            {/* Right side: Smart Matching Review Table & Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Warnings Banner */}
              {hasNegativeQty && (
                <div className="bg-red-500/15 border border-red-500/30 p-4 rounded-xl flex gap-3 text-red-400">
                  <span className="material-symbols-outlined text-xl">error</span>
                  <div className="text-xs">
                    <h5 className="font-bold uppercase tracking-wider">Negative Quantity Detected</h5>
                    <p className="mt-0.5 leading-relaxed">
                      One or more products contain negative inventory quantities. Import is blocked until quantities are verified.
                    </p>
                  </div>
                </div>
              )}

              {hasPriceErrors && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 text-amber-400">
                  <span className="material-symbols-outlined text-xl">warning</span>
                  <div className="text-xs">
                    <h5 className="font-bold uppercase tracking-wider">Invalid Price Structure</h5>
                    <p className="mt-0.5 leading-relaxed">
                      Some items have selling prices lower than purchase prices, or missing/invalid prices. Please check highlighted fields.
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Action Banner for Mobile & Desktop */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-primary/10 border border-primary/25 rounded-2xl p-4 shadow-[0_0_20px_rgba(212,175,55,0.08)]">
                <div>
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">verified</span>
                    Ready for Catalog Import
                  </h4>
                  <p className="text-xs text-secondary mt-0.5">
                    {invoiceData.products.length} products parsed and ready to save to database.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCommitImport(false)}
                  disabled={hasNegativeQty}
                  className={`w-full sm:w-auto px-5 py-3 rounded-xl uppercase tracking-wider text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    hasNegativeQty
                      ? "bg-white/5 text-outline cursor-not-allowed border border-white/5"
                      : "bg-primary text-black hover:bg-[#ffe088] shadow-[0_4px_20px_rgba(242,202,80,0.25)] cursor-pointer active:scale-95"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">add_business</span>
                  Add to Catalog & Save
                </button>
              </div>

              <MatchReviewTable 
                products={invoiceData.products} 
                onUpdateProduct={handleUpdateProductInList}
                onEditProduct={(p, idx) => {
                  setEditingProduct(p);
                  setEditingIndex(idx);
                }}
              />
              
              <ImportSummaryCard 
                products={invoiceData.products} 
                supplier={invoiceData.supplier} 
                invoice={invoiceData.invoice}
              />
            </div>
          </div>

          {/* Sticky Bottom Actions Bar (elevated above mobile nav bar with z-50) */}
          <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-72 bg-[#0e0e0e]/95 backdrop-blur-md border-t border-[#4d4635]/25 p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-4 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.7)]">
            <div className="flex gap-2 sm:flex-1">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 min-h-[46px] sm:min-h-[50px] rounded-xl border border-white/10 text-white uppercase tracking-wider text-[11px] sm:text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 min-h-[46px] sm:min-h-[50px] rounded-xl border border-[#ffe088]/20 bg-[#ffe088]/5 text-[#f2ca50] uppercase tracking-wider text-[11px] sm:text-xs font-semibold hover:bg-[#ffe088]/10 transition-all cursor-pointer"
              >
                Review
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleCommitImport(false)}
              disabled={hasNegativeQty}
              className={`w-full sm:flex-[1.5] min-h-[48px] sm:min-h-[50px] rounded-xl uppercase tracking-wider text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                hasNegativeQty 
                  ? "bg-white/5 text-outline cursor-not-allowed border border-white/5" 
                  : "bg-primary text-black hover:bg-[#ffe088] shadow-[0_4px_20px_rgba(242,202,80,0.25)] active:scale-[0.98]"
              }`}
            >
              <span className="material-symbols-outlined text-base">add_business</span>
              Add to Catalog & Save
            </button>
          </div>
        </div>
      )}

      {/* Screen 5: Import Success Report Screen (Phase 4 Final Report) */}
      {viewState === "report" && reportData && (
        <div className="space-y-6 max-w-4xl mx-auto">
          
          {/* Floating Undo Import Countdown Alert Banner */}
          {undoCountdown > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-400 text-2xl">history</span>
                <div>
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Undo Window Active</h5>
                  <p className="text-[10px] text-outline mt-0.5">
                    You can safely rollback this import and restore all previous stock values within the next {formatCountdown(undoCountdown)}.
                  </p>
                </div>
              </div>
              <button
                onClick={handleUndoImport}
                disabled={isUndoing}
                className="px-5 py-2.5 bg-amber-500 text-black uppercase tracking-wider text-[10px] font-black rounded-xl hover:bg-amber-400 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isUndoing ? (
                  <>
                    <span className="animate-spin material-symbols-outlined text-sm">sync</span>
                    Rolling back...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">undo</span>
                    Undo Import ({formatCountdown(undoCountdown)})
                  </>
                )}
              </button>
            </div>
          )}

          {/* Core Report Grid */}
          <div className="bg-[#121212] border border-[#4d4635]/25 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <h3 className="text-xl font-bold uppercase tracking-wider text-on-surface">Invoice Import Successful</h3>
              <p className="text-xs text-outline">Inventory catalogs have been updated in real-time across all active terminals.</p>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Products Scanned</span>
                <span className="text-lg font-bold text-on-surface block mt-1">{reportData.productsImported} Items</span>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Catalog Stock Added</span>
                <span className="text-lg font-bold text-emerald-400 block mt-1">+{reportData.stockIncreased} Units</span>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Total Invoice Value</span>
                <span className="text-lg font-bold text-primary block mt-1">{formatINR(reportData.totalPurchaseValue)}</span>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Stocks Updated</span>
                <span className="text-sm font-semibold text-on-surface block mt-1.5">{reportData.existingUpdated} Products</span>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                <span className="text-[9px] uppercase tracking-wider text-outline block">New Products Created</span>
                <span className="text-sm font-semibold text-blue-400 block mt-1.5">{reportData.newCreated} Products</span>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Import Performance</span>
                <span className="text-sm font-semibold text-on-surface block mt-1.5">{reportData.importDuration}</span>
              </div>
            </div>

            <div className="pt-6 text-center border-t border-white/5 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  if (onGoToCatalog) {
                    onGoToCatalog();
                  } else if (onBack) {
                    onBack();
                  }
                }}
                className="px-8 py-3 rounded-xl bg-primary text-black uppercase tracking-wider text-xs font-bold hover:bg-[#ffe088] transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(242,202,80,0.25)]"
              >
                <span className="material-symbols-outlined text-base">inventory_2</span>
                Go to Catalog / View Products
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 rounded-xl border border-white/10 text-white uppercase tracking-wider text-xs font-semibold hover:bg-white/5 transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">post_add</span>
                Import Another Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Override Confirmation Modal Dialog */}
      {showDuplicateModal && duplicateDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0e0e0e] border border-amber-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto text-amber-400 animate-pulse">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-base font-bold uppercase tracking-wider text-on-surface">Duplicate Invoice Warning</h4>
                <p className="text-xs text-outline leading-relaxed px-2">
                  This supplier invoice has already been successfully imported.
                </p>
              </div>

              {/* Duplicate Details */}
              <div className="p-3 bg-white/[0.02] border border-[#4d4635]/15 rounded-xl text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-outline">Supplier:</span>
                  <span className="font-semibold text-on-surface">{duplicateDetails.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Invoice ID:</span>
                  <span className="font-mono text-on-surface font-semibold">{duplicateDetails.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Import Date:</span>
                  <span className="text-on-surface">
                    {new Date(duplicateDetails.importTime).toLocaleString("en-IN", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex gap-4 justify-center text-xs">
                <button
                  onClick={() => setShowDuplicateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white uppercase tracking-wider text-[10px] font-semibold hover:bg-white/5 cursor-pointer"
                >
                  Cancel Import
                </button>
                <button
                  onClick={() => handleCommitImport(true)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black uppercase tracking-wider text-[10px] font-black hover:bg-amber-400 cursor-pointer"
                >
                  Confirm Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editing Details Modal */}
      {editingProduct && (
        <MatchDetailsModal
          product={editingProduct}
          index={editingIndex}
          catalogProducts={products}
          onSave={handleSaveModalProduct}
          onClose={() => {
            setEditingProduct(null);
            setEditingIndex(-1);
          }}
        />
      )}
    </div>
  );
}
