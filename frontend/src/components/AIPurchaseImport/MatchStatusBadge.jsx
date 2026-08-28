import React from "react";

export default function MatchStatusBadge({ status }) {
  switch (status) {
    case "exact":
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 px-2.5 py-1 rounded">
          Exact Match
        </span>
      );
    case "similar":
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/35 px-2.5 py-1 rounded">
          Similar Match
        </span>
      );
    case "new":
    default:
      return (
        <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/35 px-2.5 py-1 rounded">
          New Product
        </span>
      );
  }
}
