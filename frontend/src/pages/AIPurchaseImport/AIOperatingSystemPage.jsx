import React, { useState, useEffect } from "react";
import { aiOSService } from "../../services/aiOSService";
import { purchaseImportService } from "../../services/purchaseImportService";
import { formatINR } from "../../utils/currency";

export default function AIOperatingSystemPage({ activeTab: propActiveTab, setActiveTab: propSetActiveTab, initialQuery }) {
  const [localActiveTab, setLocalActiveTab] = useState("dashboard");
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [reorderData, setReorderData] = useState(null);
  const [healthData, setHealthData] = useState(null);

  // Global Search everywhere
  const [searchQuery, setSearchQuery] = useState(initialQuery || "");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Backup restore file state
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const data = await aiOSService.fetchOSSummary();
        setSummaryData(data);
      } else if (activeTab === "customers") {
        const data = await aiOSService.fetchOSCustomers();
        setCustomers(data);
      } else if (activeTab === "reorders") {
        const data = await aiOSService.fetchOSReorders();
        setReorderData(data);
      } else if (activeTab === "health") {
        const data = await aiOSService.fetchOSHealth();
        setHealthData(data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to sync OS database records.");
    } finally {
      setLoading(false);
    }
  };

  const executeSearch = async (query) => {
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const results = await purchaseImportService.searchBI(query);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      alert("Global search query failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Search Everywhere
  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  // Draft PO Exporter
  const handleExportDraftPO = () => {
    if (!reorderData?.draftPO) return;
    const po = reorderData.draftPO;

    let txt = `MALAABIS STUDIO - DRAFT PURCHASE ORDER\n`;
    txt += `======================================\n`;
    txt += `PO Number: ${po.purchaseOrderNumber}\n`;
    txt += `Created Date: ${new Date(po.createdDate).toLocaleString("en-IN")}\n`;
    txt += `Supplier Name: ${po.supplierName}\n`;
    txt += `======================================\n\n`;
    txt += `ITEMS ORDER DRAFT:\n`;
    po.items.forEach((item, idx) => {
      txt += `${idx + 1}. ${item.name} | Qty: ${item.quantity} | Unit Price: ₹${item.unitPrice} | Total: ₹${item.totalPrice}\n`;
    });
    txt += `\n======================================\n`;
    txt += `ESTIMATED TOTAL SPEND: ₹${po.totalCost}\n`;
    txt += `======================================\n`;

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `draft_purchase_order_${po.purchaseOrderNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("✅ Draft Purchase Order text file downloaded successfully!");
  };

  // Backup exporter trigger
  const handleExportBackup = () => {
    aiOSService.triggerBackupDownload();
  };

  // Backup restore file uploads
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setRestoreFile(file);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) {
      alert("Please select a valid backup JSON file first.");
      return;
    }

    const confirmRestore = window.confirm(
      "⚠️ WARNING: Restoring backup will wipe your current database collections and replace them with the backup file data. This cannot be undone! Do you want to proceed?"
    );
    if (!confirmRestore) return;

    setRestoring(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          const result = await aiOSService.restoreBackup(parsed);
          alert(`✅ Success: ${result.message}`);
          setRestoreFile(null);
          loadData();
        } catch (parseErr) {
          alert("Error parsing backup JSON file. Please verify it is a valid Malaabis backup.");
        } finally {
          setRestoring(false);
        }
      };
      reader.readAsText(restoreFile);
    } catch (err) {
      console.error(err);
      alert("Restore failed: " + err.message);
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div>
        <h2 className="font-headline text-2xl md:text-3xl text-on-surface">Malaabis AI Operating System</h2>
        <p className="text-secondary text-xs mt-0.5">Unified executive dashboard, automation triggers, health diagnostic and data safety backups</p>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-[#4d4635]/25 gap-2 scrollbar-none overflow-x-auto">
        {[
          { id: "dashboard", label: "Executive Dashboard", icon: "dashboard" },
          { id: "reorders", label: "Reorders & Draft POs", icon: "local_shipping" },
          { id: "customers", label: "Customer Profiles", icon: "badge" },
          { id: "health", label: "Health & Backups", icon: "terminal" },
          { id: "search", label: "Search Everywhere", icon: "travel_explore" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 border-b-2 font-semibold text-xs tracking-wider uppercase transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id 
                ? "border-primary text-primary" 
                : "border-transparent text-outline hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Loader spinner */}
      {loading && activeTab !== "search" && (
        <div className="flex flex-col items-center justify-center py-28 space-y-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
          </div>
          <p className="text-xs text-outline">Loading operating system module data...</p>
        </div>
      )}

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {!loading && activeTab === "dashboard" && summaryData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main left panels */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Executive Summary Block */}
            <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">analytics</span>
                <h4 className="text-xs font-bold uppercase tracking-wider">AI Executive Summary</h4>
              </div>
              <div className="text-xs leading-relaxed text-secondary whitespace-pre-line bg-black/40 border border-white/5 p-4 rounded-xl">
                {summaryData.aiSummary}
              </div>
            </div>

            {/* Sales performance KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-[#121212] border border-[#4d4635]/15 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Today's Sales</span>
                <span className="text-base font-bold text-on-surface block mt-1">{formatINR(summaryData.metrics.todaySales)}</span>
              </div>
              <div className="p-4 bg-[#121212] border border-[#4d4635]/15 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Yesterday's Sales</span>
                <span className="text-base font-bold text-on-surface block mt-1">{formatINR(summaryData.metrics.yesterdaySales)}</span>
              </div>
              <div className="p-4 bg-[#121212] border border-[#4d4635]/15 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Weekly Revenue</span>
                <span className="text-base font-bold text-primary block mt-1">{formatINR(summaryData.metrics.weeklySales)}</span>
              </div>
              <div className="p-4 bg-[#121212] border border-[#4d4635]/15 rounded-2xl">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Monthly Spend</span>
                <span className="text-base font-bold text-primary block mt-1">{formatINR(summaryData.metrics.monthlySales)}</span>
              </div>
            </div>
          </div>

          {/* Right panel: Active BI alerts warnings list */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">notifications_active</span>
                <h4 className="text-xs font-bold uppercase tracking-wider">AI Operations Alerts</h4>
              </div>
              
              <div className="space-y-3.5">
                {summaryData.metrics.alerts.length === 0 ? (
                  <p className="text-xs text-outline italic py-2">No active business operating anomalies detected.</p>
                ) : (
                  summaryData.metrics.alerts.map((al, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border flex gap-3 text-xs ${
                        al.type === "error" 
                          ? "bg-red-500/10 border-red-500/20 text-red-400" 
                          : al.type === "warning"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
                        {al.type === "error" ? "error" : al.type === "warning" ? "warning" : "info"}
                      </span>
                      <p className="leading-relaxed">{al.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: REORDERS & DRAFT POS */}
      {!loading && activeTab === "reorders" && reorderData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Reorders checklist */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Restocking Predictions</h4>
              
              <div className="space-y-3">
                {reorderData.reorders.length === 0 ? (
                  <p className="text-xs text-outline italic py-4">All products stock values are currently safe.</p>
                ) : (
                  reorderData.reorders.map((r, idx) => (
                    <div key={idx} className="p-3 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <h5 className="font-bold text-on-surface">{r.name}</h5>
                        <p className="text-[10px] text-outline mt-0.5">
                          Supplier: {r.preferredSupplier} • Stock: {r.currentStock} Units
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-primary block">Reorder +{r.suggestedQty} Qty</span>
                        <span className="text-[10px] text-outline block mt-0.5">Est Cost: {formatINR(r.estimatedCost)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Draft PO Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#121212] border border-amber-500/20 rounded-2xl p-5 space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Draft Purchase Order</h4>
                  <p className="text-[9px] font-mono text-outline mt-0.5">{reorderData.draftPO.purchaseOrderNumber}</p>
                </div>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-black">
                  PENDING
                </span>
              </div>

              {/* Items Summary list */}
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-[10px] space-y-2 max-h-48 overflow-y-auto">
                {reorderData.draftPO.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-outline truncate max-w-[120px]">{item.name} (x{item.quantity})</span>
                    <span className="font-semibold text-on-surface">{formatINR(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                <span className="text-outline">Estimated Total:</span>
                <span className="font-headline font-bold text-primary text-sm">{formatINR(reorderData.draftPO.totalCost)}</span>
              </div>

              <button
                onClick={handleExportDraftPO}
                disabled={reorderData.reorders.length === 0}
                className={`w-full py-3 rounded-xl uppercase tracking-wider text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  reorderData.reorders.length === 0 
                    ? "bg-white/5 text-outline cursor-not-allowed border border-white/5" 
                    : "bg-primary text-black hover:bg-[#ffe088]"
                }`}
              >
                <span className="material-symbols-outlined text-sm">print</span>
                Approve & Export PO Draft
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CUSTOMER INSIGHTS */}
      {!loading && activeTab === "customers" && (
        <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Customer Value Directory</h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#4d4635]/25 text-[9px] uppercase tracking-wider text-outline">
                  <th className="pb-3 pl-2">Customer Details</th>
                  <th className="pb-3 text-center">Invoices Count</th>
                  <th className="pb-3 text-center">Favorite Category</th>
                  <th className="pb-3 text-center">Last Active</th>
                  <th className="pb-3 text-right pr-2">Total Spends</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4d4635]/10">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-outline italic">No customer invoice transactions logged yet.</td>
                  </tr>
                ) : (
                  customers.map((c, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-3 pl-2">
                        <div className="font-semibold text-on-surface">{c.name}</div>
                        <div className="text-[10px] text-outline font-mono mt-0.5">{c.mobile}</div>
                      </td>
                      <td className="py-3 text-center text-secondary">{c.invoicesCount} Bills</td>
                      <td className="py-3 text-center">
                        <span className="text-[9px] bg-white/5 text-outline px-2 py-0.5 rounded border border-white/5 uppercase">
                          {c.favoriteCategory}
                        </span>
                      </td>
                      <td className="py-3 text-center text-outline">
                        {new Date(c.lastPurchase).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="py-3 text-right pr-2 font-bold text-primary">{formatINR(c.totalSpend)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM HEALTH & BACKUPS */}
      {!loading && activeTab === "health" && healthData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Health details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">System Health Diagnostics</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center">
                  <span className="text-outline">Database Connection:</span>
                  <span className="text-emerald-400 font-bold uppercase">{healthData.databaseStatus}</span>
                </div>
                <div className="p-4 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center">
                  <span className="text-outline">Sync Status:</span>
                  <span className="text-emerald-400 font-bold uppercase">{healthData.realtimeSync}</span>
                </div>
                <div className="p-4 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center">
                  <span className="text-outline">Offline Sync Queue:</span>
                  <span className="text-on-surface font-semibold">{healthData.offlineQueueSize} Queued</span>
                </div>
                <div className="p-4 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center">
                  <span className="text-outline">Data Backups Status:</span>
                  <span className="text-emerald-400 font-semibold uppercase">{healthData.backupStatus}</span>
                </div>
              </div>

              {/* DB collections items count */}
              <div className="pt-4 border-t border-white/5 space-y-2 text-xs">
                <h5 className="font-bold text-[9px] uppercase tracking-wider text-outline mb-3">Database Collection Metrics</h5>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-outline">Active Product Catalog:</span>
                  <span className="font-semibold text-on-surface">{healthData.dbMetrics.productsCount} Records</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-outline">Customer Sales Invoices:</span>
                  <span className="font-semibold text-on-surface">{healthData.dbMetrics.billsCount} Records</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-outline">Purchase History Logs:</span>
                  <span className="font-semibold text-on-surface">{healthData.dbMetrics.historyCount} Records</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-outline">Estimated Storage Usage:</span>
                  <span className="font-semibold text-primary">{healthData.dbMetrics.estimatedDbSize}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Restore Action Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Data Safety Center</h4>
              
              <div className="space-y-3">
                <button
                  onClick={handleExportBackup}
                  className="w-full py-3 bg-[#ffe088]/5 border border-[#ffe088]/20 text-[#f2ca50] uppercase tracking-wider text-xs font-bold rounded-xl hover:bg-[#ffe088]/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">cloud_download</span>
                  Download JSON Backup
                </button>
              </div>

              {/* Restore trigger box */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <h5 className="text-[10px] font-bold text-outline uppercase tracking-wider">Restore Database Collection</h5>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="w-full text-xs text-outline file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-white/5 file:text-white file:text-xs hover:file:bg-white/10 cursor-pointer"
                />
                
                {restoreFile && (
                  <button
                    onClick={handleRestoreBackup}
                    disabled={restoring}
                    className="w-full py-3 bg-red-500 text-white uppercase tracking-wider text-xs font-bold rounded-xl hover:bg-red-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {restoring ? (
                      <>
                        <span className="animate-spin material-symbols-outlined text-sm">sync</span>
                        Restoring records...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">restore</span>
                        Confirm Restore Backup
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 5: SEARCH EVERYWHERE */}
      {activeTab === "search" && (
        <div className="space-y-6">
          <div className="bg-[#121212] border border-[#4d4635]/15 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Global Store Database Search</h4>
            <form onSubmit={handleGlobalSearch} className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything (e.g. Invoice #, mobile, name, category, brand, supplier)..."
                className="flex-1 h-11 px-4 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
              />
              <button
                type="submit"
                className="px-5 h-11 bg-primary text-black rounded-xl text-xs font-bold hover:bg-[#ffe088] cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-sm">travel_explore</span>
                Search
              </button>
            </form>
          </div>

          {searchLoading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
              </div>
              <p className="text-xs text-outline">Searching database records...</p>
            </div>
          )}

          {/* Search results grids */}
          {searchResults && !searchLoading && (
            <div className="space-y-6">
              
              {/* Sales Invoices */}
              {searchResults.logs && searchResults.logs.length > 0 && (
                <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-3 text-xs">
                  <h5 className="font-bold text-[9px] uppercase tracking-wider text-primary">Matching Completed Invoices</h5>
                  <div className="space-y-2">
                    {searchResults.logs.map(log => (
                      <div key={log._id} className="p-3 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="font-bold text-on-surface">{log.supplierName}</span>
                          <span className="text-[10px] text-outline ml-2 font-mono">Invoice: {log.invoiceNumber}</span>
                        </div>
                        <span className="font-bold text-primary">{formatINR(log.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suppliers */}
              {searchResults.suppliers && searchResults.suppliers.length > 0 && (
                <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-3 text-xs">
                  <h5 className="font-bold text-[9px] uppercase tracking-wider text-primary">Matching Suppliers</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.suppliers.map(sup => (
                      <div key={sup._id} className="p-3 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-on-surface">{sup.name}</span>
                          <span className="text-[10px] text-outline block mt-0.5">Orders: {sup.totalInvoices} Invoices</span>
                        </div>
                        <span className="font-bold text-primary">{formatINR(sup.totalPurchaseValue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {searchResults.products && searchResults.products.length > 0 && (
                <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-3 text-xs">
                  <h5 className="font-bold text-[9px] uppercase tracking-wider text-primary">Matching Catalog Products</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.products.map(p => (
                      <div key={p._id} className="p-3 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-on-surface">{p.name}</span>
                          <span className="text-[10px] text-outline block mt-0.5">Stock: {p.stock} units • SKU: {p.sku || "N/A"}</span>
                        </div>
                        <span className="font-bold text-primary">{formatINR(p.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!searchResults.logs?.length && !searchResults.suppliers?.length && !searchResults.products?.length && (
                <div className="max-w-md mx-auto bg-[#121212] border border-[#4d4635]/15 p-10 rounded-3xl text-center">
                  <p className="text-xs text-outline italic">No matching records found for "{searchQuery}"</p>
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}
