/**
 * Central API base URL resolver for all frontend services.
 *
 * Routing Logic:
 * 1. Android APK (Capacitor native platform):
 *    → Uses VITE_API_URL (Render production backend) — works from any network.
 *
 * 2. Desktop/browser on localhost:
 *    → Uses http://localhost:5000 directly.
 *
 * 3. Desktop/browser accessed via LAN IP (e.g. http://192.168.1.14:5173):
 *    → Uses http://<that-same-ip>:5000 automatically.
 *
 * 4. Production web (any other host):
 *    → Uses VITE_API_URL (Render production backend).
 */

import { Capacitor } from "@capacitor/core";

export function getApiBaseUrl() {
  const prodUrl = import.meta.env.VITE_API_URL || "https://malaabis-bill.onrender.com";

  // Android / iOS native WebView (Capacitor) → always use Render production
  if (Capacitor.isNativePlatform()) {
    console.log("[API] Native platform → using Render backend:", prodUrl);
    return prodUrl;
  }

  // Web browser: resolve dynamically from the current hostname
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isLanIp =
      /^192\.168\./.test(hostname) ||
      /^10\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isLocalhost) {
      return "http://localhost:5000";
    }
    if (isLanIp) {
      return `http://${hostname}:5000`;
    }
  }

  return prodUrl;
}

// Singleton – resolved once at module load time
export const API_BASE_URL = getApiBaseUrl();
