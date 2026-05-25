import React from "react";

function NavItem({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer min-h-[48px] ${
        active
          ? "bg-primary text-black font-semibold shadow-md"
          : "text-secondary hover:bg-white/[0.04] hover:text-on-surface"
      }`}
    >
      <span className="material-symbols-outlined text-xl">{icon}</span>
      <span className="text-xs uppercase font-semibold tracking-wider">{label}</span>
    </button>
  );
}

function BottomNavItem({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all cursor-pointer min-h-[56px] min-w-[56px] ${
        active ? "text-primary scale-105" : "text-secondary hover:text-primary"
      }`}
    >
      <span
        className="material-symbols-outlined text-xl"
        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wider mt-1">{label}</span>
    </button>
  );
}

import SyncIndicator from "../SyncIndicator";

export default function AppShell({
  user,
  currentView,
  setCurrentView,
  onLogout,
  children,
  isOffline,
  syncStatus,
  socketStatus,
}) {
  return (
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] font-body flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex h-screen w-72 bg-[#0e0e0e] border-r border-[#4d4635]/15 flex-col p-5 shrink-0 z-40">
        {/* Logo + User */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 overflow-hidden shrink-0">
            <span
              className="material-symbols-outlined text-primary text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_circle
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-primary truncate">
              {user?.username || "Admin User"}
            </h2>
            <p className="text-[10px] font-semibold tracking-wider text-secondary uppercase">
              Flagship Atelier
            </p>
            <p className="text-[9px] text-outline font-bold tracking-widest mt-0.5">
              PREMIUM POS ACCESS
            </p>
          </div>
        </div>

        <nav className="flex-grow flex flex-col gap-1.5">
          <NavItem
            active={currentView === "dashboard"}
            icon="dashboard"
            label="Dashboard"
            onClick={() => setCurrentView("dashboard")}
          />
          <NavItem
            active={currentView === "billing"}
            icon="receipt_long"
            label="POS Billing"
            onClick={() => setCurrentView("billing")}
          />
          <NavItem
            active={currentView === "inventory"}
            icon="inventory_2"
            label="Inventory"
            onClick={() => setCurrentView("inventory")}
          />
          <NavItem
            active={currentView === "reports"}
            icon="analytics"
            label="Reports"
            onClick={() => setCurrentView("reports")}
          />
          <NavItem
            active={currentView === "saved_invoices"}
            icon="bookmark"
            label="Saved Invoices"
            onClick={() => setCurrentView("saved_invoices")}
          />
        </nav>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error/10 hover:text-error transition-all duration-200 mt-auto cursor-pointer min-h-[48px]"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="text-xs uppercase font-semibold tracking-wider">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-[#131313] border-b border-[#4d4635]/15 flex justify-between items-center px-4 md:px-6 py-3 w-full z-30 shrink-0">
          <div className="flex items-center gap-3">
            {/* Logo image in navbar */}
            <img
              src="/logo.png"
              alt="Malaabis Studio"
              className="h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            {/* Fallback icon (hidden if logo loads) */}
            <div
              className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center border border-primary/30 hidden"
              aria-hidden="true"
            >
              <span
                className="material-symbols-outlined text-primary text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
            </div>
            <h1 className="font-headline text-base md:text-lg tracking-widest text-primary">
              MALAABIS STUDIO
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <SyncIndicator isOffline={isOffline} syncStatus={syncStatus} socketStatus={socketStatus} />
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <SyncIndicator isOffline={isOffline} syncStatus={syncStatus} socketStatus={socketStatus} />
            <span className="text-xs text-primary font-bold truncate max-w-[80px]">
              {user?.username}
            </span>
            <button
              onClick={onLogout}
              className="text-error hover:text-error-container min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
              title="Logout"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 relative scroll-smooth">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-2 py-1 pb-safe bg-[#0e0e0e] border-t border-[#4d4635]/15 rounded-t-2xl shadow-2xl">
          <BottomNavItem
            active={currentView === "dashboard"}
            icon="dashboard"
            label="Home"
            onClick={() => setCurrentView("dashboard")}
          />
          <BottomNavItem
            active={currentView === "billing"}
            icon="receipt_long"
            label="Billing"
            onClick={() => setCurrentView("billing")}
          />
          <BottomNavItem
            active={currentView === "inventory"}
            icon="inventory_2"
            label="Catalog"
            onClick={() => setCurrentView("inventory")}
          />
          <BottomNavItem
            active={currentView === "reports"}
            icon="analytics"
            label="Reports"
            onClick={() => setCurrentView("reports")}
          />
          <BottomNavItem
            active={currentView === "saved_invoices"}
            icon="bookmark"
            label="Invoices"
            onClick={() => setCurrentView("saved_invoices")}
          />
        </nav>
      </div>
    </div>
  );
}