// Minimal IndexedDB-backed offline sync helper
const DB_NAME = "malaabis_offline_v1";
const DB_VERSION = 3; // bumped to add product images store
const STORE_PRODUCTS = "products";
const STORE_QUEUE = "syncQueue";
const STORE_INVOICES = "invoices";
const STORE_IMAGES = "productImages"; // key: productId or tempId, value: { id, dataUrl }

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) db.createObjectStore(STORE_PRODUCTS, { keyPath: "_id" });
      if (!db.objectStoreNames.contains(STORE_QUEUE)) db.createObjectStore(STORE_QUEUE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE_INVOICES)) {
        const invoiceStore = db.createObjectStore(STORE_INVOICES, { keyPath: "_id" });
        invoiceStore.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putProducts(products) {
  const db = await openDB();
  const tx = db.transaction(STORE_PRODUCTS, "readwrite");
  const store = tx.objectStore(STORE_PRODUCTS);
  products.forEach((p) => store.put(p));
  return tx.complete || new Promise((res) => (tx.oncomplete = res));
}

async function getAllProducts() {
  const db = await openDB();
  const tx = db.transaction(STORE_PRODUCTS, "readonly");
  const store = tx.objectStore(STORE_PRODUCTS);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function enqueue(item) {
  const db = await openDB();
  const tx = db.transaction(STORE_QUEUE, "readwrite");
  const store = tx.objectStore(STORE_QUEUE);
  const record = { ...item, id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, createdAt: Date.now(), status: item.status || "pending" };
  store.put(record);
  return tx.complete || new Promise((res) => (tx.oncomplete = res)).then(() => record);
}

async function getQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE_QUEUE, "readonly");
  const store = tx.objectStore(STORE_QUEUE);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteQueueItem(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_QUEUE, "readwrite");
  const store = tx.objectStore(STORE_QUEUE);
  store.delete(id);
  return tx.complete || new Promise((res) => (tx.oncomplete = res));
}

// ─── Invoice Storage ──────────────────────────────────────────────────────────

async function putInvoice(invoice) {
  if (!invoice || !invoice._id) return;
  const db = await openDB();
  const tx = db.transaction(STORE_INVOICES, "readwrite");
  const store = tx.objectStore(STORE_INVOICES);
  store.put({ ...invoice, savedAt: Date.now() });
  return tx.complete || new Promise((res) => (tx.oncomplete = res));
}

async function getAllInvoices() {
  const db = await openDB();
  const tx = db.transaction(STORE_INVOICES, "readonly");
  const store = tx.objectStore(STORE_INVOICES);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const invoices = (req.result || []).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
      resolve(invoices);
    };
    req.onerror = () => reject(req.error);
  });
}

async function deleteInvoice(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_INVOICES, "readwrite");
  const store = tx.objectStore(STORE_INVOICES);
  store.delete(id);
  return tx.complete || new Promise((res) => (tx.oncomplete = res));
}

// ─── Product Image Storage (stores base64 locally, avoids API size limit) ────

/**
 * Save a product image as base64 in IndexedDB.
 * @param {string} productId - The product's _id (or a temp id for new products)
 * @param {string} dataUrl - The base64 data URL of the image
 */
async function putProductImage(productId, dataUrl) {
  if (!productId || !dataUrl) return;
  const db = await openDB();
  const tx = db.transaction(STORE_IMAGES, "readwrite");
  const store = tx.objectStore(STORE_IMAGES);
  store.put({ id: productId, dataUrl, savedAt: Date.now() });
  return tx.complete || new Promise((res) => (tx.oncomplete = res));
}

/**
 * Get a product image from IndexedDB by product ID.
 * @param {string} productId
 * @returns {Promise<string|null>} base64 dataUrl or null
 */
async function getProductImage(productId) {
  if (!productId) return null;
  const db = await openDB();
  const tx = db.transaction(STORE_IMAGES, "readonly");
  const store = tx.objectStore(STORE_IMAGES);
  return new Promise((resolve) => {
    const req = store.get(productId);
    req.onsuccess = () => resolve(req.result?.dataUrl || null);
    req.onerror = () => resolve(null);
  });
}

/**
 * Get all product images as a map: { productId: dataUrl }
 * @returns {Promise<Object>}
 */
async function getAllProductImages() {
  const db = await openDB();
  const tx = db.transaction(STORE_IMAGES, "readonly");
  const store = tx.objectStore(STORE_IMAGES);
  return new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const map = {};
      (req.result || []).forEach((item) => { map[item.id] = item.dataUrl; });
      resolve(map);
    };
    req.onerror = () => resolve({});
  });
}

/**
 * Delete a product image from local storage.
 * @param {string} productId
 */
async function deleteProductImage(productId) {
  if (!productId) return;
  const db = await openDB();
  const tx = db.transaction(STORE_IMAGES, "readwrite");
  const store = tx.objectStore(STORE_IMAGES);
  store.delete(productId);
  return tx.complete || new Promise((res) => (tx.oncomplete = res));
}

export {
  putProducts, getAllProducts,
  enqueue, getQueue, deleteQueueItem,
  putInvoice, getAllInvoices, deleteInvoice,
  putProductImage, getProductImage, getAllProductImages, deleteProductImage
};
