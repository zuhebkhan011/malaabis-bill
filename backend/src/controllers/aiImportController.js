/**
 * aiImportController.js
 * Controller handling request routing, parameter extraction, service invocation, and structured validation.
 * Integrates direct Gemini AI parser, smart product matching, duplicate checkers, transactional import commits, and undo rollbacks.
 * Enriched with AI correction learning, price drop warnings, reorder suggestions, and global analytics aggregates.
 */

const { extractInvoiceData } = require("../services/geminiService");
const { validateAndSanitizeInvoice } = require("../utils/jsonValidator");
const PurchaseImportService = require("../services/PurchaseImportService");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const PurchaseHistory = require("../models/PurchaseHistory");
const AiLearningService = require("../services/aiLearningService");
const PriceIntelligenceService = require("../services/priceIntelligenceService");
const BiAnalyticsService = require("../services/biAnalyticsService");

/**
 * Calculates Sørensen-Dice coefficient similarity between two strings (value 0.0 to 1.0).
 */
function getDiceSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);
  let intersection = 0;
  for (const val of bigrams1) {
    if (bigrams2.has(val)) {
      intersection++;
    }
  }
  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

/**
 * Analyzes uploaded invoice file, parses with AI, fuzzy matches against catalog, and enriches with price analysis and AI learning memory.
 */
async function analyzeInvoice(req, res) {
  try {
    let fileBuffer;
    let mimeType;
    let fileName;

    if (req.file) {
      fileBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      fileName = req.file.originalname;
    } else {
      const { fileData, mimeType: bodyMime, fileName: bodyName } = req.body;
      if (!fileData) {
        return res.status(400).json({ error: "Missing file data payload" });
      }
      fileBuffer = Buffer.from(fileData.includes(";base64,") ? fileData.split(";base64,").pop() : fileData, "base64");
      mimeType = bodyMime;
      fileName = bodyName;
    }

    if (!mimeType) {
      return res.status(400).json({ error: "Missing file mimeType" });
    }

    const supportedMimes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!supportedMimes.includes(mimeType)) {
      return res.status(400).json({
        error: `Unsupported file type: ${mimeType}. Please upload a JPEG, PNG, or PDF invoice.`,
      });
    }

    console.log(`[AI-Import] Received file ${fileName || "document"} (${mimeType}) for processing...`);

    // Call Gemini API with buffer or clean base64
    const rawAiResponseText = await extractInvoiceData(fileBuffer, mimeType);
    
    // Parse and Validate JSON
    let sanitizedData;
    try {
      sanitizedData = validateAndSanitizeInvoice(rawAiResponseText);
    } catch (parseError) {
      console.error("[AI-Import] JSON validation failed for raw text:", rawAiResponseText);
      return res.status(422).json({
        error: "AI extraction returned malformed JSON. Please try uploading again or verify file quality.",
        details: parseError.message,
      });
    }

    // Smart Matching & Pricing Intelligence Stage
    console.log("[AI-Import] Performing smart matching and pricing analytics...");
    const existingProducts = await Product.find({ status: "active" });

    const matchedProducts = await Promise.all(sanitizedData.products.map(async (p) => {
      let matchStatus = "new";
      let matchedProduct = null;

      // 1. AI Override Learned mapping lookup
      const learnedProduct = await AiLearningService.getLearnedMapping(p.name);
      if (learnedProduct) {
        matchedProduct = learnedProduct;
        matchStatus = "exact";
      }

      // 2. SKU Match (exact, case-insensitive)
      if (!matchedProduct && p.sku) {
        matchedProduct = existingProducts.find(
          dbProd => dbProd.sku && dbProd.sku.trim().toLowerCase() === p.sku.trim().toLowerCase()
        );
        if (matchedProduct) matchStatus = "exact";
      }

      // 3. Exact Name Match
      if (!matchedProduct) {
        matchedProduct = existingProducts.find(
          dbProd => dbProd.name.trim().toLowerCase() === p.name.trim().toLowerCase()
        );
        if (matchedProduct) matchStatus = "exact";
      }

      // 4. Fuzzy Name Match using Dice coefficient (threshold = 0.60)
      if (!matchedProduct) {
        let bestScore = 0;
        let bestMatch = null;

        for (const dbProd of existingProducts) {
          const score = getDiceSimilarity(p.name, dbProd.name);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = dbProd;
          }
        }

        if (bestScore >= 0.60) {
          matchedProduct = bestMatch;
          matchStatus = "similar";
        }
      }

      // 5. Price analysis (hikes, drops, warnings)
      const pId = matchedProduct ? matchedProduct._id.toString() : null;
      const pName = matchedProduct ? matchedProduct.name : p.name;
      const priceAnalysis = await PriceIntelligenceService.analyzePrice(pId, pName, p.purchasePrice);

      return {
        ...p,
        matchStatus,
        matchedProductId: pId,
        matchedProductName: matchedProduct ? matchedProduct.name : null,
        currentStock: matchedProduct ? matchedProduct.stock : 0,
        originalPrice: matchedProduct ? matchedProduct.price : 0,
        imageUrl: matchedProduct ? matchedProduct.imageUrl : "",
        priceAnalysis
      };
    }));

    sanitizedData.products = matchedProducts;

    // Check if supplier name is recognized in existing Supplier directory
    const matchedSupplier = await Supplier.findOne({
      name: { $regex: new RegExp("^" + sanitizedData.supplier.name.trim() + "$", "i") }
    });
    sanitizedData.supplier.isRecognized = !!matchedSupplier;

    console.log(`[AI-Import] Analysis completed successfully. Mapped ${matchedProducts.filter(x => x.matchStatus === 'exact').length} products.`);
    return res.status(200).json(sanitizedData);

  } catch (error) {
    console.error("[AI-Import] Error occurred during invoice analysis:", error);
    return res.status(500).json({ error: error.message || "Failed to parse invoice." });
  }
}

/**
 * Commits verified invoice and products payload to inventory database.
 */
async function commitImport(req, res) {
  try {
    const { overrideDuplicate } = req.body;
    
    // Process Import
    const result = await PurchaseImportService.importInvoice(req.body, overrideDuplicate);

    // Emit Real-time Sync Socket Events
    if (req.io) {
      console.log("[AI-Import] Broadcasting real-time updates via Socket.IO...");

      for (const snap of result.purchaseHistory.stockSnapshots) {
        const prod = await Product.findById(snap.productId);
        if (prod) {
          req.io.emit("stock-updated", { productId: prod._id, stock: prod.stock });
          req.io.emit("product-updated", prod);
        }
      }

      for (const prodId of result.purchaseHistory.createdProductIds) {
        const prod = await Product.findById(prodId);
        if (prod) {
          req.io.emit("product-created", prod);
        }
      }

      req.io.emit("reports-updated");
    }

    return res.status(200).json({
      success: true,
      purchaseHistoryId: result.purchaseHistoryId,
      report: result.report
    });

  } catch (error) {
    console.error("[AI-Import] Commit failed:", error);

    if (error.code === "DUPLICATE_INVOICE") {
      return res.status(409).json({
        error: error.message,
        code: "DUPLICATE_INVOICE",
        details: error.details
      });
    }

    return res.status(500).json({ error: error.message || "Failed to commit invoice import." });
  }
}

/**
 * Safely undoes an import session within the 5-minute cooldown.
 */
async function undoImport(req, res) {
  try {
    const { purchaseHistoryId } = req.body;
    
    const undoneHistory = await PurchaseImportService.undoImport(purchaseHistoryId);

    // Emit Real-time Rollback Socket Events
    if (req.io && undoneHistory) {
      console.log("[AI-Import] Broadcasting real-time rollbacks via Socket.IO...");

      for (const snap of undoneHistory.stockSnapshots) {
        const prod = await Product.findById(snap.productId);
        if (prod) {
          req.io.emit("stock-updated", { productId: prod._id, stock: prod.stock });
          req.io.emit("product-updated", prod);
        }
      }

      for (const prodId of undoneHistory.createdProductIds) {
        req.io.emit("product-deleted", { id: prodId.toString() });
      }

      req.io.emit("reports-updated");
    }

    return res.status(200).json({
      success: true,
      message: "Import successfully undone. Stocks restored and new products deleted."
    });

  } catch (error) {
    console.error("[AI-Import] Undo failed:", error);
    return res.status(400).json({ error: error.message || "Failed to undo invoice import." });
  }
}

/**
 * GET: Fetches BI dashboard analytics (spends, supplier rankings, reorder triggers, suggestions).
 */
async function getBIAnalytics(req, res) {
  try {
    const analytics = await BiAnalyticsService.getDashboardAnalytics();
    return res.status(200).json(analytics);
  } catch (error) {
    console.error("[AI-Import] Failed to load BI analytics:", error);
    return res.status(500).json({ error: "Failed to compile BI analytics dashboard statistics." });
  }
}

/**
 * GET: Lists all suppliers.
 */
async function getSuppliers(req, res) {
  try {
    const list = await Supplier.find().sort({ name: 1 });
    return res.status(200).json(list);
  } catch (error) {
    console.error("[AI-Import] Failed to fetch suppliers:", error);
    return res.status(500).json({ error: "Failed to query suppliers catalog." });
  }
}

/**
 * GET: Retrieves a specific supplier's profile dashboard details and history records.
 */
async function getSupplierProfile(req, res) {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier profile not found." });
    }

    const purchaseHistory = await PurchaseHistory.find({
      supplierName: { $regex: new RegExp("^" + supplier.name.trim() + "$", "i") },
      status: "completed"
    }).sort({ importTime: -1 });

    return res.status(200).json({
      supplier,
      purchaseHistory
    });

  } catch (error) {
    console.error("[AI-Import] Failed to fetch supplier profile:", error);
    return res.status(500).json({ error: "Failed to compile supplier profile details." });
  }
}

/**
 * GET: Query search across history invoices, suppliers, or products.
 */
async function searchBI(req, res) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(200).json({ logs: [], suppliers: [], products: [] });
    }

    const cleanQuery = q.trim();

    // 1. Search completed invoices
    const logs = await PurchaseHistory.find({
      status: "completed",
      $or: [
        { supplierName: { $regex: cleanQuery, $options: "i" } },
        { invoiceNumber: { $regex: cleanQuery, $options: "i" } },
        { "products.name": { $regex: cleanQuery, $options: "i" } }
      ]
    }).sort({ importTime: -1 }).limit(10);

    // 2. Search suppliers
    const suppliers = await Supplier.find({
      $or: [
        { name: { $regex: cleanQuery, $options: "i" } },
        { brand: { $regex: cleanQuery, $options: "i" } },
        { categoriesSupplied: { $regex: cleanQuery, $options: "i" } }
      ]
    }).limit(5);

    // 3. Search catalog products
    const products = await Product.find({
      status: "active",
      $or: [
        { name: { $regex: cleanQuery, $options: "i" } },
        { sku: { $regex: cleanQuery, $options: "i" } },
        { barcode: { $regex: cleanQuery, $options: "i" } },
        { category: { $regex: cleanQuery, $options: "i" } }
      ]
    }).limit(10);

    return res.status(200).json({
      logs,
      suppliers,
      products
    });

  } catch (error) {
    console.error("[AI-Import] Global BI Search failed:", error);
    return res.status(500).json({ error: "Failed to execute global search." });
  }
}

module.exports = {
  analyzeInvoice,
  commitImport,
  undoImport,
  getBIAnalytics,
  getSuppliers,
  getSupplierProfile,
  searchBI
};
