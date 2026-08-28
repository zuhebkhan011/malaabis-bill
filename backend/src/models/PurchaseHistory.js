const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number },
  mrp: { type: Number },
  sku: { type: String },
  barcode: { type: String },
  category: { type: String },
  brand: { type: String },
  matchStatus: { type: String, enum: ["exact", "similar", "new"] }
});

const stockSnapshotSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  previousStock: { type: Number, required: true },
  importedQty: { type: Number, required: true }
}, { _id: false });

const purchaseHistorySchema = new mongoose.Schema(
  {
    supplierName: { type: String, required: true },
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    purchaseDate: { type: Date, required: true },
    products: [purchaseItemSchema],
    totalItems: { type: Number, required: true }, // unique products count
    totalAmount: { type: Number, required: true }, // total estimated purchase cost
    importTime: { type: Date, default: Date.now },
    importedBy: { type: String, default: "admin" },
    originalInvoiceImage: { type: String }, // base64 string
    originalInvoicePdf: { type: String },   // base64 string or filename
    aiExtractedJson: { type: String },      // raw stringified JSON output from AI
    status: {
      type: String,
      enum: ["completed", "undone"],
      default: "completed"
    },
    undoneTime: { type: Date },
    stockSnapshots: [stockSnapshotSchema],
    createdProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseHistory", purchaseHistorySchema);
