import React, { useRef } from "react";

export default function PurchaseUploader({ onFileSelected }) {
  const cameraInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header and Description */}
      <div className="text-center space-y-3">
        <h3 className="font-headline text-2xl md:text-3xl text-on-surface">AI Purchase Import</h3>
        <p className="text-sm text-secondary leading-relaxed max-w-2xl mx-auto">
          Import supplier invoices using AI. Upload an invoice image or PDF, review extracted products and update inventory after confirmation.
        </p>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg"
        className="hidden"
      />
      <input
        type="file"
        ref={pdfInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      {/* Large Uploader Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Card 1: Capture Camera */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-8 bg-[#121212] border border-[#4d4635]/20 hover:border-primary/50 hover:bg-white/[0.02] rounded-2xl transition-all duration-300 group cursor-pointer space-y-4 min-h-[220px]"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/25 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
            <span className="material-symbols-outlined text-primary text-3xl">photo_camera</span>
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface">Capture Invoice</h4>
            <p className="text-xs text-outline">Open mobile camera</p>
          </div>
        </button>

        {/* Card 2: Upload Gallery Image */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-8 bg-[#121212] border border-[#4d4635]/20 hover:border-primary/50 hover:bg-white/[0.02] rounded-2xl transition-all duration-300 group cursor-pointer space-y-4 min-h-[220px]"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/25 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
            <span className="material-symbols-outlined text-primary text-3xl">image</span>
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface">Upload Image</h4>
            <p className="text-xs text-outline">Select JPG, JPEG, PNG</p>
          </div>
        </button>

        {/* Card 3: Upload PDF Document */}
        <button
          onClick={() => pdfInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-8 bg-[#121212] border border-[#4d4635]/20 hover:border-primary/50 hover:bg-white/[0.02] rounded-2xl transition-all duration-300 group cursor-pointer space-y-4 min-h-[220px]"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/25 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
            <span className="material-symbols-outlined text-primary text-3xl">picture_as_pdf</span>
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface">Upload PDF</h4>
            <p className="text-xs text-outline">Select PDF from device</p>
          </div>
        </button>
      </div>

      {/* Info Badge */}
      <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl flex gap-3 max-w-2xl mx-auto mt-6">
        <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">info</span>
        <p className="text-xs text-secondary leading-relaxed">
          AI extraction is safe and automated. All uploaded files are parsed using Google Gemini AI models to populate products and inventory lists automatically.
        </p>
      </div>
    </div>
  );
}
