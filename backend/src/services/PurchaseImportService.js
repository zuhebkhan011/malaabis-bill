const PurchaseHistory = require("../models/PurchaseHistory");
const TransactionManager = require("./TransactionManager");
const InventoryUpdateService = require("./InventoryUpdateService");
const ImportReportService = require("./ImportReportService");
const DuplicateInvoiceChecker = require("./DuplicateInvoiceChecker");
const Supplier = require("../models/Supplier");
const AiLearningService = require("./aiLearningService");

class PurchaseImportService {
  /**
   * Performs the transactional import of invoice details into stock catalogs.
   * @param {object} payload - Structured invoice and matched products data.
   * @param {boolean} overrideDuplicate - True if user wishes to bypass duplicate detection warnings.
   */
  static async importInvoice(payload, overrideDuplicate = false) {
    const startTime = Date.now();
    const { supplier, invoice, products, originalInvoiceImage, originalInvoicePdf, aiExtractedJson, importedBy } = payload;

    if (!supplier || !supplier.name) {
      throw new Error("Supplier Name is required to process imports.");
    }
    const invoiceNum = invoice?.number || supplier?.invoiceNumber;
    if (!invoiceNum) {
      throw new Error("Invoice Number is required to process imports.");
    }

    // 1. Duplicate Check
    if (!overrideDuplicate) {
      const duplicateRecord = await DuplicateInvoiceChecker.checkDuplicate(supplier.name, invoiceNum);
      if (duplicateRecord) {
        const error = new Error("Invoice has already been imported.");
        error.code = "DUPLICATE_INVOICE";
        error.details = {
          id: duplicateRecord._id,
          supplierName: duplicateRecord.supplierName,
          invoiceNumber: duplicateRecord.invoiceNumber,
          importTime: duplicateRecord.importTime,
        };
        throw error;
      }
    }

    // 2. Transaction Run
    const result = await TransactionManager.runInTransaction(async (session) => {
      // Update stock levels and spawn new products
      const { createdProductIds, stockSnapshots } = await InventoryUpdateService.processImportItems(
        products,
        supplier.name,
        session
      );

      // Calculate totals
      const totalItems = products.length;
      const totalAmount = products.reduce(
        (sum, p) => sum + ((Number(p.quantity) || 0) * (Number(p.purchasePrice) || 0)), 
        0
      );

      // Create or Update Supplier profile
      let supplierObj = await Supplier.findOne({ name: { $regex: new RegExp("^" + supplier.name.trim() + "$", "i") } }).session(session);
      if (!supplierObj) {
        supplierObj = new Supplier({
          name: supplier.name.trim(),
          phone: supplier.phone || "",
          address: supplier.address || "",
          gstNumber: supplier.gstNumber || ""
        });
      }

      supplierObj.totalPurchaseValue = Number(supplierObj.totalPurchaseValue || 0) + Number(totalAmount);
      supplierObj.totalInvoices = Number(supplierObj.totalInvoices || 0) + 1;
      
      // Update categories and brands supplied
      const categoriesSet = new Set(supplierObj.categoriesSupplied || []);
      products.forEach(p => { if (p.category) categoriesSet.add(p.category); });
      supplierObj.categoriesSupplied = Array.from(categoriesSet);

      if (supplier.phone) supplierObj.phone = supplier.phone;
      if (supplier.address) supplierObj.address = supplier.address;
      if (supplier.gstNumber) supplierObj.gstNumber = supplier.gstNumber;

      await supplierObj.save({ session });

      // Save user corrections to AI Learning memory
      for (const p of products) {
        if (p.matchStatus === "exact" && p.matchedProductId) {
          await AiLearningService.recordCorrection(p.name, p.matchedProductId, p.matchedProductName);
        }
      }

      // Save to PurchaseHistory collection
      const historyPayload = {
        supplierName: supplierObj.name,
        invoiceNumber: invoiceNum,
        invoiceDate: supplier.invoiceDate ? new Date(supplier.invoiceDate) : new Date(),
        purchaseDate: supplier.purchaseDate ? new Date(supplier.purchaseDate) : new Date(),
        products: products.map(p => ({
          productId: p.matchedProductId || null,
          name: p.name,
          quantity: Number(p.quantity),
          purchasePrice: Number(p.purchasePrice),
          sellingPrice: Number(p.sellingPrice) || undefined,
          mrp: Number(p.mrp) || undefined,
          sku: p.sku || undefined,
          barcode: p.barcode || undefined,
          category: p.category || undefined,
          brand: p.brand || undefined,
          matchStatus: p.matchStatus
        })),
        totalItems,
        totalAmount,
        importedBy: importedBy || "admin",
        originalInvoiceImage: originalInvoiceImage || "",
        originalInvoicePdf: originalInvoicePdf || "",
        aiExtractedJson: aiExtractedJson || JSON.stringify(payload),
        status: "completed",
        stockSnapshots,
        createdProductIds
      };

      const histories = await PurchaseHistory.create([historyPayload], { session });
      const savedHistory = histories[0];

      // Compile report metrics
      const report = ImportReportService.compileReport(products, startTime);

      return {
        purchaseHistoryId: savedHistory._id,
        purchaseHistory: savedHistory,
        report
      };
    });

    return result;
  }

  /**
   * Safely undoes an import if triggered within 5 minutes.
   * @param {string} purchaseHistoryId 
   */
  static async undoImport(purchaseHistoryId) {
    if (!purchaseHistoryId) {
      throw new Error("Missing import history ID.");
    }

    const history = await PurchaseHistory.findById(purchaseHistoryId);
    if (!history) {
      throw new Error("Import history record not found.");
    }

    if (history.status === "undone") {
      throw new Error("This import has already been undone.");
    }

    // Validate 5-minute undo window
    const durationSinceImport = Date.now() - new Date(history.importTime).getTime();
    const fiveMinutesMs = 5 * 60 * 1000;
    if (durationSinceImport > fiveMinutesMs) {
      throw new Error("Undo window expired. Imports can only be undone within 5 minutes.");
    }

    // Execute rollback
    await TransactionManager.runInTransaction(async (session) => {
      // Revert stocks and delete spawned items
      await InventoryUpdateService.rollbackImportItems(
        history.createdProductIds,
        history.stockSnapshots,
        session
      );

      // Revert Supplier metrics
      const supplierObj = await Supplier.findOne({ name: { $regex: new RegExp("^" + history.supplierName.trim() + "$", "i") } }).session(session);
      if (supplierObj) {
        supplierObj.totalPurchaseValue = Math.max(0, Number(supplierObj.totalPurchaseValue || 0) - Number(history.totalAmount));
        supplierObj.totalInvoices = Math.max(0, Number(supplierObj.totalInvoices || 0) - 1);
        await supplierObj.save({ session });
      }

      history.status = "undone";
      history.undoneTime = new Date();
      await history.save({ session });
    });

    return history;
  }
}

module.exports = PurchaseImportService;
