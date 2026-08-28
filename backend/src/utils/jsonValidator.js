/**
 * jsonValidator.js
 * Sanitizes and validates the JSON output returned by the Gemini AI API.
 */

function validateAndSanitizeInvoice(rawObj) {
  let cleanText = rawObj;
  if (typeof rawObj === "string") {
    let trimmed = rawObj.trim();
    
    // Remove markdown code block tags if present
    if (trimmed.startsWith("```")) {
      trimmed = trimmed.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    }
    
    // Recover JSON block substring if wrapped in extra text
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      trimmed = trimmed.substring(firstBrace, lastBrace + 1);
    }

    // Clean trailing commas before closing braces/brackets
    trimmed = trimmed.replace(/,\s*}/g, "}").replace(/,\s*\]/g, "]");
    
    cleanText = trimmed;
  }

  let parsed;
  try {
    parsed = typeof cleanText === "string" ? JSON.parse(cleanText) : cleanText;
  } catch (err) {
    console.error("[JSON-Validator] Failed to parse JSON raw string:", cleanText);
    throw new Error(`Failed to parse AI response as valid JSON: ${err.message}. Raw output: ${String(cleanText).substring(0, 100)}...`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid response format: root must be a JSON object");
  }

  // 1. Sanitize Supplier Info
  const rawSupplier = parsed.supplier || {};
  const supplier = {
    name: String(rawSupplier.name || "").trim() || "Unknown Supplier",
    phone: String(rawSupplier.phone || rawSupplier.phoneNumber || "").trim(),
    address: String(rawSupplier.address || "").trim(),
    invoiceNumber: String(rawSupplier.invoiceNumber || parsed.invoice?.number || "").trim(),
    invoiceDate: String(rawSupplier.invoiceDate || parsed.invoice?.date || "").trim(),
    purchaseDate: String(rawSupplier.purchaseDate || rawSupplier.invoiceDate || parsed.invoice?.date || "").trim(),
    gstNumber: String(rawSupplier.gstNumber || rawSupplier.gst || "").trim(),
  };

  // 2. Sanitize Invoice Summary
  const rawInvoice = parsed.invoice || {};
  const invoice = {
    number: String(rawInvoice.number || supplier.invoiceNumber || "").trim(),
    date: String(rawInvoice.date || supplier.invoiceDate || "").trim(),
    total: Number(rawInvoice.total || rawInvoice.totalAmount || 0) || 0,
    discount: Number(rawInvoice.discount || 0) || 0,
    notes: String(rawInvoice.notes || "").trim(),
  };

  // Ensure mutual synchronization between fields
  if (!supplier.invoiceNumber) supplier.invoiceNumber = invoice.number;
  if (!invoice.number) invoice.number = supplier.invoiceNumber;
  if (!supplier.invoiceDate) supplier.invoiceDate = invoice.date;
  if (!invoice.date) invoice.date = supplier.invoiceDate;

  // 3. Sanitize Products
  const rawProducts = Array.isArray(parsed.products) ? parsed.products : [];
  const products = rawProducts
    .map((p, idx) => {
      const name = String(p.name || "").trim();
      return {
        _id: p._id || `ext-${idx}-${Date.now()}`,
        name: name || `Extracted Item #${idx + 1}`,
        quantity: Number(p.quantity || 0) || 0,
        purchasePrice: Number(p.purchasePrice || p.price || 0) || 0,
        sellingPrice: Number(p.sellingPrice || p.retailPrice || 0) || 0,
        mrp: Number(p.mrp || p.MRP || 0) || 0,
        barcode: String(p.barcode || "").trim(),
        sku: String(p.sku || p.SKU || "").trim(),
        category: String(p.category || "").trim(),
        brand: String(p.brand || "").trim(),
      };
    });

  // 4. Sanitize Confidence scores
  const rawConfidence = parsed.confidence || {};
  const confidence = {
    supplier: Math.min(100, Math.max(0, Number(rawConfidence.supplier !== undefined ? rawConfidence.supplier : 95) || 95)),
    products: Math.min(100, Math.max(0, Number(rawConfidence.products !== undefined ? rawConfidence.products : 95) || 95)),
    prices: Math.min(100, Math.max(0, Number(rawConfidence.prices !== undefined ? rawConfidence.prices : 95) || 95)),
  };

  return {
    supplier,
    invoice,
    products,
    confidence,
  };
}

module.exports = {
  validateAndSanitizeInvoice,
};
