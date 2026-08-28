import React, { useState, useEffect } from "react";
import { formatINR } from "../utils/currency";

export default function Dashboard({ setView, products = [], recentBills = [] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySales = recentBills
    .filter((bill) => new Date(bill.createdAt || Date.now()) >= today)
    .reduce((acc, bill) => acc + (bill.total || 0), 0);

  const totalProductsCount = products.length;
  const lowStockItems = products.filter(p => p.stock <= 5);
  const lowStockCount = lowStockItems.length;

  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl md:text-4xl text-on-surface">Good Day, Admin</h2>
          <p className="text-sm text-secondary mt-1">Here is what's happening at the boutique today.</p>
        </div>
        <div className="flex gap-2">
          <div className="text-right hidden md:block">
            <span className="text-xs text-outline tracking-wider uppercase block">Current Shift</span>
            <span className="text-sm font-semibold text-primary">Standard Store Duty</span>
          </div>
        </div>
      </section>

      {/* Metric Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Sales */}
        <div className="bg-[#121212] rounded-2xl p-6 border border-[#4d4635]/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-outline uppercase mb-2">Total Sales Today</p>
              <h3 className="text-2xl font-bold text-primary">{formatINR(todaySales)}</h3>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-primary text-xl">payments</span>
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-[#121212] rounded-2xl p-6 border border-[#4d4635]/30 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
              <span className="material-symbols-outlined text-secondary text-xl">inventory_2</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-[#ffe088] px-2.5 py-1 bg-[#d4af37]/10 rounded-full border border-[#d4af37]/30">Active</span>
          </div>
          <div>
            <h4 className="text-3xl font-bold text-on-surface">{totalProductsCount}</h4>
            <p className="text-[10px] font-semibold tracking-wider text-outline uppercase mt-1">Total Products in Catalog</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={`bg-[#121212] rounded-2xl p-6 border ${lowStockCount > 0 ? "border-error/40" : "border-[#4d4635]/30"} flex flex-col justify-between relative overflow-hidden group`}>
          {lowStockCount > 0 && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-error/5 rounded-bl-full blur-xl"></div>
          )}
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`h-12 w-12 rounded-full ${lowStockCount > 0 ? "bg-error/10 border-error/20" : "bg-secondary/10 border-secondary/20"} flex items-center justify-center border`}>
              <span className={`material-symbols-outlined text-xl ${lowStockCount > 0 ? "text-error" : "text-secondary"}`}>warning</span>
            </div>
            {lowStockCount > 0 && (
              <span className="text-[10px] font-semibold tracking-wider text-error px-2 py-0.5 bg-error/10 rounded-full border border-error/30">Action Required</span>
            )}
          </div>
          <div className="relative z-10">
            <h4 className={`text-3xl font-bold ${lowStockCount > 0 ? "text-error" : "text-on-surface"}`}>{lowStockCount} Items</h4>
            <p className="text-[10px] font-semibold tracking-wider text-outline uppercase mt-1">Low Stock Alerts (≤ 5 Units)</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="bg-[#121212] rounded-2xl p-6 border border-[#4d4635]/20">
        <h3 className="text-lg font-semibold text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">bolt</span>
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button 
            onClick={() => setView("billing")} 
            className="flex flex-col items-center justify-center gap-2 p-4 bg-[#1C1C1C] border border-[#4d4635]/20 hover:border-primary/50 rounded-xl transition-all duration-200 group cursor-pointer"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all border border-primary/20">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-secondary uppercase mt-1">New Bill</span>
          </button>

          <button 
            onClick={() => setView("inventory")} 
            className="flex flex-col items-center justify-center gap-2 p-4 bg-[#1C1C1C] border border-[#4d4635]/20 hover:border-primary/50 rounded-xl transition-all duration-200 group cursor-pointer"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all border border-primary/20">
              <span className="material-symbols-outlined text-primary">add_circle</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-secondary uppercase mt-1">Add Product</span>
          </button>

          <button 
            onClick={() => setView("reports")} 
            className="flex flex-col items-center justify-center gap-2 p-4 bg-[#1C1C1C] border border-[#4d4635]/20 hover:border-primary/50 rounded-xl transition-all duration-200 group cursor-pointer"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all border border-primary/20">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-secondary uppercase mt-1">Stock Report</span>
          </button>

          <button 
            onClick={() => setView("inventory")} 
            className="flex flex-col items-center justify-center gap-2 p-4 bg-[#1C1C1C] border border-[#4d4635]/20 hover:border-primary/50 rounded-xl transition-all duration-200 group cursor-pointer"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all border border-primary/20">
              <span className="material-symbols-outlined text-primary">inventory</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wider text-secondary uppercase mt-1">View Stock</span>
          </button>
        </div>
      </section>

      {/* Recent Bills & Low Stock Table Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bills */}
        <div className="bg-[#121212] rounded-2xl p-6 border border-[#4d4635]/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-on-surface">Recent Bills</h3>
            <button onClick={() => setView("billing")} className="text-[10px] font-semibold tracking-wider text-primary hover:underline uppercase">Create New</button>
          </div>
          <div className="divide-y divide-[#4d4635]/20">
            {recentBills.length === 0 ? (
              <div className="text-center py-8 text-secondary text-sm">No recent transactions recorded today.</div>
            ) : (
              recentBills.slice(0, 3).map((bill, index) => (
                <div key={index} className="py-4 flex items-center justify-between hover:bg-white/[0.02] px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-secondary/15 flex items-center justify-center border border-secondary/20">
                      <span className="material-symbols-outlined text-secondary text-lg">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{bill.customerName || "Walk-in Customer"}</p>
                      <p className="text-[10px] font-semibold tracking-wider text-outline uppercase mt-0.5">
                        {new Date(bill.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {bill.paymentMethod || "CASH"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{formatINR(bill.total)}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider bg-primary/10 text-primary border border-primary/20">
                      PAID
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts Monitor */}
        <div className="bg-[#121212] rounded-2xl p-6 border border-[#4d4635]/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-on-surface">Low Stock Alert Monitor</h3>
            <button onClick={() => setView("inventory")} className="text-[10px] font-semibold tracking-wider text-primary hover:underline uppercase">Manage</button>
          </div>
          <div className="divide-y divide-[#4d4635]/20">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-secondary text-sm">All products are healthy and well-stocked.</div>
            ) : (
              lowStockItems.slice(0, 4).map((product) => (
                <div key={product._id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-on-surface">{product.name}</h4>
                    <p className="text-[10px] font-semibold tracking-wider text-outline uppercase mt-0.5">SKU: {product.sku || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-error/15 text-error border border-error/30">
                      {product.stock} Units Left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
