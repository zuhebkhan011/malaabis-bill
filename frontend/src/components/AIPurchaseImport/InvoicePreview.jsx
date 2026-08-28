import React, { useEffect, useState } from "react";

export default function InvoicePreview({ file }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) return;
    const isImage = file.type && file.type.startsWith("image/");
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  if (!file) {
    return (
      <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Invoice Preview</h4>
        <div className="w-full h-64 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center justify-center space-y-3">
            <span className="material-symbols-outlined text-primary text-5xl animate-pulse">description</span>
            <p className="text-xs text-outline">Simulated invoice scanning...</p>
          </div>
        </div>
      </div>
    );
  }

  const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

  return (
    <div className="bg-[#121212] border border-[#4d4635]/15 rounded-2xl p-5 space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Invoice Preview</h4>
      <div className="w-full h-64 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
        {isPdf ? (
          <div className="flex flex-col items-center justify-center space-y-3 p-4">
            <span className="material-symbols-outlined text-red-500 text-5xl">picture_as_pdf</span>
            <div className="text-center max-w-full">
              <p className="text-sm font-semibold text-on-surface truncate px-2">{file.name}</p>
              <p className="text-[10px] text-outline mt-1 uppercase tracking-wider font-semibold">
                {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "N/A"} · PDF Document
              </p>
            </div>
          </div>
        ) : (
          <img
            src={previewUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60"}
            alt="Invoice preview"
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
}
