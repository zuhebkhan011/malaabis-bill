import { putProducts, getAllProducts, enqueue, getQueue, deleteQueueItem, putInvoice, getAllInvoices, deleteInvoice, putProductImage, getProductImage, getAllProductImages, deleteProductImage } from "../utils/offlineSync";
import { API_BASE_URL } from "./productApi";

const CHECK_ONLINE = () => typeof navigator !== "undefined" && navigator.onLine;

async function cacheProducts(products) {
  try {
    await putProducts(products || []);
  } catch (e) {
    console.warn("Failed to cache products", e);
  }
}

async function loadCachedProducts() {
  try {
    return await getAllProducts();
  } catch (e) {
    console.warn("Failed to load cached products", e);
    return [];
  }
}

// ─── Invoice Local Storage ────────────────────────────────────────────────────

/**
 * Save an invoice to local device storage (IndexedDB).
 * Called after every successful or offline bill creation.
 */
async function saveInvoiceLocally(invoice) {
  try {
    if (!invoice || !invoice._id) return;
    await putInvoice(invoice);
  } catch (e) {
    console.warn("Failed to save invoice locally", e);
  }
}

/**
 * Load all locally saved invoices from device storage.
 */
async function loadSavedInvoices() {
  try {
    return await getAllInvoices();
  } catch (e) {
    console.warn("Failed to load saved invoices", e);
    return [];
  }
}

/**
 * Delete a saved invoice from device storage.
 */
async function removeSavedInvoice(id) {
  try {
    await deleteInvoice(id);
  } catch (e) {
    console.warn("Failed to delete saved invoice", e);
  }
}

// ─── Bill Queue ───────────────────────────────────────────────────────────────

// Enqueue a bill for later sync
async function queueBill(billPayload) {
  const clientId = billPayload.clientId || `client-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  const payload = { ...billPayload, clientId };
  const item = { type: "bill", payload };
  return enqueue(item);
}

async function queueProductUpdate(product) {
  return enqueue({ type: "product_update", payload: product });
}

async function queueProductDelete(product) {
  return enqueue({ type: "product_delete", payload: product });
}

async function queueProductCreate(product) {
  return enqueue({ type: "product_create", payload: product });
}

async function syncOnce(onProgress) {
  if (!CHECK_ONLINE()) return { ok: false, reason: "offline" };
  const q = await getQueue();
  for (const entry of q.sort((a,b)=>a.createdAt - b.createdAt)) {
    try {
      onProgress?.({ id: entry.id, status: "syncing", entry });
      if (entry.type === "bill") {
        await fetch(`${API_BASE_URL}/bills/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry.payload) });
      } else if (entry.type === "product_update") {
        const p = entry.payload;
        await fetch(`${API_BASE_URL}/products/${p._id || p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
      } else if (entry.type === "product_create") {
        const p = entry.payload;
        await fetch(`${API_BASE_URL}/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
      } else if (entry.type === "product_delete") {
        const p = entry.payload;
        await fetch(`${API_BASE_URL}/products/${p._id || p.id}`, { method: "DELETE" });
      }
      await deleteQueueItem(entry.id);
      onProgress?.({ id: entry.id, status: "done" });
    } catch (err) {
      console.warn("Sync failed for", entry, err);
      onProgress?.({ id: entry.id, status: "failed", error: err.message || String(err) });
      // Do not delete on failure; stop further processing to preserve order
      return { ok: false, reason: "entry_failed", entry };
    }
  }
  return { ok: true };
}

export { cacheProducts, loadCachedProducts, queueBill, queueProductCreate, queueProductUpdate, queueProductDelete, syncOnce, saveInvoiceLocally, loadSavedInvoices, removeSavedInvoice, putProductImage, getProductImage, getAllProductImages, deleteProductImage };
