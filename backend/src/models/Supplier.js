const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    brand: { type: String, trim: true },
    categoriesSupplied: [{ type: String, trim: true }],
    totalPurchaseValue: { type: Number, default: 0 },
    totalInvoices: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
