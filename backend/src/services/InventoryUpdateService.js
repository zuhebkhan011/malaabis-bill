const Product = require("../models/Product");

class InventoryUpdateService {
  /**
   * Processes all imported products inside a session: updating existing stocks and creating new products.
   * @param {Array} products - List of import products from frontend.
   * @param {string} supplierName - Name of the supplier.
   * @param {object} session - Mongoose transaction session.
   */
  static async processImportItems(products, supplierName, session = null) {
    const createdProductIds = [];
    const stockSnapshots = [];

    for (const p of products) {
      // Validation: quantity cannot be negative
      if (Number(p.quantity) < 0) {
        throw new Error(`Invalid stock quantity for item: ${p.name}. Quantity cannot be negative.`);
      }

      if (p.matchStatus === "exact" && p.matchedProductId) {
        // 1. Update Existing Product
        const productObj = await Product.findById(p.matchedProductId).session(session);
        if (!productObj) {
          throw new Error(`Matched product "${p.name}" (ID: ${p.matchedProductId}) was not found in catalog.`);
        }

        // Record stock snapshot for undo rollbacks
        stockSnapshots.push({
          productId: productObj._id,
          previousStock: productObj.stock,
          importedQty: Number(p.quantity),
        });

        // Update stock
        productObj.stock = Number(productObj.stock) + Number(p.quantity);
        
        // Update metadata
        productObj.purchasePrice = Number(p.purchasePrice);
        if (p.sellingPrice > 0) {
          productObj.price = Number(p.sellingPrice);
        }
        if (p.barcode) productObj.barcode = p.barcode;
        if (p.brand) productObj.brand = p.brand;
        if (p.category) productObj.category = p.category;
        productObj.supplier = supplierName;

        await productObj.save({ session });
      } else {
        // 2. Create New Product with guaranteed SKU and Barcode
        const generatedSku = p.sku && String(p.sku).trim()
          ? String(p.sku).trim().toUpperCase()
          : `ML-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const finalBarcode = p.barcode && String(p.barcode).trim() ? String(p.barcode).trim() : generatedSku;

        const newProductPayload = {
          name: p.name,
          price: Number(p.sellingPrice) || Number(p.purchasePrice), // fallback to purchase price if selling price not set
          purchasePrice: Number(p.purchasePrice),
          stock: Number(p.quantity),
          category: p.category || "UNSTITCHED",
          brand: p.brand || "",
          barcode: finalBarcode,
          sku: generatedSku,
          imageUrl: p.imageUrl || "",
          images: p.imageUrl ? [p.imageUrl] : [],
          supplier: supplierName,
          status: "active"
        };

        const newProds = await Product.create([newProductPayload], { session });
        const newProd = newProds[0];
        
        createdProductIds.push(newProd._id);
        
        stockSnapshots.push({
          productId: newProd._id,
          previousStock: 0,
          importedQty: Number(p.quantity)
        });
      }
    }

    return { createdProductIds, stockSnapshots };
  }

  /**
   * Safely rolls back inventory changes (decrements stock and deletes created items).
   * @param {Array} createdProductIds 
   * @param {Array} stockSnapshots 
   * @param {object} session 
   */
  static async rollbackImportItems(createdProductIds, stockSnapshots, session = null) {
    // 1. Rollback stock counts for existing products
    for (const snap of stockSnapshots) {
      const isNewProd = createdProductIds.some(id => id.toString() === snap.productId.toString());
      
      // If the product was newly created, it will be deleted, so we don't need to subtract stock
      if (!isNewProd) {
        const productObj = await Product.findById(snap.productId).session(session);
        if (productObj) {
          productObj.stock = Math.max(0, Number(productObj.stock) - Number(snap.importedQty));
          await productObj.save({ session });
        }
      }
    }

    // 2. Delete newly created products
    for (const prodId of createdProductIds) {
      await Product.findByIdAndDelete(prodId).session(session);
    }
  }
}

module.exports = InventoryUpdateService;
