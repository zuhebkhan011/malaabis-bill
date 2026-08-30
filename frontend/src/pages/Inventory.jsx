import React, { useState, useEffect } from "react";
import BarcodePrintPreview from "../components/barcode/BarcodePrintPreview";
import { formatINR } from "../utils/currency";
import { getProductImageUrl } from "../utils/imageUrl";
import ProductImage from "../components/ProductImage";
import { getSettings, saveSettings } from "../services/productApi";

export default function Inventory({
  products = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenAIImport,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [barcodePreviewProduct, setBarcodePreviewProduct] = useState(null);
  const [activeIndexes, setActiveIndexes] = useState({});

  const [settings, setSettings] = useState(() => {
    // Load from localStorage as instant default
    try {
      const stored = localStorage.getItem("malaabis_settings");
      return stored ? JSON.parse(stored) : { manualItemMode: "A" };
    } catch {
      return { manualItemMode: "A" };
    }
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        if (data && data.manualItemMode) {
          setSettings(data);
          localStorage.setItem("malaabis_settings", JSON.stringify(data));
        }
      } catch (err) {
        // Backend /settings not available — silently use localStorage defaults
        console.warn("Settings API unavailable, using local defaults:", err.message);
      }
    }
    loadSettings();
  }, []);

  const handleToggleMode = async (mode) => {
    // Apply locally immediately
    const updated = { ...settings, manualItemMode: mode };
    setSettings(updated);
    localStorage.setItem("malaabis_settings", JSON.stringify(updated));
    // Try to sync to backend silently
    try {
      const serverUpdated = await saveSettings({ manualItemMode: mode });
      if (serverUpdated) {
        setSettings(serverUpdated);
        localStorage.setItem("malaabis_settings", JSON.stringify(serverUpdated));
      }
    } catch (err) {
      // Backend not available — setting already applied locally, no error shown
      console.warn("Could not sync setting to server (will retry later):", err.message);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("UNSTITCHED");
  const [images, setImages] = useState([""]);

  const categories = ["ALL", "UNSTITCHED", "READY-TO-WEAR", "ACCESSORIES"];

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setStock("");
    setSku("ML-" + Math.random().toString(36).substring(2, 7).toUpperCase());
    setCategory("UNSTITCHED");
    setImages([""]);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price);
    setStock(product.stock);
    setSku(product.sku || "");
    setCategory(product.category || "UNSTITCHED");
    setImages(product.images && product.images.length ? [...product.images] : [""]);
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const cleanImages = images.filter(Boolean);
    const productData = {
      name,
      price: Number(price),
      stock: Number(stock),
      sku,
      category,
      images: cleanImages,
      imageUrl: cleanImages[0] || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct._id, productData);
    } else {
      onAddProduct(productData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      onDeleteProduct(id);
    }
  };

  const handleOpenBarcodePreview = (product) => {
    setBarcodePreviewProduct((currentProduct) => (currentProduct?._id === product._id ? null : product));
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "ALL" ||
      (product.category && product.category.toUpperCase() === selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 animate-fade-in relative pb-20">
      {/* Header section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-headline text-2xl sm:text-3xl text-on-surface">Product Catalog</h2>
            <p className="text-xs text-secondary mt-0.5">Manage products, stock levels, and AI invoices</p>
          </div>
          <div className="flex items-center gap-2.5">
            {onOpenAIImport && (
              <button
                type="button"
                onClick={onOpenAIImport}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider hover:bg-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.1)] active:scale-95"
              >
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                AI Invoice Import
              </button>
            )}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-primary text-black text-xs font-bold uppercase tracking-wider hover:bg-[#ffe088] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.2)] active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add Product
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
            search
          </span>
          <input
            className="w-full bg-[#1C1C1C] border border-[#4d4635]/20 focus:border-primary focus:ring-0 px-12 py-3.5 text-on-surface rounded-xl text-sm transition-all"
            placeholder="Search SKU or Product Name..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-5 py-2 rounded-full font-semibold text-xs tracking-wider uppercase border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-black border-primary"
                  : "bg-surface-container text-secondary border-[#4d4635]/20 hover:border-primary/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Block */}
      <div className="bg-[#121212] rounded-[24px] p-5 border border-[#4d4635]/20 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">settings_suggest</span>
          <div>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Manual Item Billing Setting</h3>
            <p className="text-xs text-outline mt-0.5">Configure how custom manually added items affect your inventory catalog.</p>
          </div>
        </div>
        <div className="flex bg-black/40 rounded-xl p-1 border border-[#4d4635]/25 select-none self-start md:self-auto shrink-0 flex-wrap gap-1">
          <button
            type="button"
            onClick={() => handleToggleMode("A")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              settings.manualItemMode === "A"
                ? "bg-primary text-black"
                : "text-secondary hover:text-on-surface"
            }`}
          >
            Option A: No Stock Effect
          </button>
          <button
            type="button"
            onClick={() => handleToggleMode("B")}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              settings.manualItemMode === "B"
                ? "bg-primary text-black"
                : "text-secondary hover:text-on-surface"
            }`}
          >
            Option B: Auto Draft Catalog
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-secondary border border-dashed border-[#4d4635]/20 rounded-2xl bg-[#121212]">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">inventory</span>
          <p className="text-sm">No products found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const isLowStock = product.stock <= 5 && product.stock > 0;
            const isOutOfStock = product.stock === 0;

            return (
              <div
                key={product._id}
                className="bg-[#121212] rounded-[24px] overflow-hidden flex flex-col relative group border border-[#4d4635]/10 hover:border-primary/20 transition-all duration-300"
              >
                {/* Stock Label Status */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  {isOutOfStock ? (
                    <span className="bg-black/60 text-error px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-md border border-error/30">
                      OUT OF STOCK
                    </span>
                  ) : isLowStock ? (
                    <span className="bg-error/15 text-error px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-md border border-error/30">
                      LOW STOCK: {product.stock}
                    </span>
                  ) : (
                    <span className="bg-[#d4af37]/15 text-primary px-3 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-md border border-primary/30">
                      IN STOCK: {product.stock}
                    </span>
                  )}
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="absolute top-4 right-4 z-10 flex gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleOpenEdit(product)}
                    className="w-8 h-8 rounded-full bg-surface-container/90 backdrop-blur flex items-center justify-center text-on-surface hover:text-primary transition-colors border border-[#4d4635]/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="w-8 h-8 rounded-full bg-error-container/90 backdrop-blur flex items-center justify-center text-on-error-container hover:text-error transition-colors border border-error/20 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>

                {/* Card Top Image & Carousel */}
                {(() => {
                  const cardImages = product.images && product.images.length ? product.images : [product.imageUrl];
                  const currentIdx = activeIndexes[product._id] || 0;
                  const currentImg = cardImages[currentIdx];

                  return (
                    <div className="h-56 w-full bg-surface-container-high relative overflow-hidden group/carousel">
                      <ProductImage
                        alt={product.name}
                        productName={product.name}
                        className="w-full h-full object-cover transition-all duration-500"
                        src={currentImg}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent pointer-events-none"></div>

                      {/* Navigation Arrows */}
                      {cardImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const prev = (currentIdx - 1 + cardImages.length) % cardImages.length;
                              setActiveIndexes((prevMap) => ({ ...prevMap, [product._id]: prev }));
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white border border-[#4d4635]/25 cursor-pointer opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200"
                            title="Previous view"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">chevron_left</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const next = (currentIdx + 1) % cardImages.length;
                              setActiveIndexes((prevMap) => ({ ...prevMap, [product._id]: next }));
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white border border-[#4d4635]/25 cursor-pointer opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200"
                            title="Next view"
                          >
                            <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
                          </button>

                          {/* Pagination Indicator Dots */}
                          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm border border-[#4d4635]/15">
                            {cardImages.map((_, dotIdx) => (
                              <div
                                key={dotIdx}
                                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                  dotIdx === currentIdx ? "bg-primary scale-110" : "bg-white/40"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Product Info Section */}
                <div className="p-6 flex-1 flex flex-col justify-between -mt-10 relative z-10">
                  <div>
                    <span className="text-secondary text-[10px] font-semibold tracking-wider uppercase block">
                      SKU: {product.sku || "ML-N/A"}
                    </span>
                    <h3 className="font-headline text-lg text-on-surface mt-1 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-primary font-medium text-sm mt-2">
                      {formatINR(product.price)}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#4d4635]/10 flex flex-col gap-3">
                    <button
                      onClick={() => handleOpenBarcodePreview(product)}
                      className="text-secondary hover:text-primary transition-colors flex items-center gap-2 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">barcode</span>
                      {barcodePreviewProduct?._id === product._id ? "HIDE BARCODE" : "GENERATE BARCODE"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        onClick={handleOpenCreate}
        className="fixed bottom-20 left-6 md:bottom-10 md:right-10 md:left-auto w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(212,175,55,0.4)] z-40 hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
        aria-label="Add new product"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* Product Add/Edit Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          ></div>

          {/* Modal Container */}
          <div className="bg-[#121212] w-full max-w-md rounded-2xl border border-[#4d4635]/30 relative z-10 overflow-hidden shadow-2xl animate-fade-in-up">
            <header className="p-6 border-b border-[#4d4635]/20 flex justify-between items-center">
              <h3 className="font-headline text-xl text-on-surface">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-secondary hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Name */}
              <div className="relative group">
                <label className="absolute -top-2 left-3 bg-[#121212] px-1 text-[10px] font-semibold tracking-wider text-outline group-focus-within:text-primary transition-colors">
                  PRODUCT NAME
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emerald Silk Gown"
                  className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-lg px-4 py-3.5 text-on-surface focus:outline-none focus:border-primary text-sm h-12"
                />
              </div>

              {/* Category & Price Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <label className="absolute -top-2 left-3 bg-[#121212] px-1 text-[10px] font-semibold tracking-wider text-outline">
                    CATEGORY
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-primary text-sm h-12 cursor-pointer"
                  >
                    <option value="UNSTITCHED">Unstitched</option>
                    <option value="READY-TO-WEAR">Ready-To-Wear</option>
                    <option value="ACCESSORIES">Accessories</option>
                  </select>
                </div>

                <div className="relative group">
                  <label className="absolute -top-2 left-3 bg-[#121212] px-1 text-[10px] font-semibold tracking-wider text-outline group-focus-within:text-primary transition-colors">
                    PRICE (INR)
                  </label>
                  <input
                    required
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="18500"
                    className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-lg px-4 py-3.5 text-on-surface focus:outline-none focus:border-primary text-sm h-12"
                  />
                </div>
              </div>

              {/* SKU & Stock Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <label className="absolute -top-2 left-3 bg-[#121212] px-1 text-[10px] font-semibold tracking-wider text-outline">
                    SKU CODE
                  </label>
                  <input
                    required
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-lg px-4 py-3.5 text-on-surface focus:outline-none focus:border-primary text-sm h-12"
                  />
                </div>

                <div className="relative group">
                  <label className="absolute -top-2 left-3 bg-[#121212] px-1 text-[10px] font-semibold tracking-wider text-outline group-focus-within:text-primary transition-colors">
                    INITIAL STOCK
                  </label>
                  <input
                    required
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="42"
                    className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-lg px-4 py-3.5 text-on-surface focus:outline-none focus:border-primary text-sm h-12"
                  />
                </div>
              </div>

              {/* Product Gallery Slots */}
              <div className="space-y-4">
                <label className="text-[10px] font-semibold tracking-wider text-outline block uppercase">
                  Product Gallery (Multi-Image Slots)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-1 no-scrollbar">
                  {images.map((img, idx) => {
                    let label = "Gallery Image";
                    if (idx === 0) label = "📸 Front Cover (Primary)";
                    else if (idx === 1) label = "🚪 Back View (Optional)";
                    else if (idx === 2) label = "📐 Side View (Optional)";
                    else label = `🖼️ Gallery Image #${idx - 2}`;

                    return (
                      <div key={idx} className="bg-[#1C1C1C] border border-[#4d4635]/20 rounded-xl p-3 space-y-3 relative group/slot">
                        {/* Slot Label & Reorder Controls */}
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{label}</span>
                          <div className="flex gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = [...images];
                                  const temp = copy[idx];
                                  copy[idx] = copy[idx - 1];
                                  copy[idx - 1] = temp;
                                  setImages(copy);
                                }}
                                className="w-5 h-5 rounded bg-[#2a2a2a] text-secondary hover:text-primary flex items-center justify-center cursor-pointer text-xs"
                                title="Move Up"
                              >
                                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                              </button>
                            )}
                            {idx < images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = [...images];
                                  const temp = copy[idx];
                                  copy[idx] = copy[idx + 1];
                                  copy[idx + 1] = temp;
                                  setImages(copy);
                                }}
                                className="w-5 h-5 rounded bg-[#2a2a2a] text-secondary hover:text-primary flex items-center justify-center cursor-pointer text-xs"
                                title="Move Down"
                              >
                                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const copy = images.filter((_, i) => i !== idx);
                                setImages(copy.length ? copy : [""]);
                              }}
                              className="w-5 h-5 rounded bg-error/15 text-error hover:bg-error/30 flex items-center justify-center cursor-pointer text-xs"
                              title="Delete Slot"
                            >
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Thumbnail preview / upload */}
                        <div className="flex gap-3 items-center">
                          {img ? (
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#4d4635]/25 bg-[#0e0e0e] shrink-0 group/thumbnail">
                              <ProductImage src={img} alt="Slot thumbnail" productName={name} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = [...images];
                                  copy[idx] = "";
                                  setImages(copy);
                                }}
                                className="absolute inset-0 bg-black/70 flex items-center justify-center text-error opacity-0 group-hover/thumbnail:opacity-100 transition-opacity duration-200 cursor-pointer"
                                title="Clear image"
                              >
                                <span className="material-symbols-outlined text-sm">clear</span>
                              </button>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-lg border border-dashed border-[#4d4635]/20 flex items-center justify-center text-outline bg-[#0e0e0e] shrink-0">
                              <span className="material-symbols-outlined text-sm">image</span>
                            </div>
                          )}

                          <div className="flex-1 flex flex-col gap-1.5">
                            <label className="h-8 rounded-lg border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                              <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                              Upload
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const imgObj = new Image();
                                    const objectUrl = URL.createObjectURL(file);
                                    imgObj.onload = () => {
                                      URL.revokeObjectURL(objectUrl);
                                      const MAX_SIZE = 400;
                                      let w = imgObj.width;
                                      let h = imgObj.height;
                                      if (w > MAX_SIZE || h > MAX_SIZE) {
                                        if (w > h) { h = Math.round((h * MAX_SIZE) / w); w = MAX_SIZE; }
                                        else { w = Math.round((w * MAX_SIZE) / h); h = MAX_SIZE; }
                                      }
                                      const canvas = document.createElement("canvas");
                                      canvas.width = w;
                                      canvas.height = h;
                                      const ctx = canvas.getContext("2d");
                                      ctx.drawImage(imgObj, 0, 0, w, h);
                                      const compressed = canvas.toDataURL("image/jpeg", 0.7);
                                      
                                      const copy = [...images];
                                      copy[idx] = compressed;
                                      setImages(copy);
                                    };
                                    imgObj.src = objectUrl;
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                            <input
                              type="url"
                              value={img && !img.startsWith("data:") ? img : ""}
                              onChange={(e) => {
                                const copy = [...images];
                                copy[idx] = e.target.value;
                                setImages(copy);
                              }}
                              placeholder="Or paste URL..."
                              className="w-full bg-[#0e0e0e] border border-[#4d4635]/20 rounded-lg px-2.5 py-1 text-on-surface focus:outline-none focus:border-primary text-[10px] h-7"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Add Slot Trigger */}
                <button
                  type="button"
                  onClick={() => setImages([...images, ""])}
                  className="w-full h-10 border border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                  Add Product Image Slot
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wider text-secondary hover:text-on-surface transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg text-xs font-semibold tracking-wider bg-primary text-black hover:bg-[#ffe088] transition-colors shadow-lg cursor-pointer"
                >
                  SAVE PRODUCT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BarcodePrintPreview
        product={barcodePreviewProduct}
        onClose={() => setBarcodePreviewProduct(null)}
      />
    </div>
  );
}
