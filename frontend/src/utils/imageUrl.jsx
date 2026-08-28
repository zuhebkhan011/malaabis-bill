import { API_BASE_URL } from "../services/productApi";

// Curated high-quality fashion fallback images from Unsplash
const FASHION_FALLBACKS = [
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80",
];

export const DEFAULT_PRODUCT_IMAGE = FASHION_FALLBACKS[0];

export const getProductImageUrl = (url) => {
  if (!url || url.trim() === "") {
    return DEFAULT_PRODUCT_IMAGE;
  }

  // Already a full URL (Cloudinary, Unsplash, etc.)
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Local /uploads/ path — prefix with backend API base URL
  const base = (API_BASE_URL || "https://malaabis-bill.onrender.com").replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
};

// Returns a deterministic fallback image based on product name
export const getFallbackImage = (productName = "") => {
  const index = productName.charCodeAt(0) % FASHION_FALLBACKS.length;
  return FASHION_FALLBACKS[index] || FASHION_FALLBACKS[0];
};
