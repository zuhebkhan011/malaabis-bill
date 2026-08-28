import React, { useState, useEffect } from "react";
import { purchaseImportService } from "../../services/purchaseImportService";
import { formatINR } from "../../utils/currency";

export default function PurchaseAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await purchaseImportService.fetchBIAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load business intelligence analytics data.");
    } finally {
      setLoading(false);
    }
  };

  // Global AI Search handler
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const results = await purchaseImportService.searchBI(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      alert("Search failed. Please try a different query.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Export to CSV Helper
  const handleExportCSV = (type) => {
    if (!analytics) return;
    
    let csvData = [];
    let filename = "";

    if (type === "low_stock") {
      csvData = analytics.lowStockPredictions.map(p => ({
        "Product Name": p.name,
        "Current Stock": p.currentStock,
        "Avg Weekly Sales": p.avgWeeklySales,
        "Recommendation": p.recommendation
      }));
      filename = "low_stock_predictions.csv";
    } else if (type === "suppliers") {
      csvData = analytics.topSuppliers.map(s => ({
        "Supplier Name": s.name,
        "Total Spends": s.totalSpend,
        "Total Invoices": s.invoicesCount
      }));
      filename = "supplier_spends_report.csv";
    } else {
      csvData = analytics.mostPurchasedProducts.map(p => ({
        "Product Name": p.name,
        "Quantity Purchased": p.quantity
      }));
      filename = "most_purchased_products.csv";
    }

    if (csvData.length === 0) {
      alert("No data available to export.");
      return;
    }

    // Build CSV String
    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map(row => 
      Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
        <p className="text-xs text-outline tracking-wider uppercase font-semibold">Loading BI Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header and exports */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline text-2xl md:text-3xl text-on-surface">BI Purchase Analytics</h2>
          <p className="text-secondary text-xs mt-0.5">AI-powered inventory patterns, spends, and low-stock predictions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExportCSV("low_stock")}
            className="px-4 py-2.5 bg-white/5 border border-white/10 text-outline hover:text-on-surface hover:bg-white/10 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Low Stock CSV
          </button>
          <button
            onClick={() => handleExportCSV("suppliers")}
            className="px-4 py-2.5 bg-primary text-black hover:bg-[#ffe088] rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">file_download</span>
            Export Suppliers CSV
          </button>
        </div>
      </div>

      {/* Global AI Search Panel */}
      <div className="bg-[#121212] border border-[#4d4635]/15 p-5 rounded-2xl space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Global Purchase AI Search</h4>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice number, supplier name, brand, or item name (e.g. 'Maria B')..."
            className="flex-1 h-11 px-4 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
          />
          <button
            type="submit"
            className="px-5 h-11 bg-primary text-black rounded-xl text-xs font-bold hover:bg-[#ffe088] cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span className="material-symbols-outlined text-sm">search</span>
            Search
          </button>
        </form>

        {/* Search Results Display */}
        {searchResults && (
          <div className="mt-4 p-4 bg-black/40 border border-white/5 rounded-xl space-y-4 text-xs divide-y divide-white/5">
            <div className="flex justify-between items-center pb-2">
              <span className="font-bold text-[10px] uppercase text-primary">Search Results</span>
              <button onClick={() => setSearchResults(null)} className="text-[10px] text-outline hover:text-white uppercase font-bold">Clear</button>
            </div>

            {/* Matching Invoices */}
            {searchResults.logs && searchResults.logs.length > 0 && (
              <div className="pt-3 space-y-2">
                <h5 className="font-semibold text-outline text-[9px] uppercase tracking-wider">Matching Invoices ({searchResults.logs.length})</h5>
                {searchResults.logs.map(log => (
                  <div key={log._id} className="flex justify-between py-1 border-b border-white/5 last:border-b-0">
                    <div>
                      <span className="font-semibold text-on-surface">{log.supplierName}</span>
                      <span className="text-[10px] text-outline ml-2 font-mono">#{log.invoiceNumber}</span>
                    </div>
                    <span className="font-bold text-primary">{formatINR(log.totalAmount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Matching Suppliers */}
            {searchResults.suppliers && searchResults.suppliers.length > 0 && (
              <div className="pt-3 space-y-2">
                <h5 className="font-semibold text-outline text-[9px] uppercase tracking-wider">Matching Suppliers ({searchResults.suppliers.length})</h5>
                <div className="grid grid-cols-2 gap-2">
                  {searchResults.suppliers.map(sup => (
                    <div key={sup._id} className="p-2 bg-white/5 rounded-lg">
                      <div className="font-semibold text-on-surface">{sup.name}</div>
                      <div className="text-[10px] text-outline mt-0.5">Spends: {formatINR(sup.totalPurchaseValue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Products */}
            {searchResults.products && searchResults.products.length > 0 && (
              <div className="pt-3 space-y-2">
                <h5 className="font-semibold text-outline text-[9px] uppercase tracking-wider">Matching Catalog Products ({searchResults.products.length})</h5>
                <div className="grid grid-cols-2 gap-2">
                  {searchResults.products.map(p => (
                    <div key={p._id} className="p-2 bg-white/5 rounded-lg flex justify-between">
                      <div>
                        <div className="font-semibold text-on-surface">{p.name}</div>
                        <div className="text-[10px] text-outline mt-0.5">Stock: {p.stock} units</div>
                      </div>
                      <span className="font-bold text-primary">{formatINR(p.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!searchResults.logs?.length && !searchResults.suppliers?.length && !searchResults.products?.length && (
              <p className="pt-4 text-center text-outline italic">No matching records found for "{searchQuery}"</p>
            )}
          </div>
        )}
      </div>

      {/* Main Core Grid */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Spends Stats & monthly trends */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* KPI Statistics */}
            <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Spend Performance</h4>
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                  <span className="text-outline">Total Purchase Spends:</span>
                  <span className="font-headline font-bold text-primary text-sm">{formatINR(analytics.stats.totalSpend)}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                  <span className="text-outline">Average Invoice Value:</span>
                  <span className="font-bold text-on-surface">{formatINR(analytics.stats.avgInvoiceValue)}</span>
                </div>
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                  <span className="text-outline">Highest Order Value:</span>
                  <span className="font-bold text-emerald-400">{formatINR(analytics.stats.highestInvoiceValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-outline">Lowest Order Value:</span>
                  <span className="font-bold text-on-surface">{formatINR(analytics.stats.lowestInvoiceValue)}</span>
                </div>
              </div>
            </div>

            {/* Monthly Trend Spend list */}
            <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Monthly Spend History</h4>
              <div className="space-y-3 text-xs">
                {analytics.monthlyTrends.map((trend, idx) => (
                  <div key={idx} className="flex justify-between items-center pb-2 border-b border-white/5 last:border-b-0 last:pb-0">
                    <span className="text-on-surface font-semibold">{trend.month}</span>
                    <span className="font-bold text-primary">{formatINR(trend.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Projections, rankings, and suggestions */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Low Stock predictions */}
            <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">AI Low Stock Predictions</h4>
              
              <div className="space-y-3">
                {analytics.lowStockPredictions.length === 0 ? (
                  <p className="text-xs text-outline italic py-4">No low stock predictions. Stock counts are currently healthy.</p>
                ) : (
                  analytics.lowStockPredictions.map((pred) => (
                    <div key={pred.productId} className="p-3 bg-black/20 border border-white/5 rounded-xl flex justify-between items-center gap-4 hover:border-amber-500/20 transition-all">
                      <div>
                        <h5 className="text-xs font-bold text-on-surface">{pred.name}</h5>
                        <p className="text-[10px] text-outline mt-0.5">
                          Weekly Sales: {pred.avgWeeklySales} Units/week • Current Stock: {pred.currentStock} Units
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 border ${
                        pred.currentStock === 0 
                          ? "bg-red-500/10 text-red-400 border-red-500/20" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {pred.currentStock === 0 ? "Out of Stock" : "Reorder Soon"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Smart Purchase Suggestions */}
            <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Smart Purchase Suggestions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {analytics.suggestions.map((sug, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${
                    sug.priority === "high" 
                      ? "bg-red-500/5 border-red-500/15" 
                      : "bg-white/[0.01] border-[#4d4635]/15"
                  } space-y-1.5`}>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-base">
                        {sug.type === "reorder" ? "autorenew" : "local_offer"}
                      </span>
                      <h5 className="text-xs font-bold text-on-surface">{sug.title}</h5>
                    </div>
                    <p className="text-[10px] text-secondary leading-normal">{sug.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplier Rankings */}
            <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Supplier Spends Rankings</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#4d4635]/20 text-[9px] uppercase tracking-wider text-outline">
                      <th className="pb-2.5 pl-1">Supplier</th>
                      <th className="pb-2.5 text-center">Invoices</th>
                      <th className="pb-2.5 text-right pr-1">Total Spends</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#4d4635]/10">
                    {analytics.topSuppliers.map((sup, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-2.5 pl-1 font-semibold text-on-surface">{sup.name}</td>
                        <td className="py-2.5 text-center text-outline">{sup.invoicesCount} Invoices</td>
                        <td className="py-2.5 text-right font-bold text-primary pr-1">{formatINR(sup.totalSpend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
