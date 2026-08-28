import React, { useEffect, useMemo, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

function normalizeBarcode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export default function BarcodeScanner({ open, onClose, onDetected }) {
  const scannerRef = useRef(null);
  const onDetectedRef = useRef(onDetected);
  const lastScanRef = useRef({ code: "", at: 0 });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Preparing camera...");
  const [manualCode, setManualCode] = useState("");

  const supportsCamera = useMemo(
    () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia,
    []
  );

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    let mounted = true;
    let hasStarted = false;

    const handleDetected = (result) => {
      const code = normalizeBarcode(result?.codeResult?.code);
      if (!code) {
        return;
      }

      const now = Date.now();
      const lastScan = lastScanRef.current;
      if (lastScan.code === code && now - lastScan.at < 1400) {
        return;
      }

      lastScanRef.current = { code, at: now };
      setStatus(`Scanned ${code}`);
      onDetectedRef.current?.(code, result);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
    };

    if (!supportsCamera) {
      setError("Camera access is unavailable on this device or browser.");
      setStatus("Manual entry only");
      return undefined;
    }

    const targetElement = scannerRef.current;
    if (!targetElement) {
      return undefined;
    }

    setError("");
    setStatus("Starting camera...");

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          target: targetElement,
          constraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          area: {
            top: "14%",
            right: "10%",
            left: "10%",
            bottom: "18%",
          },
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: Math.max(
          1,
          Math.min(4, typeof navigator !== "undefined" && navigator.hardwareConcurrency ? navigator.hardwareConcurrency - 1 : 2)
        ),
        frequency: 10,
        locate: true,
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "upc_reader",
            "upc_e_reader",
            "code_39_reader",
          ],
        },
      },
      (initError) => {
        if (!mounted) {
          return;
        }

        if (initError) {
          setError(initError.message || "Unable to start the scanner.");
          setStatus("Manual entry only");
          return;
        }

        Quagga.onDetected(handleDetected);
        Quagga.start();
        hasStarted = true;
        setStatus("Scanner ready");
      }
    );

    return () => {
      mounted = false;
      if (hasStarted) {
        try {
          Quagga.offDetected(handleDetected);
        } catch (_error) {
          // Quagga2 exposes offDetected in recent builds, but stopping is still enough if unavailable.
        }

        try {
          Quagga.stop();
        } catch (_error) {
          // Ignore stop errors during unmount.
        }
      }
    };
  }, [open, supportsCamera]);

  const submitManualCode = () => {
    const code = normalizeBarcode(manualCode);
    if (!code) {
      return;
    }

    onDetected?.(code);
    setManualCode("");
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-secondary">Barcode Scanner</p>
          <h2 className="text-lg font-semibold text-white mt-1">Fullscreen camera scan</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Close scanner"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-black">
        <div ref={scannerRef} className="scanner-camera h-full w-full" />

        <div className="scanner-overlay absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/15 to-black/80" />
          <div className="absolute inset-x-0 top-24 flex justify-center">
            <div className="w-[82vw] max-w-[360px] aspect-[3/4] border border-primary/80 rounded-[28px] shadow-[0_0_0_999px_rgba(0,0,0,0.35)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(242,202,80,0.08),transparent)] animate-scan-line" />
              <div className="absolute inset-x-6 top-6 flex justify-between text-[10px] uppercase tracking-[0.24em] text-white/80">
                <span>Align barcode</span>
                <span>{status}</span>
              </div>
              <div className="absolute inset-x-8 top-1/2 h-px bg-primary shadow-[0_0_18px_rgba(242,202,80,0.9)] animate-scan-line" />
            </div>
          </div>
        </div>

        <div className="absolute left-0 right-0 bottom-0 p-4 pb-safe bg-gradient-to-t from-black via-black/95 to-black/70 border-t border-white/10">
          <div className="max-w-xl mx-auto space-y-3">
            <p className="text-sm text-secondary text-center">
              {error || "Point the camera at a product barcode. The cart will update automatically after a scan."}
            </p>

            <div className="flex gap-2">
              <input
                className="flex-1 min-h-[48px] rounded-xl bg-white/8 border border-white/15 px-4 text-white placeholder:text-white/45 focus:outline-none focus:border-primary"
                placeholder="Manual barcode entry"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    submitManualCode();
                  }
                }}
              />
              <button
                type="button"
                onClick={submitManualCode}
                className="min-w-[96px] px-4 rounded-xl bg-primary text-black font-semibold uppercase tracking-wider"
              >
                Add
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-white/55">
              <span>{supportsCamera ? "Camera ready on Android Chrome" : "Camera not supported on this device"}</span>
              <span>Fast scan mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}