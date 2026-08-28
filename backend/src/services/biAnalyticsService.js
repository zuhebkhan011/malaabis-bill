const PurchaseHistory = require("../models/PurchaseHistory");
const Supplier = require("../models/Supplier");
const Product = require("../models/Product");
const Bill = require("../models/Bill");

class BiAnalyticsService {
  /**
   * Compiles complete business intelligence metrics for the dashboard.
   */
  static async getDashboardAnalytics() {
    const history = await PurchaseHistory.find({ status: "completed" });
    const suppliersList = await Supplier.find().sort({ totalPurchaseValue: -1 });

    // 1. Calculate general stats
    let totalPurchaseVal = 0;
    let highestVal = 0;
    let lowestVal = Number.MAX_VALUE;
    let totalProductsCount = 0;

    for (const log of history) {
      totalPurchaseVal += log.totalAmount;
      if (log.totalAmount > highestVal) highestVal = log.totalAmount;
      if (log.totalAmount < lowestVal) lowestVal = log.totalAmount;
      totalProductsCount += log.products.length;
    }
    if (lowestVal === Number.MAX_VALUE) lowestVal = 0;

    const avgInvoiceVal = history.length ? Math.round(totalPurchaseVal / history.length) : 0;

    // 2. Monthly Spend Trend (last 6 months)
    const monthlySpendMap = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleString("en-US", { month: "short" }) + " " + d.getFullYear().toString().slice(-2);
      monthlySpendMap[key] = 0;
    }

    for (const log of history) {
      const key = new Date(log.importTime).toLocaleString("en-US", { month: "short" }) + " " + new Date(log.importTime).getFullYear().toString().slice(-2);
      if (monthlySpendMap[key] !== undefined) {
        monthlySpendMap[key] += log.totalAmount;
      }
    }

    const monthlyTrends = Object.keys(monthlySpendMap).map(k => ({
      month: k,
      amount: monthlySpendMap[k]
    }));

    // 3. Top Suppliers Ranking
    const topSuppliers = suppliersList.slice(0, 5).map(s => ({
      name: s.name,
      totalSpend: s.totalPurchaseValue,
      invoicesCount: s.totalInvoices
    }));

    // 4. Most Purchased Products (Aggregated quantity)
    const productQtyMap = {};
    for (const log of history) {
      for (const prod of log.products) {
        productQtyMap[prod.name] = (productQtyMap[prod.name] || 0) + prod.quantity;
      }
    }

    const mostPurchasedProducts = Object.keys(productQtyMap)
      .map(name => ({ name, quantity: productQtyMap[name] }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 5. Low Stock Prediction (Sales Velocity based)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBills = await Bill.find({ createdAt: { $gte: thirtyDaysAgo } });

    const salesQtyMap = {};
    for (const bill of recentBills) {
      for (const item of bill.items) {
        if (item.product) {
          const idStr = item.product.toString();
          salesQtyMap[idStr] = (salesQtyMap[idStr] || 0) + item.quantity;
        }
      }
    }

    const activeProducts = await Product.find({ status: "active" });
    const lowStockPredictions = [];

    for (const prod of activeProducts) {
      const sold30 = salesQtyMap[prod._id.toString()] || 0;
      const weeklySales = Math.ceil(sold30 / 4) || 0;
      const threshold = Math.max(5, weeklySales);

      if (prod.stock <= threshold) {
        lowStockPredictions.push({
          productId: prod._id,
          name: prod.name,
          currentStock: prod.stock,
          avgWeeklySales: weeklySales || 1,
          recommendation: prod.stock === 0 ? "Out of Stock - Reorder immediately" : "Low Stock - Reorder soon"
        });
      }
    }

    // Sort predictions (reorder priority: lowest stock first)
    lowStockPredictions.sort((a, b) => a.currentStock - b.currentStock);

    // 6. Smart Purchase Suggestions
    const suggestions = [];
    
    // Add top low stock items to suggestions
    lowStockPredictions.slice(0, 3).forEach(item => {
      suggestions.push({
        type: "reorder",
        title: `Reorder ${item.name}`,
        desc: `Sales rate is ${item.avgWeeklySales} units/week, but only ${item.currentStock} remain.`,
        priority: item.currentStock === 0 ? "high" : "medium"
      });
    });

    // Add recent price drops as deal recommendations
    const recentDeals = [];
    for (const log of history.slice(-5)) { // look at last 5 imports
      for (const p of log.products) {
        if (p.purchasePrice && p.sellingPrice) {
          // If selling price has > 40% gross margins
          const margin = ((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100;
          if (margin >= 40) {
            recentDeals.push({ name: p.name, margin: margin.toFixed(0), supplier: log.supplierName });
          }
        }
      }
    }
    recentDeals.slice(0, 2).forEach(deal => {
      suggestions.push({
        type: "deal",
        title: `High Margin Opportunity: ${deal.name}`,
        desc: `Yields ${deal.margin}% margin from supplier "${deal.supplier}". Consider increasing orders.`,
        priority: "medium"
      });
    });

    return {
      stats: {
        totalSpend: totalPurchaseVal,
        avgInvoiceValue: avgInvoiceVal,
        highestInvoiceValue: highestVal,
        lowestInvoiceValue: lowestVal === Number.MAX_VALUE ? 0 : lowestVal,
      },
      monthlyTrends,
      topSuppliers,
      mostPurchasedProducts,
      lowStockPredictions: lowStockPredictions.slice(0, 6),
      suggestions: suggestions.slice(0, 5)
    };
  }
}

module.exports = BiAnalyticsService;
