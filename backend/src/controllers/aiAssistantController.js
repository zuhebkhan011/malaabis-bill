/**
 * aiAssistantController.js
 * Handles natural language store inquiries using real-time MongoDB database state.
 * Invokes Gemini 1.5 Flash securely with structured data context.
 */

const Product = require("../models/Product");
const Bill = require("../models/Bill");
const Supplier = require("../models/Supplier");
const PurchaseHistory = require("../models/PurchaseHistory");

async function handleChat(req, res) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "xxxxxxxxxxxxxxxx") {
      return res.status(500).json({
        error: "API Key Configuration Error: GEMINI_API_KEY is not configured in the backend .env configuration file."
      });
    }

    console.log(`[AI-Assistant] Compiling store database aggregates for query: "${message}"...`);

    // 1. Fetch Store Snapshots
    const products = await Product.find({ status: "active" });
    const suppliers = await Supplier.find();
    
    // Fetch today's sales bills
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayBills = await Bill.find({ createdAt: { $gte: startOfToday } });
    
    // Fetch recent completed imports
    const purchaseLogs = await PurchaseHistory.find({ status: "completed" }).sort({ importTime: -1 }).limit(10);
    
    // Calculate aggregate metrics
    const totalInventoryStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const todayRevenue = todayBills.reduce((acc, b) => acc + (b.total || 0), 0);
    const todayInvoicesCount = todayBills.length;
    
    // Find biggest sale today
    let biggestSaleToday = 0;
    for (const b of todayBills) {
      if (b.total > biggestSaleToday) biggestSaleToday = b.total;
    }

    // Compile database context for Gemini
    const dbContext = {
      currentTime: new Date().toISOString(),
      inventorySummary: {
        totalProductsCount: products.length,
        totalStockUnits: totalInventoryStock,
        categories: Array.from(new Set(products.map(p => p.category || "UNSTITCHED"))),
        lowStockItems: products
          .filter(p => p.stock <= 5)
          .map(p => ({ name: p.name, stock: p.stock, sku: p.sku || "N/A" }))
      },
      salesToday: {
        totalInvoicesCreated: todayInvoicesCount,
        revenueSumINR: todayRevenue,
        biggestSaleINR: biggestSaleToday
      },
      suppliersDirectory: suppliers.map(s => ({
        name: s.name,
        totalInvoices: s.totalInvoices,
        totalPurchaseValue: s.totalPurchaseValue
      })),
      recentPurchaseImports: purchaseLogs.map(log => ({
        supplier: log.supplierName,
        invoiceNumber: log.invoiceNumber,
        importTime: log.importTime,
        totalAmount: log.totalAmount,
        itemsCount: log.products.length
      })),
      productsCatalogDetails: products.slice(0, 25).map(p => ({
        name: p.name,
        stock: p.stock,
        sellingPrice: p.price,
        purchasePrice: p.purchasePrice || "N/A",
        sku: p.sku || "N/A",
        barcode: p.barcode || "N/A"
      }))
    };

    // 2. Build AI Assistant System Prompt
    const systemPrompt = `You are the Malaabis AI Store Manager Assistant, an expert business analyst and retail manager.
Your job is to answer questions about the store's operations, inventory, sales, suppliers, and billing using ONLY the provided real-time database snapshot.

Business Data Snapshot:
${JSON.stringify(dbContext, null, 2)}

Rules:
- NEVER perform, mention, or suggest write operations. You are read-only and cannot delete or modify products, stocks, or invoices.
- Translate raw numbers into meaningful, concise retail business answers.
- Format prices in standard Indian Rupees (₹) format (e.g. ₹2,799).
- Generate short business insights (e.g. "Stock is healthy" or "Sales represent an increase" or "Supplier spend is high").
- Keep responses concise and structured using bullet points where appropriate.
- Include a smart follow-up question at the end (e.g. "Would you like to review stock predictions or check today's sales trend?").
- Respond in natural English.

User's Inquire:
"${message}"`;

    // 3. Invoke Gemini REST API with automated fallback
    const models = ["gemini-3.6-flash", "gemini-3.5-flash"];
    let assistantResponse = null;
    let lastError = null;

    for (const model of models) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        });

        if (response.ok) {
          const result = await response.json();
          assistantResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (assistantResponse) break;
        } else {
          const errText = await response.text();
          lastError = new Error(`Gemini AI (${model}) status ${response.status}: ${errText}`);
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!assistantResponse) {
      throw lastError || new Error("Failed to get response from Gemini AI assistant.");
    }

    console.log("[AI-Assistant] Inquiry processed successfully.");
    return res.status(200).json({ answer: assistantResponse });

  } catch (error) {
    console.error("[AI-Assistant] Assistant chat error:", error);
    
    let friendlyMessage = error.message;
    if (error.message.includes("fetch failed") || error.message.includes("ENOTFOUND")) {
      friendlyMessage = "Network Connection Error: Unable to contact AI servers. Please verify active internet connection.";
    }

    return res.status(500).json({ error: friendlyMessage || "Failed to process chat inquire." });
  }
}

module.exports = {
  handleChat
};
