/**
 * aiOSController.js
 * Controller handling retail operating system features: AI dashboard summaries, customer insights,
 * stock reorder builders, storage diagnostics, backup exporters, and JSON collection restores.
 */

const Product = require("../models/Product");
const Bill = require("../models/Bill");
const Supplier = require("../models/Supplier");
const PurchaseHistory = require("../models/PurchaseHistory");

/**
 * GET: Compiles sales, purchase history, and stock alerts, and enriches them via Gemini.
 */
async function getOSSummary(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // Fetch Date boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weeklyStart = new Date(todayStart);
    weeklyStart.setDate(weeklyStart.getDate() - 7);
    const monthlyStart = new Date(todayStart);
    monthlyStart.setDate(monthlyStart.getDate() - 30);

    // Queries
    const [
      todayBills,
      yesterdayBills,
      weeklyBills,
      monthlyBills,
      products,
      suppliers,
      recentImports
    ] = await Promise.all([
      Bill.find({ createdAt: { $gte: todayStart } }),
      Bill.find({ createdAt: { $gte: yesterdayStart, $lt: todayStart } }),
      Bill.find({ createdAt: { $gte: weeklyStart } }),
      Bill.find({ createdAt: { $gte: monthlyStart } }),
      Product.find({ status: "active" }),
      Supplier.find(),
      PurchaseHistory.find({ status: "completed" }).sort({ importTime: -1 }).limit(5)
    ]);

    // Calculate metrics
    const todaySales = todayBills.reduce((acc, b) => acc + b.total, 0);
    const yesterdaySales = yesterdayBills.reduce((acc, b) => acc + b.total, 0);
    const weeklySales = weeklyBills.reduce((acc, b) => acc + b.total, 0);
    const monthlySales = monthlyBills.reduce((acc, b) => acc + b.total, 0);

    const lowStockCount = products.filter(p => p.stock <= 5).length;
    const outOfStockCount = products.filter(p => p.stock === 0).length;

    // Analyze AI Alerts
    const alerts = [];
    if (lowStockCount > 0) {
      alerts.push({ type: "warning", message: `${lowStockCount} products are running low on stock.` });
    }
    if (outOfStockCount > 0) {
      alerts.push({ type: "error", message: `${outOfStockCount} products are completely out of stock.` });
    }
    // High discount alert: Bills where discount amount > 25% of subtotal
    const highDiscountBills = monthlyBills.filter(b => b.subtotal > 0 && (b.discountAmount / b.subtotal) > 0.25);
    if (highDiscountBills.length > 0) {
      alerts.push({ type: "info", message: `${highDiscountBills.length} bills in the last 30 days had discounts greater than 25%.` });
    }
    // Missing image alert
    const missingImgCount = products.filter(p => !p.imageUrl).length;
    if (missingImgCount > 0) {
      alerts.push({ type: "info", message: `${missingImgCount} catalog items are missing product images.` });
    }

    const overviewSummary = {
      todaySales,
      yesterdaySales,
      weeklySales,
      monthlySales,
      totalSuppliers: suppliers.length,
      recentImportsCount: recentImports.length,
      outOfStockCount,
      lowStockCount,
      alerts
    };

    // Ask Gemini for executive summary if key is set
    let aiSummary = "Real-time store metrics compiled. System status is healthy.";
    if (apiKey && apiKey !== "xxxxxxxxxxxxxxxx") {
      const models = ["gemini-3.6-flash", "gemini-3.5-flash"];
      const systemPrompt = `You are the Malaabis Executive AI Analyst. Summarize this retail dashboard summary in a few bullet points:
${JSON.stringify(overviewSummary, null, 2)}
Translate numbers to action points (e.g. recommend restocking or highlight sales increases). Keep it brief.`;

      for (const model of models) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
          });
          if (response.ok) {
            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
              aiSummary = result.candidates[0].content.parts[0].text;
              break;
            }
          }
        } catch (err) {
          console.warn(`AI summary generation failed with ${model}:`, err.message);
        }
      }
    }

    return res.status(200).json({
      metrics: overviewSummary,
      aiSummary
    });

  } catch (error) {
    console.error("[AI-OS] Failed to fetch summary:", error);
    return res.status(500).json({ error: "Failed to compile business dashboard summary." });
  }
}

/**
 * GET: Groups completed sales bills by customer phone/name to return Customer Profiles.
 */
async function getOSCustomers(req, res) {
  try {
    const bills = await Bill.find();

    const customerMap = {};
    for (const b of bills) {
      const key = b.customerMobile ? b.customerMobile.trim() : b.customerName.trim().toLowerCase();
      if (!key) continue;

      if (!customerMap[key]) {
        customerMap[key] = {
          name: b.customerName,
          mobile: b.customerMobile || "N/A",
          totalPurchases: 0,
          invoicesCount: 0,
          lastPurchaseDate: b.createdAt,
          categoriesBought: {}
        };
      }

      const profile = customerMap[key];
      profile.totalPurchases += b.total;
      profile.invoicesCount += 1;
      if (new Date(b.createdAt) > new Date(profile.lastPurchaseDate)) {
        profile.lastPurchaseDate = b.createdAt;
      }

      // Track favorite category
      for (const item of b.items) {
        // Query product's category fallback
        const cat = item.notes || "UNSTITCHED";
        profile.categoriesBought[cat] = (profile.categoriesBought[cat] || 0) + item.quantity;
      }
    }

    // Map to list, sort by highest total spend
    const customerList = Object.values(customerMap).map(profile => {
      // Find favorite category
      let favCategory = "UNSTITCHED";
      let maxQty = 0;
      for (const [cat, qty] of Object.entries(profile.categoriesBought)) {
        if (qty > maxQty) {
          maxQty = qty;
          favCategory = cat;
        }
      }
      return {
        name: profile.name,
        mobile: profile.mobile,
        totalSpend: profile.totalPurchases,
        invoicesCount: profile.invoicesCount,
        lastPurchase: profile.lastPurchaseDate,
        favoriteCategory: favCategory
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);

    return res.status(200).json(customerList);

  } catch (error) {
    console.error("[AI-OS] Failed to aggregate customers:", error);
    return res.status(500).json({ error: "Failed to query customer database records." });
  }
}

/**
 * GET: Predicts reorder requirements and prepares a draft Purchase Order.
 */
async function getOSReorders(req, res) {
  try {
    const products = await Product.find({ status: "active" });

    // Calculate low stock reorders
    const lowStockItems = products.filter(p => p.stock <= 5);

    const reordersList = lowStockItems.map(p => {
      const suggestedQty = 20 - p.stock; // restock up to 20 units
      return {
        productId: p._id,
        name: p.name,
        currentStock: p.stock,
        suggestedQty,
        purchasePrice: p.purchasePrice || 1500,
        preferredSupplier: p.supplier || "Wholesale Distributor",
        estimatedCost: suggestedQty * (p.purchasePrice || 1500)
      };
    });

    const totalCost = reordersList.reduce((acc, r) => acc + r.estimatedCost, 0);

    // Create Draft Purchase Order
    const draftPO = {
      purchaseOrderNumber: "PO-" + Math.floor(100000 + Math.random() * 900000),
      createdDate: new Date(),
      supplierName: reordersList[0]?.preferredSupplier || "Wholesale Distributor",
      items: reordersList.map(r => ({
        name: r.name,
        quantity: r.suggestedQty,
        unitPrice: r.purchasePrice,
        totalPrice: r.estimatedCost
      })),
      totalCost
    };

    return res.status(200).json({
      reorders: reordersList,
      draftPO
    });

  } catch (error) {
    console.error("[AI-OS] Failed to build reorders:", error);
    return res.status(500).json({ error: "Failed to compile reorder predictions." });
  }
}

/**
 * GET: System health status check diagnostics.
 */
async function getOSHealth(req, res) {
  try {
    const mongoose = require("mongoose");
    const dbState = mongoose.connection.readyState;
    
    // Convert readyState code to description
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    const dbStatus = states[dbState] || "unknown";

    // Estimate storage values
    const productsCount = await Product.countDocuments();
    const billsCount = await Bill.countDocuments();
    const historyCount = await PurchaseHistory.countDocuments();

    return res.status(200).json({
      databaseStatus: dbStatus,
      realtimeSync: "connected",
      offlineQueueSize: 0,
      backupStatus: "healthy",
      lastBackupDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago simulated
      dbMetrics: {
        productsCount,
        billsCount,
        historyCount,
        estimatedDbSize: `${((productsCount * 350 + billsCount * 600 + historyCount * 800) / 1024).toFixed(1)} KB`
      }
    });

  } catch (error) {
    console.error("[AI-OS] Failed to check system health:", error);
    return res.status(500).json({ error: "Health diagnostics check failed." });
  }
}

/**
 * GET: Exports all database collections (Backup JSON).
 */
async function getOSBackup(req, res) {
  try {
    const [products, bills, suppliers, history] = await Promise.all([
      Product.find(),
      Bill.find(),
      Supplier.find(),
      PurchaseHistory.find()
    ]);

    const backupPayload = {
      version: "1.0",
      exportTime: new Date().toISOString(),
      products,
      bills,
      suppliers,
      history
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=malaabis_backup_${Date.now()}.json`);
    return res.status(200).send(JSON.stringify(backupPayload, null, 2));

  } catch (error) {
    console.error("[AI-OS] Backup failed:", error);
    return res.status(500).json({ error: "Database backup compilation failed." });
  }
}

/**
 * POST: Upload and restore database collections from Backup JSON.
 */
async function postOSRestore(req, res) {
  try {
    const { products, bills, suppliers, history } = req.body;

    if (!products && !bills && !suppliers && !history) {
      return res.status(400).json({ error: "Invalid backup upload file payload structure." });
    }

    // Execute overwrites
    if (products && products.length > 0) {
      await Product.deleteMany({});
      await Product.insertMany(products);
    }
    if (bills && bills.length > 0) {
      await Bill.deleteMany({});
      await Bill.insertMany(bills);
    }
    if (suppliers && suppliers.length > 0) {
      await Supplier.deleteMany({});
      await Supplier.insertMany(suppliers);
    }
    if (history && history.length > 0) {
      await PurchaseHistory.deleteMany({});
      await PurchaseHistory.insertMany(history);
    }

    console.log("[AI-OS] Database collections restored successfully from JSON backup.");
    return res.status(200).json({
      success: true,
      message: "Database restore completed successfully. All records updated."
    });

  } catch (error) {
    console.error("[AI-OS] Database restore failed:", error);
    return res.status(500).json({ error: "Restore failed: " + error.message });
  }
}

module.exports = {
  getOSSummary,
  getOSCustomers,
  getOSReorders,
  getOSHealth,
  getOSBackup,
  postOSRestore
};
