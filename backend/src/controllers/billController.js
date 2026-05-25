const Bill = require("../models/Bill");
const Product = require("../models/Product");

const buildInvoiceNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MS-${timestamp}-${randomSuffix}`;
};

const createBill = async (req, res) => {
  const stockChanges = [];

  try {
    // Idempotency: if client supplied a clientId for offline sync, return existing bill if present
    if (req.body.clientId) {
      const existing = await Bill.findOne({ clientId: req.body.clientId });
      if (existing) return res.status(200).json(existing);
    }
    const {
      clientId,
      customerName,
      customerMobile,
      items = [],
      subtotal,
      gstRate = 0.17,
      gstAmount,
      discountType = "none",
      discountValue = 0,
      discountAmount = 0,
      total,
      paymentMethod,
      cashReceived = 0,
      cashChange = 0,
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ message: "Bill items are required" });
    }

    if (!customerName || !paymentMethod) {
      return res.status(400).json({ message: "Customer name and payment method are required" });
    }

    const normalizedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);

      if (!product) {
        throw new Error(`Product not found for item ${item.name}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      stockChanges.push({ productId: product._id, previousStock: product.stock, nextStock: product.stock - item.quantity });
      normalizedItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price: item.price,
        lineTotal: item.quantity * item.price,
      });
    }

    for (const change of stockChanges) {
      const updatedProduct = await Product.findByIdAndUpdate(
        change.productId,
        { stock: change.nextStock },
        { new: true }
      );
      if (req.io && updatedProduct) {
        req.io.emit("stock-updated", { productId: change.productId, stock: change.nextStock });
        req.io.emit("product-updated", updatedProduct);
      }
    }

    const savedBill = await Bill.create({
      invoiceNumber: buildInvoiceNumber(),
      clientId: clientId || undefined,
      customerName,
      customerMobile,
      items: normalizedItems,
      subtotal,
      gstRate,
      gstAmount,
      discountType,
      discountValue,
      discountAmount,
      total,
      paymentMethod,
      cashReceived,
      cashChange,
    });

    if (req.io) {
      req.io.emit("invoice-created", savedBill);
      req.io.emit("bill-generated", savedBill);
      req.io.emit("reports-updated", { type: "bill", action: "create" });
    }

    res.status(201).json(savedBill);
  } catch (error) {
    if (stockChanges.length) {
      for (const change of stockChanges) {
        await Product.findByIdAndUpdate(change.productId, { stock: change.previousStock }, { new: true }).catch(() => {});
      }
    }
    res.status(400).json({ message: error.message });
  }
};

const getBills = async (_req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBillPDF = async (req, res) => {
  try {
    const { pdfData } = req.body;
    if (!pdfData) {
      return res.status(400).json({ message: "pdfData is required" });
    }

    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      { pdfData },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Broadcast invoice-updated to all devices so they can grab the shared PDF
    if (req.io) {
      req.io.emit("invoice-updated", bill);
      req.io.emit("reports-updated", { type: "bill", action: "pdf_upload" });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBill,
  getBills,
  updateBillPDF,
};