import React, { useEffect, useRef, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewBill from "./pages/NewBill";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import SavedInvoices from "./pages/SavedInvoices";
import AppShell from "./components/layout/AppShell";

const AIPurchaseImportPage = React.lazy(() => import("./pages/AIPurchaseImport/AIPurchaseImportPage"));
const SuppliersPage = React.lazy(() => import("./pages/AIPurchaseImport/SuppliersPage"));
const PurchaseAnalyticsPage = React.lazy(() => import("./pages/AIPurchaseImport/PurchaseAnalyticsPage"));
const AIAssistantPage = React.lazy(() => import("./pages/AIPurchaseImport/AIAssistantPage"));
const AIOperatingSystemPage = React.lazy(() => import("./pages/AIPurchaseImport/AIOperatingSystemPage"));
const Settings = React.lazy(() => import("./pages/Settings"));
import { createProduct, getProducts, removeProduct, updateProduct as updateProductRequest, resetDatabase } from "./services/productApi";
import { getBills, deleteBill as deleteBillRequest } from "./services/billingApi";
import { formatINR } from "./utils/currency";
import * as offline from "./services/offlineService";
import { io } from "socket.io-client";
import { Capacitor } from "@capacitor/core";
import { API_BASE_URL } from "./services/apiConfig";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Client-side image caching has been replaced by centralized server-side static file storage.

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
  const [activeEditBill, setActiveEditBill] = useState(null);
  const [operatingSystemTab, setOperatingSystemTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      // cache for offline
      offline.cacheProducts(list);
    } catch (error) {
      console.error("API error:", error);
    }
  };

  const fetchBills = async () => {
    try {
      const data = await getBills();
      const serverList = Array.isArray(data) ? data : [];

      // Safely merge unsynced local offline invoices so they don't disappear on reload
      let mergedList = [...serverList];
      try {
        const localInvoices = await offline.loadSavedInvoices();
        const unsynced = localInvoices.filter(
          (local) => local.offline || String(local._id).startsWith("LOCAL-") || String(local._id).startsWith("client-")
        );
        unsynced.forEach((local) => {
          const isAlreadyOnServer = serverList.some(
            (s) => (s.clientId && s.clientId === local.clientId) || s._id === local._id
          );
          if (!isAlreadyOnServer) {
            mergedList.push(local);
          }
        });
      } catch (localLoadErr) {
        console.warn("Failed to load local invoices for merging:", localLoadErr);
      }

      // Sort all invoices chronologically descending
      mergedList.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.savedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.savedAt || 0).getTime();
        return dateB - dateA;
      });

      setRecentBills(mergedList);
      setSavedInvoices(mergedList);

      // Cache all fetched cloud invoices locally for offline safety
      try {
        for (const bill of serverList) {
          await offline.saveInvoiceLocally(bill);
        }
      } catch (cacheErr) {
        console.warn("Failed to locally cache cloud invoices:", cacheErr);
      }
    } catch (error) {
      console.error("Bills API error, falling back to local storage:", error);
      try {
        const localInvoices = await offline.loadSavedInvoices();
        const sortedLocal = [...(localInvoices || [])].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.savedAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.savedAt || 0).getTime();
          return dateB - dateA;
        });
        setSavedInvoices(sortedLocal);
      } catch (localErr) {
        console.warn("Failed to load offline fallback invoices:", localErr);
      }
    }
  };

  useEffect(() => {
    if (user) {
      (async () => {
        try {
          // Load cached products
          const cached = await offline.loadCachedProducts();
          if (cached && cached.length) {
            setProducts(cached);
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

    const backendUrl = API_BASE_URL;
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
    socket.on("invoice-deleted", async ({ id }) => {
      if (id) {
        console.log(`Live sync: invoice deleted #${id}`);
        setRecentBills((cur) => cur.filter((b) => b._id !== id));
        setSavedInvoices((prev) => prev.filter((inv) => inv._id !== id));
        try {
          await offline.removeSavedInvoice(id);
        } catch (err) {
          console.warn("Socket event failed to delete invoice locally:", err);
        }
      }
    });

    socket.on("reports-updated", () => {
      // Refresh local analytics statistics
      fetchProducts();
      fetchBills();
    });

    socket.on("database-reset", () => {
      console.log("Database reset broadcast received! Cleaning local caches...");
      localStorage.clear();
      const req = indexedDB.deleteDatabase("malaabis_offline_v1");
      req.onsuccess = () => {
        alert("⚠️ The database has been reset for production by the administrator. Logging out for a clean start!");
        window.location.reload();
      };
      req.onerror = () => {
        localStorage.clear();
        window.location.reload();
      };
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
      if (navigator && !navigator.onLine) {
        const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const localProduct = { ...productData, _id: tempId };
        setProducts((cur) => [localProduct, ...cur]);
        await offline.queueProductCreate(productData);
        return;
      }

      await createProduct(productData);
      await fetchProducts();
    } catch (error) {
      console.error("Add Product API error:", error);
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      if (navigator && !navigator.onLine) {
        setProducts((cur) => cur.map((p) => (p._id === id ? { ...p, ...productData } : p)));
        await offline.queueProductUpdate({ ...productData, _id: id });
        return;
      }

      await updateProductRequest(id, productData);
      await fetchProducts();
    } catch (error) {
      console.error("Update Product API error:", error);
    }
  };

  const deleteProduct = async (id) => {
    try {
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
    setActiveEditBill(null);
    setRecentBills((cur) => [billData, ...cur.filter((b) => b._id !== billData._id && b.clientId !== billData.clientId)]);
    try {
      await offline.saveInvoiceLocally(billData);
      setSavedInvoices((prev) => [billData, ...prev.filter((inv) => inv._id !== billData._id && inv.clientId !== billData.clientId)]);

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
  };

  const handleDeleteSavedInvoice = async (id) => {
    try {
      // 1. Remove from local IndexedDB cache immediately
      await offline.removeSavedInvoice(id);
      setSavedInvoices((prev) => prev.filter((inv) => inv._id !== id));
      setRecentBills((prev) => prev.filter((inv) => inv._id !== id));

      const isLocalDraft = String(id).startsWith("LOCAL-") || String(id).startsWith("client-");
      if (isLocalDraft) {
        // If it's a local draft, we should also delete it from the sync queue so it doesn't try to upload!
        try {
          const q = await offline.getQueue();
          const queuedItem = q.find(
            (item) => item.type === "bill" && (item.payload.clientId === id || item.id === id)
          );
          if (queuedItem) {
            await offline.deleteQueueItem(queuedItem.id);
          }
        } catch (queueErr) {
          console.warn("Failed to clear local draft from sync queue:", queueErr);
        }
      } else {
        // Real cloud invoice
        if (navigator && navigator.onLine) {
          try {
            await deleteBillRequest(id);
          } catch (apiErr) {
            console.warn("Backend delete failed, queueing delete for later:", apiErr);
            await offline.queueBillDelete(id);
          }
        } else {
          console.log("Device offline, queueing invoice delete.");
          await offline.queueBillDelete(id);
        }
      }
    } catch (e) {
      console.warn("Failed to delete invoice", e);
    }
  };

  const handleSystemReset = async () => {
    const confirmed = window.confirm(
      "⚠️ WARNING: SYSTEM DATABASE RESET\n\nThis will completely purge all active products, invoices, and sales history from BOTH the remote MongoDB Atlas server and this local device.\n\nThis action is permanent and cannot be undone.\n\nAre you sure you want to completely reset the system?"
    );
    if (!confirmed) return;

    const secondConfirm = window.confirm(
      "❓ FINAL CONFIRMATION\n\nAre you absolutely sure you want to proceed? The database will start completely empty for fresh production use."
    );
    if (!secondConfirm) return;

    try {
      await resetDatabase();
      localStorage.clear();
      const req = indexedDB.deleteDatabase("malaabis_offline_v1");
      const onDone = () => {
        alert("🎉 System reset successfully! Redirecting to login for a fresh start.");
        window.location.reload();
      };
      req.onsuccess = onDone;
      req.onerror = onDone;
    } catch (err) {
      alert("❌ Error resetting database: " + err.message);
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
    <AppShell
      user={user}
      currentView={currentView}
      setCurrentView={setCurrentView}
      onLogout={handleLogout}
      isOffline={isOffline}
      syncStatus={syncStatus}
      socketStatus={socketStatus}
      setOperatingSystemTab={setOperatingSystemTab}
      setSearchQuery={setSearchQuery}
    >
      <React.Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
            </div>
            <p className="text-[10px] text-outline font-bold tracking-widest uppercase">Initializing Module...</p>
          </div>
        }
      >
        {currentView === "dashboard" && <Dashboard setView={setCurrentView} products={products} recentBills={recentBills} />}
        {currentView === "billing" && (
          <NewBill
            products={products}
            invoices={savedInvoices}
            onCheckout={handleBillSaved}
            editBill={activeEditBill}
            onCancelEdit={() => {
              setActiveEditBill(null);
              setCurrentView("saved_invoices");
            }}
          />
        )}
        {currentView === "inventory" && (
          <Inventory products={products} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />
        )}
        {currentView === "reports" && <Reports onRefresh={handleReportRefresh} />}
        {currentView === "saved_invoices" && (
          <SavedInvoices
            invoices={savedInvoices}
            onDelete={handleDeleteSavedInvoice}
            onBack={() => setCurrentView("dashboard")}
            onEdit={(bill) => {
              setActiveEditBill(bill);
              setCurrentView("billing");
            }}
          />
        )}
        {currentView === "purchase_import" && (
          <AIPurchaseImportPage
            products={products}
            onBack={() => setCurrentView("dashboard")}
            onGoToCatalog={() => {
              fetchProducts();
              setCurrentView("inventory");
            }}
            onImportSuccess={fetchProducts}
          />
        )}
        {currentView === "suppliers" && (
          <SuppliersPage />
        )}
        {currentView === "purchase_analytics" && (
          <PurchaseAnalyticsPage />
        )}
        {currentView === "ai_assistant" && (
          <AIAssistantPage />
        )}
        {currentView === "operating_system" && (
          <AIOperatingSystemPage
            activeTab={operatingSystemTab}
            setActiveTab={setOperatingSystemTab}
            initialQuery={searchQuery}
          />
        )}
        {currentView === "settings" && (
          <Settings onSystemReset={handleSystemReset} />
        )}
      </React.Suspense>
    </AppShell>
  );
}

export default App;