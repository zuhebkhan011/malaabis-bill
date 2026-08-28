import React, { useState } from "react";
import { Capacitor } from "@capacitor/core";
import SyncIndicator from "../SyncIndicator";

function DrawerNavItem({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer min-h-[44px] text-left ${
        active
          ? "bg-primary text-black font-semibold shadow-md"
          : "text-secondary hover:bg-white/[0.04] hover:text-on-surface"
      }`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <span className="text-xs uppercase font-semibold tracking-wider">{label}</span>
    </button>
  );
}

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
      className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all cursor-pointer min-h-[56px] min-w-[56px] ${
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

export default function AppShell({
  user,
  currentView,
  setCurrentView,
  onLogout,
  children,
  isOffline,
  syncStatus,
  socketStatus,
  setOperatingSystemTab,
  setSearchQuery,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");

  const userRole = user?.role || (user?.username === "admin" ? "admin" : "staff");

  const hasAccess = (itemKey) => {
    const role = userRole.toLowerCase();
    if (role === "admin") return true;

    if (role === "manager") {
      const allowed = [
        "dashboard", "billing", "inventory", "reports", "suppliers",
        "purchase_import", "ai_assistant", "purchase_analytics", "operating_system",
        "health", "customers", "reorders", "search", "settings"
      ];
      return allowed.includes(itemKey);
    }

    // Cashier / Staff Roles
    const cashierAllowed = ["dashboard", "billing", "inventory", "reports", "saved_invoices", "settings"];
    return cashierAllowed.includes(itemKey);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!drawerSearch.trim()) return;
    if (setSearchQuery && setOperatingSystemTab) {
      setSearchQuery(drawerSearch);
      setOperatingSystemTab("search");
      setCurrentView("operating_system");
      setIsDrawerOpen(false);
      setDrawerSearch("");
    }
  };

  const navigateToOS = (tab) => {
    if (setOperatingSystemTab) {
      setOperatingSystemTab(tab);
      setSearchQuery("");
      setCurrentView("operating_system");
      setIsDrawerOpen(false);
    }
  };

  // Dynamic alerts for Notification Center
  const getAlerts = () => {
    const alerts = [];
    if (isOffline) {
      alerts.push({ id: 1, type: "error", icon: "cloud_off", title: "Sync Status Offline", desc: "Transactions are cached on device locally." });
    }
    if (syncStatus === "failed") {
      alerts.push({ id: 2, type: "warning", icon: "sync_problem", title: "Syncing Interrupted", desc: "Backup replication queued." });
    }
    if (socketStatus === "disconnected") {
      alerts.push({ id: 3, type: "error", icon: "database_off", title: "MongoDB Unreachable", desc: "Live sync channels disconnected." });
    }
    // Static informational logs
    alerts.push({ id: 4, type: "info", icon: "check_circle", title: "Malaabis OS Safe", desc: "Daily JSON snapshots are encrypted." });
    return alerts;
  };

  const alerts = getAlerts();

  return (
    <div className="min-h-screen bg-[#131313] text-[#e2e2e2] font-body flex overflow-hidden relative">
      {/* 1. Backdrop Mask for Mobile Drawer */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 md:hidden transition-opacity duration-300"
        />
      )}

      {/* 2. Navigation Drawer (Mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 w-80 bg-[#0e0e0e] border-r border-[#4d4635]/15 z-50 flex flex-col transition-transform duration-300 ease-out md:hidden ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#4d4635]/10 space-y-4 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Malaabis Studio" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="font-headline text-sm tracking-wider text-primary">MALAABIS STUDIO</h2>
              <p className="text-[10px] text-secondary font-medium uppercase truncate max-w-[160px]">
                {user?.username || "Admin User"} ({userRole})
              </p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold">
            <span className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 ${isOffline ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500'}`}></span>
              {isOffline ? "Offline" : "Synced"}
            </span>
            <span className={`px-2.5 py-1 rounded-full flex items-center gap-1.5 ${socketStatus === 'disconnected' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${socketStatus === 'disconnected' ? 'bg-red-500' : 'bg-green-500'}`}></span>
              {socketStatus === 'disconnected' ? "DB Offline" : "MongoDB Connected"}
            </span>
          </div>

          {/* Global Search Bar */}
          {hasAccess("operating_system") && (
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search everywhere..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                className="w-full bg-[#131313] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-primary/50 text-on-surface"
              />
              <span className="material-symbols-outlined absolute left-3 top-2 text-secondary text-sm">search</span>
            </form>
          )}
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Main Section */}
          <div className="space-y-1">
            <h4 className="text-[10px] text-outline font-bold tracking-widest uppercase pl-3 mb-2">MAIN</h4>
            {hasAccess("dashboard") && (
              <DrawerNavItem
                active={currentView === "dashboard"}
                icon="dashboard"
                label="Dashboard"
                onClick={() => { setCurrentView("dashboard"); setIsDrawerOpen(false); }}
              />
            )}
          </div>

          {/* Business Section */}
          <div className="space-y-1">
            <h4 className="text-[10px] text-outline font-bold tracking-widest uppercase pl-3 mb-2">BUSINESS</h4>
            {hasAccess("billing") && (
              <DrawerNavItem
                active={currentView === "billing"}
                icon="receipt_long"
                label="POS Billing"
                onClick={() => { setCurrentView("billing"); setIsDrawerOpen(false); }}
              />
            )}
            {hasAccess("inventory") && (
              <DrawerNavItem
                active={currentView === "inventory"}
                icon="inventory_2"
                label="Catalog"
                onClick={() => { setCurrentView("inventory"); setIsDrawerOpen(false); }}
              />
            )}
            {hasAccess("reports") && (
              <DrawerNavItem
                active={currentView === "reports"}
                icon="analytics"
                label="Reports"
                onClick={() => { setCurrentView("reports"); setIsDrawerOpen(false); }}
              />
            )}
            {hasAccess("saved_invoices") && (
              <DrawerNavItem
                active={currentView === "saved_invoices"}
                icon="bookmark"
                label="Saved Invoices"
                onClick={() => { setCurrentView("saved_invoices"); setIsDrawerOpen(false); }}
              />
            )}
            {hasAccess("suppliers") && (
              <DrawerNavItem
                active={currentView === "suppliers"}
                icon="group"
                label="Suppliers"
                onClick={() => { setCurrentView("suppliers"); setIsDrawerOpen(false); }}
              />
            )}
          </div>

          {/* AI Tools Section */}
          {hasAccess("purchase_import") && (
            <div className="space-y-1">
              <h4 className="text-[10px] text-outline font-bold tracking-widest uppercase pl-3 mb-2">AI TOOLS</h4>
              {hasAccess("purchase_import") && (
                <DrawerNavItem
                  active={currentView === "purchase_import"}
                  icon="upload_file"
                  label="AI Purchase Import"
                  onClick={() => { setCurrentView("purchase_import"); setIsDrawerOpen(false); }}
                />
              )}
              {hasAccess("ai_assistant") && (
                <DrawerNavItem
                  active={currentView === "ai_assistant"}
                  icon="assistant"
                  label="AI Assistant"
                  onClick={() => { setCurrentView("ai_assistant"); setIsDrawerOpen(false); }}
                />
              )}
              {hasAccess("purchase_analytics") && (
                <DrawerNavItem
                  active={currentView === "purchase_analytics"}
                  icon="insights"
                  label="BI Analytics"
                  onClick={() => { setCurrentView("purchase_analytics"); setIsDrawerOpen(false); }}
                />
              )}
              {hasAccess("operating_system") && (
                <DrawerNavItem
                  active={currentView === "operating_system" && !["health", "customers", "reorders", "search"].includes(currentView)}
                  icon="terminal"
                  label="AI Operating System"
                  onClick={() => navigateToOS("dashboard")}
                />
              )}
            </div>
          )}

          {/* Operating System Shortcuts Section */}
          {hasAccess("operating_system") && (
            <div className="space-y-1">
              <h4 className="text-[10px] text-outline font-bold tracking-widest uppercase pl-3 mb-2">OS Shortcuts</h4>
              <DrawerNavItem
                active={currentView === "operating_system" && false}
                icon="group"
                label="Customer Profiles"
                onClick={() => navigateToOS("customers")}
              />
              <DrawerNavItem
                active={currentView === "operating_system" && false}
                icon="order_play"
                label="Reorders & POs"
                onClick={() => navigateToOS("reorders")}
              />
              <DrawerNavItem
                active={currentView === "operating_system" && false}
                icon="settings_backup_restore"
                label="Health & Backup"
                onClick={() => navigateToOS("health")}
              />
              <DrawerNavItem
                active={currentView === "operating_system" && false}
                icon="travel_explore"
                label="Search Everywhere"
                onClick={() => navigateToOS("search")}
              />
            </div>
          )}

          {/* System Section */}
          <div className="space-y-1">
            <h4 className="text-[10px] text-outline font-bold tracking-widest uppercase pl-3 mb-2">SYSTEM</h4>
            {hasAccess("settings") && (
              <DrawerNavItem
                active={currentView === "settings"}
                icon="settings"
                label="Settings"
                onClick={() => { setCurrentView("settings"); setIsDrawerOpen(false); }}
              />
            )}
            <DrawerNavItem active={false} icon="logout" label="Logout" onClick={onLogout} />
          </div>
        </div>
      </aside>

      {/* 3. Desktop Sidebar */}
      <aside className="hidden md:flex h-screen w-72 bg-[#0e0e0e] border-r border-[#4d4635]/15 flex-col p-5 shrink-0 z-40">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 overflow-hidden shrink-0">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_circle
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-primary truncate">{user?.username || "Admin User"}</h2>
            <p className="text-[10px] font-semibold tracking-wider text-secondary uppercase truncate">
              {userRole} • Flagship Atelier
            </p>
          </div>
        </div>

        <nav className="flex-grow flex flex-col gap-1 overflow-y-auto pr-1">
          {hasAccess("dashboard") && (
            <NavItem active={currentView === "dashboard"} icon="dashboard" label="Dashboard" onClick={() => setCurrentView("dashboard")} />
          )}
          {hasAccess("billing") && (
            <NavItem active={currentView === "billing"} icon="receipt_long" label="POS Billing" onClick={() => setCurrentView("billing")} />
          )}
          {hasAccess("inventory") && (
            <NavItem active={currentView === "inventory"} icon="inventory_2" label="Catalog" onClick={() => setCurrentView("inventory")} />
          )}
          {hasAccess("reports") && (
            <NavItem active={currentView === "reports"} icon="analytics" label="Reports" onClick={() => setCurrentView("reports")} />
          )}
          {hasAccess("saved_invoices") && (
            <NavItem active={currentView === "saved_invoices"} icon="bookmark" label="Saved Invoices" onClick={() => setCurrentView("saved_invoices")} />
          )}
          {hasAccess("suppliers") && (
            <NavItem active={currentView === "suppliers"} icon="group" label="Suppliers" onClick={() => setCurrentView("suppliers")} />
          )}
          {hasAccess("purchase_import") && (
            <NavItem active={currentView === "purchase_import"} icon="upload_file" label="AI Purchase Import" onClick={() => setCurrentView("purchase_import")} />
          )}
          {hasAccess("purchase_analytics") && (
            <NavItem active={currentView === "purchase_analytics"} icon="insights" label="BI Analytics" onClick={() => setCurrentView("purchase_analytics")} />
          )}
          {hasAccess("ai_assistant") && (
            <NavItem active={currentView === "ai_assistant"} icon="assistant" label="AI Assistant" onClick={() => setCurrentView("ai_assistant")} />
          )}
          {hasAccess("operating_system") && (
            <NavItem active={currentView === "operating_system"} icon="terminal" label="Malaabis OS" onClick={() => navigateToOS("dashboard")} />
          )}
          {hasAccess("settings") && (
            <NavItem active={currentView === "settings"} icon="settings" label="Settings" onClick={() => setCurrentView("settings")} />
          )}
        </nav>

        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error/10 hover:text-error transition-all duration-200 cursor-pointer min-h-[48px] shrink-0 mt-4"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="text-xs uppercase font-semibold tracking-wider">Logout</span>
        </button>
      </aside>

      {/* 4. Main Page Container */}
      <div className="flex-grow flex flex-col h-screen overflow-hidden">
        {/* Header Bar */}
        <header className="bg-[#131313] border-b border-[#4d4635]/15 flex justify-between items-center px-4 md:px-6 py-3 w-full z-30 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Malaabis Studio" className="h-12 w-auto object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" />
            <h1 className="font-headline text-base md:text-lg tracking-widest text-primary">MALAABIS STUDIO</h1>
          </div>

          <div className="flex items-center gap-4">
            <SyncIndicator isOffline={isOffline} syncStatus={syncStatus} socketStatus={socketStatus} />

            {/* Notification Center Bell */}
            <div className="relative">
              <button
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface hover:bg-white/[0.02] border border-white/5 transition-all cursor-pointer relative"
              >
                <span className="material-symbols-outlined text-lg">notifications</span>
                {alerts.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-[#131313]" />
                )}
              </button>

              {/* Alerts Dropdown List */}
              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0e0e0e] border border-[#4d4635]/25 rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">System Alerts</span>
                    <button onClick={() => setIsAlertsOpen(false)} className="text-[10px] text-secondary hover:text-white uppercase font-semibold">Close</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {alerts.length === 0 ? (
                      <p className="text-[10px] text-secondary italic text-center py-4">No active system warnings.</p>
                    ) : (
                      alerts.map((al) => (
                        <div key={al.id} className="flex gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[10px]">
                          <span className={`material-symbols-outlined text-sm ${al.type === 'error' ? 'text-red-400' : al.type === 'warning' ? 'text-yellow-400' : 'text-primary'}`}>{al.icon}</span>
                          <div>
                            <h5 className="font-bold text-on-surface leading-tight">{al.title}</h5>
                            <p className="text-secondary leading-normal mt-0.5">{al.desc}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs text-primary font-bold">{user?.username}</span>
              <span className="text-[9px] text-secondary uppercase font-semibold tracking-wider">{userRole}</span>
            </div>
          </div>
        </header>

        {/* Content Render viewport */}
        <main className="flex-grow overflow-y-auto px-4 md:px-6 py-6 md:py-8 relative scroll-smooth pb-scroll-safe md:pb-8">
          {children}
        </main>

        {/* 5. Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-45 flex justify-around items-center px-2 py-1 pb-safe bg-[#0e0e0e] border-t border-[#4d4635]/15 rounded-t-2xl shadow-2xl">
          <BottomNavItem active={currentView === "dashboard"} icon="dashboard" label="Home" onClick={() => { setCurrentView("dashboard"); setIsDrawerOpen(false); }} />
          <BottomNavItem active={currentView === "billing"} icon="receipt_long" label="Billing" onClick={() => { setCurrentView("billing"); setIsDrawerOpen(false); }} />
          <BottomNavItem active={currentView === "inventory"} icon="inventory_2" label="Catalog" onClick={() => { setCurrentView("inventory"); setIsDrawerOpen(false); }} />
          <BottomNavItem active={currentView === "reports"} icon="analytics" label="Reports" onClick={() => { setCurrentView("reports"); setIsDrawerOpen(false); }} />
          <BottomNavItem active={isDrawerOpen} icon="menu" label="Menu" onClick={() => setIsDrawerOpen(!isDrawerOpen)} />
        </nav>

        {/* 6. Mobile AI Floating Action Button (FAB) */}
        {currentView !== "billing" && hasAccess("ai_assistant") && (
          <button
            onClick={() => setCurrentView("ai_assistant")}
            className="md:hidden fixed fab-safe-bottom w-12 h-12 rounded-full bg-primary hover:bg-[#ffe088] text-black flex items-center justify-center shadow-lg transition-transform duration-200 active:scale-95 z-45 border border-primary/20 cursor-pointer"
            title="Open AI Assistant"
          >
            <span className="material-symbols-outlined font-bold text-xl">assistant</span>
          </button>
        )}
      </div>
    </div>
  );
}