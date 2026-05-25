import React, { useState } from "react";
import BarcodePrintPreview from "../components/barcode/BarcodePrintPreview";
import { formatINR } from "../utils/currency";

export default function Inventory({
  products = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [barcodePreviewProduct, setBarcodePreviewProduct] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("UNSTITCHED");
  const [imageUrl, setImageUrl] = useState("");

  const categories = ["ALL", "UNSTITCHED", "READY-TO-WEAR", "ACCESSORIES"];

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName("");
    setPrice("");
    setStock("");
    setSku("ML-" + Math.random().toString(36).substring(2, 7).toUpperCase());
    setCategory("UNSTITCHED");
    setImageUrl("");
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
    setImageUrl(product.imageUrl || "");
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const productData = {
      name,
      price: Number(price),
      stock: Number(stock),
      sku,
      category,
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
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
        <h2 className="font-headline text-3xl text-on-surface">Product Catalog</h2>

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

                {/* Card Top Image */}
                <div className="h-56 w-full bg-surface-container-high relative overflow-hidden">
                  <img
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    src={product.imageUrl || "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent"></div>
                </div>

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
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-black rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(212,175,55,0.4)] z-40 hover:scale-105 transition-transform duration-200 cursor-pointer"
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

              {/* Image Upload & URL input */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-wider text-outline block uppercase">
                  Product Image
                </label>
                
                <div className="flex gap-4 items-center">
                  {imageUrl ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#4d4635]/30 bg-surface-container shrink-0 group/img">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-red-400 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 cursor-pointer"
                        title="Remove image"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-dashed border-[#4d4635]/30 flex items-center justify-center text-outline bg-[#1C1C1C] shrink-0">
                      <span className="material-symbols-outlined text-lg">image</span>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col gap-2">
                    <label className="min-h-[44px] rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98">
                      <span className="material-symbols-outlined text-sm">cloud_upload</span>
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // Compress image before converting to base64
                            const img = new Image();
                            const objectUrl = URL.createObjectURL(file);
                            img.onload = () => {
                              URL.revokeObjectURL(objectUrl);
                              const MAX_SIZE = 400;
                              let w = img.width;
                              let h = img.height;
                              if (w > MAX_SIZE || h > MAX_SIZE) {
                                if (w > h) { h = Math.round((h * MAX_SIZE) / w); w = MAX_SIZE; }
                                else { w = Math.round((w * MAX_SIZE) / h); h = MAX_SIZE; }
                              }
                              const canvas = document.createElement("canvas");
                              canvas.width = w;
                              canvas.height = h;
                              const ctx = canvas.getContext("2d");
                              ctx.drawImage(img, 0, 0, w, h);
                              const compressed = canvas.toDataURL("image/jpeg", 0.7);
                              setImageUrl(compressed);
                            };
                            img.onerror = () => {
                              // fallback: just read as-is
                              const reader = new FileReader();
                              reader.onloadend = () => setImageUrl(reader.result);
                              reader.readAsDataURL(file);
                            };
                            img.src = objectUrl;
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    
                    <input
                      type="url"
                      value={imageUrl && !imageUrl.startsWith("data:") ? imageUrl : ""}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or paste image URL..."
                      className="w-full bg-[#1C1C1C] border border-[#4d4635]/35 rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-primary text-xs h-9"
                    />
                  </div>
                </div>
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
