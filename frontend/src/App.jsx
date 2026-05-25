import React, { useEffect, useRef, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewBill from "./pages/NewBill";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import SavedInvoices from "./pages/SavedInvoices";
import AppShell from "./components/layout/AppShell";
import { createProduct, getProducts, removeProduct, updateProduct as updateProductRequest } from "./services/productApi";
import { getBills } from "./services/billingApi";
import { formatINR } from "./utils/currency";
import * as offline from "./services/offlineService";
import { io } from "socket.io-client";
import { Capacitor } from "@capacitor/core";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if imageUrl is a local base64 data URL */
function isBase64Image(url) {
  return typeof url === "string" && url.startsWith("data:");
}

/**
 * Merge locally stored base64 images into products from the server.
 * Products from API have only remote URLs; this overlays local images.
 */
async function mergeLocalImages(products) {
  try {
    const imageMap = await offline.getAllProductImages();
    if (!Object.keys(imageMap).length) return products;
    return products.map((p) =>
      imageMap[p._id] ? { ...p, imageUrl: imageMap[p._id] } : p
    );
  } catch {
    return products;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [recentBills, setRecentBills] = useState([]);
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [socketStatus, setSocketStatus] = useState("disconnected");

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      const list = Array.isArray(data) ? data : [];
      // Overlay local images on top of server data
      const withImages = await mergeLocalImages(list);
      setProducts(withImages);
      // cache for offline (store without images to keep cache small)
      offline.cacheProducts(list);
    } catch (error) {
      console.error("API error:", error);
    }
  };

  const fetchBills = async () => {
    try {
      const data = await getBills();
      const list = Array.isArray(data) ? data : [];
      setRecentBills(list);
      // Synchronize cloud-synced invoices to savedInvoices state when online
      setSavedInvoices(list);

      // Cache all fetched cloud invoices locally for offline safety
      try {
        for (const bill of list) {
          await offline.saveInvoiceLocally(bill);
        }
      } catch (cacheErr) {
        console.warn("Failed to locally cache cloud invoices:", cacheErr);
      }
    } catch (error) {
      console.error("Bills API error, falling back to local storage:", error);
      try {
        const localInvoices = await offline.loadSavedInvoices();
        setSavedInvoices(localInvoices || []);
      } catch (localErr) {
        console.warn("Failed to load offline fallback invoices:", localErr);
      }
    }
  };

  useEffect(() => {
    if (user) {
      (async () => {
        try {
          // Load cached products and overlay local images
          const cached = await offline.loadCachedProducts();
          if (cached && cached.length) {
            const withImages = await mergeLocalImages(cached);
            setProducts(withImages);
          }
          const invoices = await offline.loadSavedInvoices();
          setSavedInvoices(invoices || []);
        } catch (e) {
          // ignore
        }
        await fetchProducts();
        await fetchBills();
      })();
    }
  }, [user]);

  // Real-time Live Sync Socket.IO integration
  useEffect(() => {
    if (!user) {
      setSocketStatus("disconnected");
      return;
    }

    let backendUrl = import.meta.env.VITE_API_URL || "https://malaabis-bill.onrender.com";
    if (
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
      !Capacitor.isNativePlatform()
    ) {
      backendUrl = "http://localhost:5000";
    }
    console.log("Connecting to live sync socket at:", backendUrl);
    setSocketStatus("connecting");

    const socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Live sync socket connected!");
      setSocketStatus("connected");
    });

    socket.on("disconnect", () => {
      console.log("Live sync socket disconnected!");
      setSocketStatus("disconnected");
    });

    socket.on("connect_error", () => {
      console.warn("Live sync socket connection error.");
      setSocketStatus("connecting");
    });

    // Real-time Event Listeners with strict deduplication
    socket.on("product-created", (newProd) => {
      if (newProd && newProd._id) {
        setProducts((cur) => {
          if (cur.some((p) => p._id === newProd._id)) return cur;
          return [newProd, ...cur];
        });
      }
    });

    socket.on("product-updated", (updatedProd) => {
      if (updatedProd && updatedProd._id) {
        setProducts((cur) =>
          cur.map((p) => (p._id === updatedProd._id ? { ...p, ...updatedProd } : p))
        );
      }
    });

    socket.on("product-deleted", ({ id }) => {
      if (id) {
        setProducts((cur) => cur.filter((p) => p._id !== id));
      }
    });

    socket.on("stock-updated", ({ productId, stock }) => {
      if (productId) {
        setProducts((cur) =>
          cur.map((p) => (p._id === productId ? { ...p, stock } : p))
        );
      }
    });

    socket.on("invoice-created", async (newInvoice) => {
      if (newInvoice && newInvoice._id) {
        setRecentBills((cur) => {
          if (cur.some((b) => b._id === newInvoice._id || b.clientId === newInvoice.clientId)) return cur;
          return [newInvoice, ...cur];
        });

        // Offline safety: Save incoming invoice locally to device storage
        try {
          await offline.saveInvoiceLocally(newInvoice);
          setSavedInvoices((prev) => [
            newInvoice,
            ...prev.filter((inv) => inv._id !== newInvoice._id && inv.clientId !== newInvoice.clientId),
          ]);
        } catch (err) {
          console.warn("Socket event failed to cache invoice locally:", err);
        }
      }
    });

    socket.on("invoice-updated", async (updatedInvoice) => {
      if (updatedInvoice && updatedInvoice._id) {
        console.log(`Live sync: invoice updated #${updatedInvoice.invoiceNumber}`);
        setRecentBills((cur) =>
          cur.map((b) => (b._id === updatedInvoice._id ? { ...b, ...updatedInvoice } : b))
        );
        setSavedInvoices((prev) =>
          prev.map((b) => (b._id === updatedInvoice._id ? { ...b, ...updatedInvoice } : b))
        );

        // Update locally in IndexedDB for offline parity
        try {
          await offline.saveInvoiceLocally(updatedInvoice);
        } catch (err) {
          console.warn("Socket update failed to cache locally:", err);
        }
      }
    });

    socket.on("reports-updated", () => {
      // Refresh local analytics statistics
      fetchProducts();
      fetchBills();
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Connectivity + background sync
  useEffect(() => {
    let timer = null;
    const runSync = async () => {
      setSyncStatus("syncing");
      const res = await offline.syncOnce((progress) => {
        setSyncStatus(progress.status);
      });
      if (res.ok) setSyncStatus("ok");
      else if (res.reason === "offline") setSyncStatus("idle");
      else setSyncStatus("failed");
    };

    const onOnline = () => { setIsOffline(false); runSync(); };
    const onOffline = () => setIsOffline(true);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setIsOffline(!navigator.onLine);
    timer = setInterval(() => { if (navigator.onLine) runSync(); }, 15000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (timer) clearInterval(timer);
    };
  }, []);

  // ─── Product Handlers ───────────────────────────────────────────────────────

  const addProduct = async (productData) => {
    try {
      // If there's a local base64 image, save it separately and strip from API payload
      const localImage = isBase64Image(productData.imageUrl) ? productData.imageUrl : null;
      const apiPayload = localImage
        ? { ...productData, imageUrl: "" } // don't send base64 to API
        : productData;

      if (navigator && !navigator.onLine) {
        const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const localProduct = { ...productData, _id: tempId };
        if (localImage) {
          await offline.putProductImage(tempId, localImage);
        }
        setProducts((cur) => [localProduct, ...cur]);
        await offline.queueProductCreate(apiPayload);
        return;
      }

      const saved = await createProduct(apiPayload);
      // After API creates product with real _id, save image under real _id
      if (localImage && saved?._id) {
        await offline.putProductImage(saved._id, localImage);
      }
      await fetchProducts();
    } catch (error) {
      console.error("Add Product API error:", error);
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const localImage = isBase64Image(productData.imageUrl) ? productData.imageUrl : null;
      const apiPayload = localImage
        ? { ...productData, imageUrl: "" }
        : productData;

      if (navigator && !navigator.onLine) {
        if (localImage) await offline.putProductImage(id, localImage);
        setProducts((cur) => cur.map((p) => (p._id === id ? { ...p, ...productData } : p)));
        await offline.queueProductUpdate({ ...apiPayload, _id: id });
        return;
      }

      if (localImage) await offline.putProductImage(id, localImage);
      await updateProductRequest(id, apiPayload);
      await fetchProducts();
    } catch (error) {
      console.error("Update Product API error:", error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      // Remove local image too
      await offline.deleteProductImage(id);

      if (navigator && !navigator.onLine) {
        setProducts((cur) => cur.filter((p) => p._id !== id));
        await offline.queueProductDelete({ _id: id });
        return;
      }
      await removeProduct(id);
      setProducts((cur) => cur.filter((p) => p._id !== id));
    } catch (error) {
      console.error("Delete Product API error:", error);
    }
  };

  // ─── Bill Handler ───────────────────────────────────────────────────────────

  const handleBillSaved = async (billData) => {
    setRecentBills((cur) => [billData, ...cur]);
    try {
      await offline.saveInvoiceLocally(billData);
      setSavedInvoices((prev) => [billData, ...prev.filter((inv) => inv._id !== billData._id)]);

      if (billData?.offline) {
        setProducts((cur) => {
          const byId = {};
          cur.forEach((p) => (byId[p._id] = p));
          (billData.items || []).forEach((it) => {
            const pid = it.product || it._id || it.productId;
            if (byId[pid]) byId[pid] = { ...byId[pid], stock: Math.max(0, (byId[pid].stock || 0) - (it.quantity || 0)) };
          });
          return Object.values(byId);
        });
        for (const it of billData.items || []) {
          const pid = it.product || it._id || it.productId;
          const prod = products.find((p) => p._id === pid);
          if (prod) {
            const updated = { ...prod, stock: Math.max(0, prod.stock - (it.quantity || 0)) };
            await offline.queueProductUpdate(updated);
          }
        }
      } else {
        await fetchProducts();
        await fetchBills();
      }
    } catch (e) {
      console.warn("Post-bill handling failed", e);
    }
    alert(`✅ Invoice created for ${billData.customerName}!\nGrand Total: ${formatINR(billData.total)}`);
  };

  const handleDeleteSavedInvoice = async (id) => {
    try {
      await offline.removeSavedInvoice(id);
      setSavedInvoices((prev) => prev.filter((inv) => inv._id !== id));
    } catch (e) {
      console.warn("Failed to delete invoice", e);
    }
  };

  const handleReportRefresh = async () => {
    await fetchProducts();
    await fetchBills();
  };

  const handleLogin = (staffUser) => setUser(staffUser);
  const handleLogout = () => { setUser(null); setCurrentView("dashboard"); };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <AppShell user={user} currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} isOffline={isOffline} syncStatus={syncStatus} socketStatus={socketStatus}>
      {currentView === "dashboard" && <Dashboard setView={setCurrentView} products={products} recentBills={recentBills} />}
      {currentView === "billing" && <NewBill products={products} onCheckout={handleBillSaved} />}
      {currentView === "inventory" && (
        <Inventory products={products} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />
      )}
      {currentView === "reports" && <Reports onRefresh={handleReportRefresh} />}
      {currentView === "saved_invoices" && (
        <SavedInvoices
          invoices={savedInvoices}
          onDelete={handleDeleteSavedInvoice}
          onBack={() => setCurrentView("dashboard")}
        />
      )}
    </AppShell>
  );
}

export default App;