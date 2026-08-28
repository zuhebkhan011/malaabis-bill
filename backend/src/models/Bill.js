const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discountType: {
      type: String,
      enum: ["none", "flat", "percent"],
      default: "none",
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    isManual: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
    lineTotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    clientId: {
      type: String,
      unique: true,
      sparse: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerMobile: {
      type: String,
    },
    items: {
      type: [billItemSchema],
      required: true,
      validate: [(items) => items.length > 0, "Bill must have at least one item"],
    },
    subtotal: {
      type: Number,
      required: true,
    },
    gstRate: {
      type: Number,
      default: 0.17,
    },
    gstAmount: {
      type: Number,
      required: true,
    },
    discountType: {
      type: String,
      enum: ["none", "flat", "percent"],
      default: "none",
    },
    discountValue: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "CARD"],
      required: true,
    },
    cashReceived: {
      type: Number,
      default: 0,
    },
    cashChange: {
      type: Number,
      default: 0,
    },
    pdfData: {
      type: String,
      default: "",
    },
    revisions: [
      {
        originalAmount: { type: Number, required: true },
        updatedAmount: { type: Number, required: true },
        user: { type: String, required: true },
        date: { type: Date, default: Date.now },
        changesMade: { type: [String], required: true }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);