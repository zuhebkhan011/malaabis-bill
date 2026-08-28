import React, { useState, useEffect } from "react";
import { formatINR } from "../../utils/currency";

export default function MatchDetailsModal({ product, index, catalogProducts = [], onSave, onClose }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [mrp, setMrp] = useState(0);
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");

  const [matchStatus, setMatchStatus] = useState("new");
  const [matchedProductId, setMatchedProductId] = useState(null);
  const [matchedProductName, setMatchedProductName] = useState(null);
  const [currentStock, setCurrentStock] = useState(0);

  // Manual search states
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setQuantity(product.quantity || 0);
      setPurchasePrice(product.purchasePrice || 0);
      setSellingPrice(product.sellingPrice || 0);
      setMrp(product.mrp || 0);
      setSku(product.sku || "");
      setBarcode(product.barcode || "");
      setCategory(product.category || "");
      setBrand(product.brand || "");
      
      setMatchStatus(product.matchStatus || "new");
      setMatchedProductId(product.matchedProductId || null);
      setMatchedProductName(product.matchedProductName || null);
      setCurrentStock(product.currentStock || 0);

      setSearchQuery(product.matchedProductName || "");
    }
  }, [product]);

  if (!product) return null;

  // Filter products for autocomplete dropdown
  const filteredCatalog = catalogProducts.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectMatchedProduct = (item) => {
    setMatchedProductId(item._id);
    setMatchedProductName(item.name);
    setMatchStatus("exact");
    setCurrentStock(item.stock || 0);
    setSearchQuery(item.name);
    setIsDropdownOpen(false);

    // Auto-suggest selling price and SKU/barcode if empty
    if (!sellingPrice) setSellingPrice(item.price || 0);
    if (!sku && item.sku) setSku(item.sku);
    if (!category && item.category) setCategory(item.category);
  };

  const handleClearMatch = () => {
    setMatchedProductId(null);
    setMatchedProductName(null);
    setMatchStatus("new");
    setCurrentStock(0);
    setSearchQuery("");
  };

  const handleSave = () => {
    onSave(index, {
      ...product,
      name,
      quantity: Number(quantity) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      mrp: Number(mrp) || 0,
      sku,
      barcode,
      category,
      brand,
      matchStatus,
      matchedProductId,
      matchedProductName,
      currentStock,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0e0e0e] border border-[#4d4635]/25 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#4d4635]/20 flex justify-between items-center bg-surface-container">
          <div>
            <h3 className="text-base font-bold uppercase tracking-wider text-on-surface">Match Details Editor</h3>
            <p className="text-[10px] text-outline mt-0.5">Line item match verification & metadata correction</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-outline hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs">
          
          {/* Section 1: Catalog Link Mapping */}
          <div className="bg-white/[0.02] border border-[#4d4635]/15 p-4 rounded-2xl space-y-4">
            <h4 className="font-bold text-primary uppercase tracking-wider">Catalog Matching & Links</h4>
            
            <div className="relative">
              <label className="text-[10px] uppercase tracking-wider text-outline block mb-1">
                Search Catalog to Link / Re-Map Product
              </label>
              
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search by product name or SKU..."
                    className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearMatch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-white"
                      title="Clear database mapping"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Autocomplete Dropdown List */}
              {isDropdownOpen && searchQuery && (
                <div className="absolute left-0 right-0 top-11 bg-[#121212] border border-[#4d4635]/25 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 divide-y divide-white/5">
                  {filteredCatalog.length > 0 ? (
                    filteredCatalog.map((item) => (
                      <button
                        key={item._id}
                        onClick={() => handleSelectMatchedProduct(item)}
                        className="w-full text-left px-4 py-2.5 hover:bg-primary/10 text-on-surface transition-all flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <div className="font-semibold text-xs">{item.name}</div>
                          <div className="text-[10px] text-outline mt-0.5">SKU: {item.sku || "N/A"} • Stock: {item.stock}</div>
                        </div>
                        <span className="text-[10px] font-bold text-primary">{formatINR(item.price)}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-outline italic">No catalog products found</div>
                  )}
                </div>
              )}
            </div>

            {/* Match Stock Preview Indicator */}
            <div className="grid grid-cols-3 gap-4 pt-2 text-center">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Match Status</span>
                <span className={`font-bold mt-1 inline-block uppercase tracking-wider ${
                  matchStatus === "exact" ? "text-emerald-400" : matchStatus === "similar" ? "text-amber-400" : "text-blue-400"
                }`}>
                  {matchStatus === "exact" ? "Exact Match" : matchStatus === "similar" ? "Similar Match" : "New Product"}
                </span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Current Stock</span>
                <span className="font-semibold text-on-surface mt-1 block">
                  {matchStatus === "exact" ? `${currentStock} units` : "—"}
                </span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-outline block">Stock After Import</span>
                <span className="font-semibold text-emerald-400 mt-1 block">
                  {matchStatus === "exact" ? `${Number(currentStock) + Number(quantity)} units` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Invoice Product Metadata */}
          <div className="grid grid-cols-2 gap-4">
            {/* Extracted Product Name */}
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-outline block mb-1">Invoice Item Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-outline block mb-1">Invoice Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Purchase Price */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-outline block mb-1">Purchase Price (Invoice)</label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Selling Price */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-outline block mb-1">Selling Price (Suggested)</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="Enter selling price..."
                className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* MRP */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-outline block mb-1">MRP (Optional)</label>
              <input
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* SKU */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-outline block mb-1">SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-outline block mb-1">Barcode</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-outline block mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
              />
            </div>

            {/* Brand */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-outline block mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full h-10 px-3 bg-black border border-white/10 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#4d4635]/20 flex gap-4 bg-surface-container justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/10 text-white uppercase tracking-wider text-[10px] font-semibold hover:bg-white/5 transition-all cursor-pointer"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-primary text-black uppercase tracking-wider text-[10px] font-semibold hover:bg-[#ffe088] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
