import React from "react";

export default function SyncIndicator({ isOffline, syncStatus, socketStatus }) {
  // 1. Determine Cloud local DB sync state
  let cloudIcon = "cloud";
  let cloudLabel = "Online";
  let cloudCls = "text-secondary";

  if (isOffline) {
    cloudIcon = "cloud_off";
    cloudLabel = "Offline";
    cloudCls = "text-error";
  } else if (syncStatus === "syncing") {
    cloudIcon = "sync";
    cloudLabel = "Syncing...";
    cloudCls = "text-primary animate-spin";
  } else if (syncStatus === "failed") {
    cloudIcon = "cloud_sync";
    cloudLabel = "Sync Failed";
    cloudCls = "text-error";
  } else if (syncStatus === "ok") {
    cloudIcon = "cloud_done";
    cloudLabel = "Synced";
    cloudCls = "text-primary";
  }

  // 2. Determine Socket.IO real-time sync state
  let socketLabel = "Live Offline";
  let dotColor = "bg-error"; // Red/Orange for disconnected
  let dotPulse = "";
  
  if (isOffline) {
    socketLabel = "Live Offline";
    dotColor = "bg-[#555]"; // Gray for offline
    dotPulse = "";
  } else if (socketStatus === "connected") {
    socketLabel = "Live Sync Active";
    dotColor = "bg-[#d4af37]"; // Gold for connected/sync active
    dotPulse = "animate-ping";
  } else if (socketStatus === "connecting") {
    socketLabel = "Reconnecting...";
    dotColor = "bg-[#eab308]"; // Yellow for connecting
    dotPulse = "animate-pulse";
  }

  return (
    <div className="flex items-center gap-3 bg-[#151515] px-3.5 py-1.5 rounded-full border border-[#4d4635]/25 shadow-inner">
      {/* Cloud Local Cache Status */}
      <div className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase ${cloudCls}`} title={`Database sync: ${cloudLabel}`}>
        <span className={`material-symbols-outlined text-sm ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}>{cloudIcon}</span>
        <span>{cloudLabel}</span>
      </div>

      {/* Vertical divider */}
      <div className="h-3 w-[1px] bg-[#4d4635]/25" />

      {/* Real-time Socket Live Sync Status */}
      <div className="flex items-center gap-1.5" title={`Real-time sync: ${socketLabel}`}>
        <div className="relative flex h-2 w-2">
          {socketStatus === "connected" && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor} ${dotPulse}`}></span>
          )}
          {socketStatus === "connecting" && (
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor} ${dotPulse}`}></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
        </div>
        <span className="text-[9px] uppercase font-bold tracking-widest text-[#99907c]">
          {socketStatus === "connected" ? "LIVE" : socketStatus === "connecting" ? "SYNCING" : "LIVE OFFLINE"}
        </span>
      </div>
    </div>
  );
}
