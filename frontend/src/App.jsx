import React, { useEffect, useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewBill from "./pages/NewBill";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import AppShell from "./components/layout/AppShell";
import { createProduct, getProducts, removeProduct, updateProduct as updateProductRequest } from "./services/productApi";
import { getBills } from "./services/billingApi";

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState("dashboard"); // 'dashboard', 'billing', 'inventory', 'reports'
  const [products, setProducts] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle, syncing, failed, ok
  const [recentBills, setRecentBills] = useState([]);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
      // cache for offline
      import("./services/offlineService").then((m) => m.cacheProducts(Array.isArray(data) ? data : []));
    } catch (error) {
      console.error("API error:", error);
    }
  };

  const fetchBills = async () => {
    try {
      const data = await getBills();
      setRecentBills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Bills API error:", error);
    }
  };

  useEffect(() => {
    if (user) {
      // load cached products immediately
      (async () => {
        try {
          const offline = await import("./services/offlineService");
          const cached = await offline.loadCachedProducts();
          if (cached && cached.length) setProducts(cached);
        } catch (e) {
          // ignore
        }
        await fetchProducts();
        await fetchBills();
      })();
    }
  }, [user]);

  // Connectivity + background sync
  useEffect(() => {
    let timer = null;
    const runSync = async () => {
      setSyncStatus("syncing");
      const offline = await import("./services/offlineService");
      const res = await offline.syncOnce((progress) => {
        // optional: show progress
        setSyncStatus(progress.status);
      });
      if (res.ok) setSyncStatus("ok");
      else if (res.reason === "offline") setSyncStatus("idle");
      else setSyncStatus("failed");
    };

    const onOnline = () => {
      setIsOffline(false);
      runSync();
    };
    const onOffline = () => setIsOffline(true);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    // initial
    setIsOffline(!navigator.onLine);
    // periodic sync when online
    timer = setInterval(() => {
      if (navigator.onLine) runSync();
    }, 15000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (timer) clearInterval(timer);
    };
  }, []);

  const addProduct = async (productData) => {
    try {
      if (navigator && !navigator.onLine) {
        // create provisional product locally and enqueue create
        const localProduct = { ...productData, _id: `local-${Date.now()}-${Math.random().toString(36).slice(2,6)}` };
        setProducts((cur) => [localProduct, ...cur]);
        const offline = await import("./services/offlineService");
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
        const offline = await import("./services/offlineService");
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
        setProducts((currentProducts) => currentProducts.filter((product) => product._id !== id));
        const offline = await import("./services/offlineService");
        await offline.queueProductDelete({ _id: id });
        return;
      }
      await removeProduct(id);
      setProducts((currentProducts) => currentProducts.filter((product) => product._id !== id));
    } catch (error) {
      console.error("Delete Product API error:", error);
    }
  };

  const handleBillSaved = async (billData) => {
    setRecentBills((currentBills) => [billData, ...currentBills]);
    try {
      if (billData?.offline) {
        // optimistic local stock decrement
        setProducts((cur) => {
          const byId = {};
          cur.forEach((p) => (byId[p._id] = p));
          (billData.items || []).forEach((it) => {
            const pid = it.product || it._id || it.productId;
            if (byId[pid]) byId[pid] = { ...byId[pid], stock: Math.max(0, (byId[pid].stock || 0) - (it.quantity || 0)) };
          });
          return Object.values(byId);
        });
        // queue product updates for sync
        const offline = await import("./services/offlineService");
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
      console.warn("Post-bill offline handling failed", e);
    }
    alert(`Invoice created successfully for ${billData.customerName}!\nTotal Amount: PKR ${Number(billData.total || 0).toLocaleString()}`);
  };

  const handleReportRefresh = async () => {
    await fetchProducts();
    await fetchBills();
  };

  const handleLogin = (staffUser) => {
    setUser(staffUser);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("dashboard");
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AppShell user={user} currentView={currentView} setCurrentView={setCurrentView} onLogout={handleLogout} isOffline={isOffline} syncStatus={syncStatus}>
      {currentView === "dashboard" && <Dashboard setView={setCurrentView} products={products} recentBills={recentBills} />}
      {currentView === "billing" && <NewBill products={products} onCheckout={handleBillSaved} />}
      {currentView === "inventory" && (
        <Inventory products={products} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />
      )}
      {currentView === "reports" && <Reports onRefresh={handleReportRefresh} />}
    </AppShell>
  );
}

export default App;