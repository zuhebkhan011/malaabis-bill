// Minimal IndexedDB-backed offline sync helper
// Uses idb-keyval style simple wrapper without extra dependency
const DB_NAME = "malaabis_offline_v1";
const DB_VERSION = 1;
const STORE_PRODUCTS = "products";
const STORE_QUEUE = "syncQueue";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) db.createObjectStore(STORE_PRODUCTS, { keyPath: "_id" });
      if (!db.objectStoreNames.contains(STORE_QUEUE)) db.createObjectStore(STORE_QUEUE, { keyPath: "id" });
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

export { putProducts, getAllProducts, enqueue, getQueue, deleteQueueItem };
