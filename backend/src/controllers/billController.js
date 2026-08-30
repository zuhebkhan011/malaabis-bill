const Bill = require("../models/Bill");
const Product = require("../models/Product");
const Setting = require("../models/Setting");

const buildInvoiceNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MS-${timestamp}-${randomSuffix}`;
};

const createBill = async (req, res) => {
  const stockChanges = [];
  const createdDraftProducts = [];

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
      gstRate = 0,
      gstAmount = 0,
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

    // Load settings for manual items with lean query
    const setting = await Setting.findOne({ key: "manualItemMode" }).lean();
    const mode = setting ? setting.value : "A"; // default Option A: no stock effect

    const normalizedItems = [];

    // Pre-fetch all catalog products in a single lean database query to optimize performance
    const catalogItemRefs = items.filter((item) => !item.isManual && item.product);
    const catalogProductIds = catalogItemRefs.map((item) => item.product);
    const dbProducts = catalogProductIds.length > 0 ? await Product.find({ _id: { $in: catalogProductIds } }).lean() : [];
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    for (const item of items) {
      if (item.isManual) {
        let linkedProductId = undefined;
        let skuStr = item.sku || "MANUAL";

        // Option B: Automatically create draft product in inventory
        if (mode === "B") {
          const draftSku = item.sku || `ML-DRAFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          const draftProduct = await Product.create({
            name: item.name,
            price: item.price,
            stock: 0, // drafts start with 0 stock
            category: "UNSTITCHED",
            sku: draftSku,
            imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
            status: "draft"
          });
          createdDraftProducts.push(draftProduct._id);
          linkedProductId = draftProduct._id;
          skuStr = draftSku;

          if (req.io) {
            req.io.emit("product-created", draftProduct);
          }
        }

        normalizedItems.push({
          product: linkedProductId,
          name: item.name,
          sku: skuStr,
          quantity: item.quantity,
          price: item.price,
          discountType: item.discountType || "none",
          discountValue: item.discountValue || 0,
          discountAmount: item.discountAmount || 0,
          isManual: true,
          notes: item.notes || "",
          lineTotal: item.lineTotal || (item.price - (item.discountAmount || 0)) * item.quantity,
        });
      } else {
        // Catalog product item
        const product = productMap.get(item.product?.toString());

        if (!product) {
          throw new Error(`Product not found for item ${item.name}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        stockChanges.push({
          productId: product._id,
          previousStock: product.stock,
          nextStock: product.stock - item.quantity
        });

        normalizedItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          price: item.price,
          discountType: item.discountType || "none",
          discountValue: item.discountValue || 0,
          discountAmount: item.discountAmount || 0,
          isManual: false,
          notes: item.notes || "",
          lineTotal: item.lineTotal || (item.price - (item.discountAmount || 0)) * item.quantity,
        });
      }
    }

    // Deduct stocks in a single round-trip with bulkWrite to optimize response time
    if (stockChanges.length > 0) {
      await Product.bulkWrite(
        stockChanges.map((change) => ({
          updateOne: {
            filter: { _id: change.productId },
            update: { $set: { stock: change.nextStock } },
          },
        }))
      );

      if (req.io) {
        stockChanges.forEach((change) => {
          req.io.emit("stock-updated", { productId: change.productId, stock: change.nextStock });
        });
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
    // Rollback stock updates on failure (in parallel)
    if (stockChanges.length) {
      await Promise.all(stockChanges.map(async (change) => {
        await Product.findByIdAndUpdate(change.productId, { stock: change.previousStock }, { new: true }).catch(() => {});
      }));
    }
    // Delete created draft products on failure (in parallel)
    if (createdDraftProducts.length) {
      await Promise.all(createdDraftProducts.map(async (draftId) => {
        await Product.findByIdAndDelete(draftId).catch(() => {});
      }));
    }
    res.status(400).json({ message: error.message });
  }
};

const updateBill = async (req, res) => {
  const stockChanges = [];
  const createdDraftProducts = [];

  try {
    const { id } = req.params;
    const existingBill = await Bill.findById(id);
    if (!existingBill) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const {
      customerName,
      customerMobile,
      items = [],
      subtotal,
      gstRate = 0,
      gstAmount = 0,
      discountType = "none",
      discountValue = 0,
      discountAmount = 0,
      total,
      paymentMethod,
      cashReceived = 0,
      cashChange = 0,
      user = "admin", // audit who edited
    } = req.body;

    if (!items.length) {
      return res.status(400).json({ message: "Bill items are required" });
    }

    // Load settings for manual items
    const setting = await Setting.findOne({ key: "manualItemMode" });
    const mode = setting ? setting.value : "A";

    // Map quantities of previous invoice non-manual items
    const prevQtys = {};
    for (const it of existingBill.items) {
      if (!it.isManual && it.product) {
        const pid = it.product.toString();
        prevQtys[pid] = (prevQtys[pid] || 0) + it.quantity;
      }
    }

    // Map quantities of updated non-manual items
    const nextQtys = {};
    const normalizedItems = [];

    // Pre-fetch all catalog products in a single database query to optimize performance
    const catalogItemRefs = items.filter((item) => !item.isManual && item.product);
    const catalogProductIds = catalogItemRefs.map((item) => item.product);
    const dbProducts = catalogProductIds.length > 0 ? await Product.find({ _id: { $in: catalogProductIds } }) : [];
    const productMap = new Map(dbProducts.map((p) => [p._id.toString(), p]));

    for (const item of items) {
      if (item.isManual) {
        let linkedProductId = item.product;
        let skuStr = item.sku || "MANUAL";

        // Option B: Automatically create draft product if it doesn't already have one
        if (mode === "B" && !linkedProductId) {
          const draftSku = item.sku || `ML-DRAFT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          const draftProduct = await Product.create({
            name: item.name,
            price: item.price,
            stock: 0,
            category: "UNSTITCHED",
            sku: draftSku,
            imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
            status: "draft"
          });
          createdDraftProducts.push(draftProduct._id);
          linkedProductId = draftProduct._id;
          skuStr = draftSku;

          if (req.io) {
            req.io.emit("product-created", draftProduct);
          }
        }

        normalizedItems.push({
          product: linkedProductId || undefined,
          name: item.name,
          sku: skuStr,
          quantity: item.quantity,
          price: item.price,
          discountType: item.discountType || "none",
          discountValue: item.discountValue || 0,
          discountAmount: item.discountAmount || 0,
          isManual: true,
          notes: item.notes || "",
          lineTotal: item.lineTotal || (item.price - (item.discountAmount || 0)) * item.quantity,
        });
      } else {
        // Catalog product
        if (!item.product) {
          throw new Error(`Product reference missing for item: ${item.name}`);
        }
        const pid = item.product.toString();
        nextQtys[pid] = (nextQtys[pid] || 0) + item.quantity;

        const product = productMap.get(pid);
        if (!product) {
          throw new Error(`Product catalog record not found for: ${item.name}`);
        }

        normalizedItems.push({
          product: product._id,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          price: item.price,
          discountType: item.discountType || "none",
          discountValue: item.discountValue || 0,
          discountAmount: item.discountAmount || 0,
          isManual: false,
          notes: item.notes || "",
          lineTotal: item.lineTotal || (item.price - (item.discountAmount || 0)) * item.quantity,
        });
      }
    }

    // Dynamic stock difference calculation
    const allProductIds = new Set([
      ...Object.keys(prevQtys),
      ...Object.keys(nextQtys)
    ]);

    // Pre-fetch all products involved in stock changes
    const changeProductIds = Array.from(allProductIds);
    const changeProducts = changeProductIds.length > 0 ? await Product.find({ _id: { $in: changeProductIds } }) : [];
    const changeProductMap = new Map(changeProducts.map((p) => [p._id.toString(), p]));

    for (const pid of allProductIds) {
      const prev = prevQtys[pid] || 0;
      const next = nextQtys[pid] || 0;
      const qtyDiff = next - prev; // Positive means more quantity bought, negative means quantity returned

      if (qtyDiff !== 0) {
        const product = changeProductMap.get(pid);
        if (!product) {
          throw new Error(`Product catalog record not found for stock adjustment`);
        }

        if (qtyDiff > 0 && product.stock < qtyDiff) {
          throw new Error(`Insufficient stock for ${product.name} (Need ${qtyDiff} more, have ${product.stock})`);
        }

        stockChanges.push({
          productId: product._id,
          previousStock: product.stock,
          nextStock: product.stock - qtyDiff
        });
      }
    }

    // Apply catalog stock changes in parallel to optimize response time
    await Promise.all(stockChanges.map(async (change) => {
      const updatedProduct = await Product.findByIdAndUpdate(
        change.productId,
        { stock: change.nextStock },
        { new: true }
      );
      if (req.io && updatedProduct) {
        req.io.emit("stock-updated", { productId: change.productId, stock: change.nextStock });
        req.io.emit("product-updated", updatedProduct);
      }
    }));

    // Formulate audit log of changes made
    const changesMade = [];
    if (existingBill.customerName !== customerName) {
      changesMade.push(`Customer name changed from "${existingBill.customerName}" to "${customerName}"`);
    }
    if (existingBill.customerMobile !== customerMobile) {
      changesMade.push(`Mobile number changed from "${existingBill.customerMobile || "N/A"}" to "${customerMobile || "N/A"}"`);
    }
    if (existingBill.paymentMethod !== paymentMethod) {
      changesMade.push(`Payment method changed from "${existingBill.paymentMethod}" to "${paymentMethod}"`);
    }
    if (existingBill.total !== total) {
      changesMade.push(`Grand total updated from ₹${existingBill.total} to ₹${total}`);
    }

    // Deep compare items in carts
    existingBill.items.forEach(oldIt => {
      const newIt = normalizedItems.find(n => n.product?.toString() === oldIt.product?.toString() && n.name === oldIt.name);
      if (!newIt) {
        changesMade.push(`Removed item: "${oldIt.name}"`);
      } else if (newIt.quantity !== oldIt.quantity) {
        changesMade.push(`Changed quantity of "${oldIt.name}" from ${oldIt.quantity} to ${newIt.quantity}`);
      }
    });

    normalizedItems.forEach(newIt => {
      const oldIt = existingBill.items.find(o => o.product?.toString() === newIt.product?.toString() && o.name === newIt.name);
      if (!oldIt) {
        changesMade.push(`Added item: "${newIt.name}" (Qty: ${newIt.quantity})`);
      }
    });

    if (changesMade.length === 0) {
      changesMade.push("No material changes made to values");
    }

    const revisionRecord = {
      originalAmount: existingBill.total,
      updatedAmount: total,
      user: user || "admin",
      date: new Date(),
      changesMade
    };

    // Save modifications to database
    existingBill.customerName = customerName;
    existingBill.customerMobile = customerMobile;
    existingBill.items = normalizedItems;
    existingBill.subtotal = subtotal;
    existingBill.gstRate = gstRate;
    existingBill.gstAmount = gstAmount;
    existingBill.discountType = discountType;
    existingBill.discountValue = discountValue;
    existingBill.discountAmount = discountAmount;
    existingBill.total = total;
    existingBill.paymentMethod = paymentMethod;
    existingBill.cashReceived = cashReceived;
    existingBill.cashChange = cashChange;
    existingBill.pdfData = ""; // reset PDF string so client-side compiles fresh PDF
    existingBill.revisions.push(revisionRecord);

    const savedBill = await existingBill.save();

    if (req.io) {
      req.io.emit("invoice-updated", savedBill);
      req.io.emit("reports-updated", { type: "bill", action: "update" });
    }

    res.status(200).json(savedBill);
  } catch (error) {
    // Rollback stock updates on failure
    if (stockChanges.length) {
      for (const change of stockChanges) {
        await Product.findByIdAndUpdate(change.productId, { stock: change.previousStock }, { new: true }).catch(() => {});
      }
    }
    // Delete created draft products on failure
    if (createdDraftProducts.length) {
      for (const draftId of createdDraftProducts) {
        await Product.findByIdAndDelete(draftId).catch(() => {});
      }
    }
    res.status(400).json({ message: error.message });
  }
};

const escapeRegex = (str) => String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getBills = async (_req, res) => {
  try {
    // Exclude large pdfData strings from list view for high performance
    const bills = await Bill.find()
      .select("-pdfData")
      .sort({ createdAt: -1 })
      .lean();
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

const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findByIdAndDelete(id);
    if (!bill) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (req.io) {
      req.io.emit("invoice-deleted", { id });
      req.io.emit("reports-updated", { type: "bill", action: "delete" });
    }

    res.json({ message: "Invoice permanently deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    let cleanId = String(id || "").trim();

    // Check if input is a JSON string (e.g. scanned from Bill QR Code)
    if (cleanId.startsWith("{") && cleanId.endsWith("}")) {
      try {
        const parsed = JSON.parse(cleanId);
        cleanId = String(parsed.invoiceNo || parsed.invoiceNumber || parsed.id || cleanId).trim();
      } catch (_) {}
    }

    cleanId = cleanId.replace(/^#/, "").trim();
    const mongoose = require("mongoose");

    let bill = null;
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      bill = await Bill.findById(cleanId).lean();
    }

    if (!bill) {
      const escaped = escapeRegex(cleanId);
      bill = await Bill.findOne({
        $or: [
          { invoiceNumber: cleanId },
          { invoiceNumber: `#${cleanId}` },
          { invoiceNumber: { $regex: new RegExp(`^#?${escaped}$`, "i") } },
          { clientId: cleanId },
          { "items.sku": cleanId },
          { "items.sku": { $regex: new RegExp(`^${escaped}$`, "i") } },
        ]
      })
      .sort({ createdAt: -1 })
      .lean();
    }

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBill,
  updateBill,
  getBills,
  getBillById,
  updateBillPDF,
  deleteBill,
};