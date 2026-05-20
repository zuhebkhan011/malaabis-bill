import React from "react";

export default function SyncIndicator({ isOffline, syncStatus }) {
  let label = "Online";
  let cls = "text-secondary";
  if (isOffline) {
    label = "Offline";
    cls = "text-error";
  } else if (syncStatus === "syncing") {
    label = "Syncing...";
    cls = "text-primary";
  } else if (syncStatus === "failed") {
    label = "Sync Failed";
    cls = "text-error";
  } else if (syncStatus === "ok") {
    label = "Synced";
    cls = "text-primary";
  }

  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${cls}`} title={`Sync status: ${label}`}>
      <span className="material-symbols-outlined">cloud</span>
      <span>{label}</span>
    </div>
  );
}
