const PurchaseHistory = require("../models/PurchaseHistory");

class DuplicateInvoiceChecker {
  /**
   * Checks if an invoice has already been successfully imported.
   * @param {string} supplierName 
   * @param {string} invoiceNumber 
   * @returns {Promise<object|null>} The duplicate PurchaseHistory record if found, else null.
   */
  static async checkDuplicate(supplierName, invoiceNumber) {
    if (!supplierName || !invoiceNumber) return null;

    // Search for active (completed) imports matching supplier & invoice number case-insensitively
    const duplicate = await PurchaseHistory.findOne({
      supplierName: { $regex: new RegExp("^" + supplierName.trim() + "$", "i") },
      invoiceNumber: { $regex: new RegExp("^" + invoiceNumber.trim() + "$", "i") },
      status: "completed"
    });

    return duplicate;
  }
}

module.exports = DuplicateInvoiceChecker;
