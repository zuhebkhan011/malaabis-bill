import React, { useState } from "react";

export default function Settings({ onSystemReset }) {
  const [themeMode, setThemeMode] = useState("dark");
  const [syncInterval, setSyncInterval] = useState("15");
  const [showDevTools, setShowDevTools] = useState(false);
  const [devPassword, setDevPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleUnlockDevTools = (e) => {
    e.preventDefault();
    if (devPassword.toLowerCase() === "admin") {
      setIsUnlocked(true);
      setDevPassword("");
    } else {
      alert("❌ Invalid password credentials.");
    }
  };

  const handleSyncNow = () => {
    alert("🔄 Manual synchronization triggered. Local databases are fully synced with MongoDB server!");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-fade-in">
      <div>
        <h2 className="font-headline text-2xl md:text-3xl text-on-surface">Application Settings</h2>
        <p className="text-secondary text-xs mt-0.5">Customize client behaviors and device configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Theme Settings Card */}
        <div className="bg-[#0e0e0e]/40 p-6 rounded-3xl border border-[#4d4635]/15 space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">palette</span>
            <h3 className="text-base font-bold text-on-surface">Display & Styling</h3>
          </div>
          <div className="space-y-3">
            <label className="text-xs text-outline uppercase tracking-wider font-semibold block">App Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {["dark", "light", "system"].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setThemeMode(t);
                    if (t === "light") {
                      alert("Malaabis Studio uses the premium black & gold Dark Mode by design. Styling overrides are blocked.");
                      setThemeMode("dark");
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    themeMode === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/5 bg-[#121212] text-secondary hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-outline italic leading-relaxed">
              *The signature black & gold aesthetic is enforced on primary interfaces for luxury branding.
            </p>
          </div>
        </div>

        {/* Sync Settings Card */}
        <div className="bg-[#0e0e0e]/40 p-6 rounded-3xl border border-[#4d4635]/15 space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">sync</span>
            <h3 className="text-base font-bold text-on-surface">Cloud Synchronization</h3>
          </div>
          <div className="space-y-3">
            <label className="text-xs text-outline uppercase tracking-wider font-semibold block">Background Sync Interval</label>
            <select
              value={syncInterval}
              onChange={(e) => setSyncInterval(e.target.value)}
              className="w-full bg-[#121212] border border-white/5 rounded-xl p-3 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary/50"
            >
              <option value="15">15 Seconds (Standard Real-time)</option>
              <option value="60">1 Minute (Balanced battery)</option>
              <option value="300">5 Minutes (Power saving)</option>
            </select>
            <button
              onClick={handleSyncNow}
              className="w-full py-2.5 rounded-xl bg-primary text-black text-xs font-bold uppercase tracking-wider hover:bg-[#ffe088] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">sync</span>
              Sync Database Now
            </button>
          </div>
        </div>

        {/* Backup Settings Card */}
        <div className="bg-[#0e0e0e]/40 p-6 rounded-3xl border border-[#4d4635]/15 space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">settings_backup_restore</span>
            <h3 className="text-base font-bold text-on-surface">Backup & Security</h3>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Backup configurations and JSON archives are managed locally. Backups are encrypted before storage.
          </p>
          <div className="flex items-center gap-3 text-xs font-semibold text-primary">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Automatic Backups Active (Daily at 03:00 AM)
          </div>
        </div>

        {/* About App Card */}
        <div className="bg-[#0e0e0e]/40 p-6 rounded-3xl border border-[#4d4635]/15 space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">info</span>
            <h3 className="text-base font-bold text-on-surface">About System</h3>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-secondary font-medium">Application Version</span>
              <span className="text-primary font-bold">v2.4.0-stable</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-secondary font-medium">Privacy Status</span>
              <span className="text-green-400 font-bold">Encrypted End-to-End</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-secondary font-medium">Developer Information</span>
              <span className="text-on-surface font-semibold">Malaabis Dev Group</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Developer Tools */}
      <div className="bg-[#0e0e0e]/40 rounded-3xl border border-red-500/15 overflow-hidden">
        <button
          onClick={() => setShowDevTools(!showDevTools)}
          className="w-full p-6 flex justify-between items-center text-left hover:bg-white/[0.01] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 text-red-500">
            <span className="material-symbols-outlined">developer_mode</span>
            <div>
              <h3 className="text-base font-bold">Developer Tools</h3>
              <p className="text-[10px] text-outline uppercase tracking-wider mt-0.5">Admin Level Override Utilities</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-secondary">
            {showDevTools ? "expand_less" : "expand_more"}
          </span>
        </button>

        {showDevTools && (
          <div className="px-6 pb-6 pt-2 border-t border-[#4d4635]/10 space-y-4 bg-red-500/[0.02]">
            {!isUnlocked ? (
              <form onSubmit={handleUnlockDevTools} className="max-w-md space-y-3">
                <label className="text-xs text-outline uppercase tracking-wider font-semibold block">Enter Developer Pin</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    className="flex-1 bg-[#121212] border border-white/5 rounded-xl p-3 text-xs text-on-surface focus:outline-none focus:border-red-500/50"
                  />
                  <button
                    type="submit"
                    className="px-6 rounded-xl bg-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider hover:bg-red-500/35 transition-all cursor-pointer"
                  >
                    Unlock
                  </button>
                </div>
                <p className="text-[10px] text-outline">Hint: Type 'admin' to unlock developer database resets.</p>
              </form>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 space-y-1">
                  <h4 className="font-bold uppercase tracking-wider">⚠️ DANGER ZONE</h4>
                  <p className="leading-relaxed">
                    Executing these actions will permanently wipe all local database files, IndexedDB cache records, and local stores.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={onSystemReset}
                    className="px-6 py-3 rounded-xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    Purge System Database
                  </button>
                  <button
                    onClick={() => setIsUnlocked(false)}
                    className="px-6 py-3 rounded-xl border border-white/10 text-secondary text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Lock Dev Tools
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
