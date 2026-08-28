import React, { useState, useEffect } from "react";
import { purchaseImportService } from "../../services/purchaseImportService";
import { formatINR } from "../../utils/currency";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch supplier directory list
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await purchaseImportService.fetchSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load supplier directory list.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual supplier profile details
  const handleSelectSupplier = async (id) => {
    setSelectedSupplierId(id);
    setProfileLoading(true);
    try {
      const data = await purchaseImportService.fetchSupplierProfile(id);
      setProfileData(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load supplier profile details.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedSupplierId(null);
    setProfileData(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
        </div>
        <p className="text-xs text-outline tracking-wider uppercase font-semibold">Loading Supplier Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        {selectedSupplierId && (
          <button
            onClick={handleBackToList}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface transition-colors cursor-pointer border border-[#4d4635]/25"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
        )}
        <div>
          <h2 className="font-headline text-2xl md:text-3xl text-on-surface">Supplier Directory</h2>
          <p className="text-secondary text-xs mt-0.5">
            {selectedSupplierId ? "Detailed supplier purchasing statistics" : "Complete list of linked wholesale partners"}
          </p>
        </div>
      </div>

      {/* Screen 1: Supplier list grid */}
      {!selectedSupplierId ? (
        error ? (
          <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/25 p-6 rounded-2xl text-center space-y-4">
            <span className="material-symbols-outlined text-red-400 text-3xl">error</span>
            <p className="text-xs text-secondary">{error}</p>
            <button onClick={loadSuppliers} className="px-4 py-2 bg-primary text-black text-xs font-bold rounded-lg uppercase cursor-pointer">
              Retry
            </button>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="max-w-md mx-auto bg-[#121212] border border-[#4d4635]/15 p-10 rounded-3xl text-center space-y-3">
            <span className="material-symbols-outlined text-outline text-4xl">contacts</span>
            <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface">No Suppliers Found</h4>
            <p className="text-xs text-outline leading-relaxed">
              No supplier directory entries have been recorded yet. Suppliers are created automatically once you import invoice documents.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((sup) => (
              <button
                key={sup._id}
                onClick={() => handleSelectSupplier(sup._id)}
                className="w-full text-left p-5 bg-[#121212] border border-[#4d4635]/15 hover:border-primary/50 hover:bg-white/[0.01] rounded-2xl transition-all duration-300 group cursor-pointer space-y-4"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">{sup.name}</h4>
                    {sup.gstNumber && <p className="text-[10px] font-mono text-outline mt-0.5">GSTIN: {sup.gstNumber}</p>}
                  </div>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-all group-hover:translate-x-0.5 text-base shrink-0">
                    arrow_forward_ios
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-white/5 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-outline block">Total Invoices</span>
                    <span className="font-semibold text-on-surface mt-0.5 block">{sup.totalInvoices} Orders</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-outline block">Purchase Value</span>
                    <span className="font-bold text-primary mt-0.5 block">{formatINR(sup.totalPurchaseValue)}</span>
                  </div>
                </div>

                {sup.categoriesSupplied && sup.categoriesSupplied.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {sup.categoriesSupplied.slice(0, 3).map((cat, catIdx) => (
                      <span key={catIdx} className="text-[9px] bg-white/5 text-outline px-2 py-0.5 rounded border border-white/5 uppercase">
                        {cat}
                      </span>
                    ))}
                    {sup.categoriesSupplied.length > 3 && (
                      <span className="text-[9px] text-outline font-bold px-1.5 py-0.5">+{sup.categoriesSupplied.length - 3} more</span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )
      ) : (
        /* Screen 2: Supplier Profile Dashboard */
        profileLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
            </div>
            <p className="text-xs text-outline">Loading Supplier Profile Dashboard...</p>
          </div>
        ) : profileData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Panel: Contact info & Spends */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                    <span className="material-symbols-outlined">storefront</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface leading-tight">{profileData.supplier.name}</h3>
                    {profileData.supplier.gstNumber && (
                      <p className="text-[9px] font-mono text-primary mt-0.5">GSTIN: {profileData.supplier.gstNumber}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3.5 text-xs pt-1 border-t border-white/5">
                  {profileData.supplier.phone && (
                    <div className="flex justify-between">
                      <span className="text-outline">Phone:</span>
                      <span className="font-semibold text-on-surface">{profileData.supplier.phone}</span>
                    </div>
                  )}
                  {profileData.supplier.email && (
                    <div className="flex justify-between">
                      <span className="text-outline">Email:</span>
                      <span className="font-semibold text-on-surface">{profileData.supplier.email}</span>
                    </div>
                  )}
                  {profileData.supplier.address && (
                    <div className="space-y-1">
                      <span className="text-outline block">Address:</span>
                      <p className="text-secondary leading-normal">{profileData.supplier.address}</p>
                    </div>
                  )}
                  {profileData.supplier.notes && (
                    <div className="space-y-1 bg-white/[0.02] border border-white/5 p-3 rounded-xl italic text-secondary">
                      <span className="text-[9px] uppercase tracking-wider text-outline block not-italic">Notes:</span>
                      {profileData.supplier.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Analytics Spends Summary */}
              <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Purchasing Analytics</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-outline">Total Purchase Orders:</span>
                    <span className="font-bold text-on-surface">{profileData.supplier.totalInvoices} Invoices</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-outline">Total Spends Value:</span>
                    <span className="font-bold text-primary">{formatINR(profileData.supplier.totalPurchaseValue)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-outline">Average Order Spend:</span>
                    <span className="font-bold text-on-surface">
                      {profileData.supplier.totalInvoices 
                        ? formatINR(Math.round(profileData.supplier.totalPurchaseValue / profileData.supplier.totalInvoices))
                        : "₹0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Purchase Invoices logs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Wholesale Purchase History</h4>

                {profileData.purchaseHistory.length === 0 ? (
                  <p className="text-xs text-outline italic py-4">No completed purchases recorded for this supplier.</p>
                ) : (
                  <div className="space-y-3">
                    {profileData.purchaseHistory.map((invoice) => (
                      <div key={invoice._id} className="p-4 bg-black/20 border border-white/5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#4d4635]/40 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-on-surface uppercase tracking-wider font-mono">
                              Invoice: {invoice.invoiceNumber}
                            </span>
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded uppercase font-bold">
                              Completed
                            </span>
                          </div>
                          <p className="text-[10px] text-outline">
                            Imported: {new Date(invoice.importTime).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 gap-2">
                          <span className="text-[10px] text-outline uppercase tracking-wider">{invoice.products.length} Products</span>
                          <span className="font-bold text-primary text-sm">{formatINR(invoice.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        )
      )}
    </div>
  );
}
