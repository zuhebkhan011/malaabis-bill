const PurchaseHistory = require("../models/PurchaseHistory");

class PriceIntelligenceService {
  /**
   * Compares the current purchase price against history to detect reduction deals or steep hikes.
   * @param {string} productId - Mapped product ID in catalog.
   * @param {string} productName - Extracted product name.
   * @param {number} currentPrice - Current invoice purchase price.
   */
  static async analyzePrice(productId, productName, currentPrice) {
    if (!currentPrice || currentPrice <= 0) {
      return { lastPurchasePrice: 0, priceDiff: 0, alertType: "normal", message: "" };
    }

    let lastRecord = null;
    let lastItem = null;

    // 1. Search by productId reference
    if (productId) {
      lastRecord = await PurchaseHistory.findOne({
        status: "completed",
        "products.productId": productId
      }).sort({ importTime: -1 });

      if (lastRecord) {
        lastItem = lastRecord.products.find(
          p => p.productId && p.productId.toString() === productId.toString()
        );
      }
    }

    // 2. Fallback search by name matches
    if (!lastItem && productName) {
      lastRecord = await PurchaseHistory.findOne({
        status: "completed",
        "products.name": { $regex: new RegExp("^" + productName.trim() + "$", "i") }
      }).sort({ importTime: -1 });

      if (lastRecord) {
        lastItem = lastRecord.products.find(
          p => p.name.trim().toLowerCase() === productName.trim().toLowerCase()
        );
      }
    }

    if (!lastItem || !lastItem.purchasePrice) {
      return { lastPurchasePrice: 0, priceDiff: 0, alertType: "normal", message: "" };
    }

    const lastPrice = Number(lastItem.purchasePrice);
    const diff = Number(currentPrice) - lastPrice;

    if (diff > 0) {
      const hikePercent = (diff / lastPrice) * 100;
      if (hikePercent >= 20.0) {
        return {
          lastPurchasePrice: lastPrice,
          priceDiff: diff,
          alertType: "abnormal",
          message: `Price unusually high (+${hikePercent.toFixed(0)}%). Please verify.`
        };
      } else {
        return {
          lastPurchasePrice: lastPrice,
          priceDiff: diff,
          alertType: "increase",
          message: `Purchase price increased by ₹${diff}.`
        };
      }
    } else if (diff < 0) {
      const absDiff = Math.abs(diff);
      return {
        lastPurchasePrice: lastPrice,
        priceDiff: diff,
        alertType: "decrease",
        message: `Price Reduced (₹${absDiff} drop). Good Purchase Opportunity.`
      };
    }

    return {
      lastPurchasePrice: lastPrice,
      priceDiff: 0,
      alertType: "normal",
      message: ""
    };
  }
}

module.exports = PriceIntelligenceService;
