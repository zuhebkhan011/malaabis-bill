import { API_BASE_URL } from "./apiConfig";

export const purchaseImportService = {
  /**
   * Reads selected file, handles compression, tracks upload progress, and retries on network issue.
   * @param {File} file 
   * @param {function} onProgress - Callback for tracking status/percentage.
   */
  async processInvoiceFile(file, onProgress) {
    // 1. File Type and Size Validation
    const supportedMimes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const fileMime = file.type || this.getMimeFromExtension(file.name);
    if (!supportedMimes.includes(fileMime)) {
      throw new Error(`Unsupported file type: ${file.name}. Please upload a PDF, JPEG, or PNG invoice document.`);
    }

    if (file.size > 30 * 1024 * 1024) {
      throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 30 MB.`);
    }

    // 2. Auto-compress large images client-side
    let fileToUpload = file;
    if (fileMime.startsWith("image/") && file.size > 1.5 * 1024 * 1024) {
      if (onProgress) onProgress({ status: "compressing", percentage: 0 });
      try {
        fileToUpload = await this.compressImage(file);
      } catch (compressErr) {
        console.warn("Client-side image compression failed, uploading original:", compressErr);
      }
      if (onProgress) onProgress({ status: "compressing", percentage: 100 });
    }

    // 3. Upload handler with auto-retry
    const executeUpload = () => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE_URL}/ai-import/analyze`);

        // Track upload progress
        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              onProgress({ status: "uploading", percentage: pct });
            }
          };
        }

        xhr.onload = () => {
          let payload = null;
          try {
            payload = JSON.parse(xhr.responseText);
          } catch (e) {
            payload = null;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(payload);
          } else {
            const errMsg = payload?.error || `Upload failed with status ${xhr.status}`;
            const err = new Error(errMsg);
            err.status = xhr.status;
            reject(err);
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network connection failure. Please check your internet connection and try again."));
        };

        const formData = new FormData();
        formData.append("file", fileToUpload);
        xhr.send(formData);
      });
    };

    try {
      if (onProgress) onProgress({ status: "uploading", percentage: 0 });
      return await executeUpload();
    } catch (firstErr) {
      // Auto-retry once on network connection failure (status 0)
      const isNetworkIssue = !firstErr.status || firstErr.status === 0;
      if (isNetworkIssue) {
        console.warn("[AI-Import] Upload failed due to network. Retrying once...");
        if (onProgress) onProgress({ status: "retrying", percentage: 0 });
        return await executeUpload();
      }
      throw firstErr;
    }
  },

  /**
   * Client-side canvas image compressor (maintains sharp quality for OCR).
   */
  compressImage(file, maxWidth = 2048, maxHeight = 2048, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Canvas blob extraction failed."));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }, "image/jpeg", quality);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  },

  /**
   * Sends the confirmed matching payload to backend to execute the inventory updates.
   * @param {object} payload 
   * @param {boolean} overrideDuplicate 
   */
  async commitPurchaseImport(payload, overrideDuplicate = false) {
    const response = await fetch(`${API_BASE_URL}/ai-import/commit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        overrideDuplicate,
      }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const err = new Error(result?.error || `Commit failed with status ${response.status}`);
      if (result?.code === "DUPLICATE_INVOICE") {
        err.code = "DUPLICATE_INVOICE";
        err.details = result.details;
      }
      throw err;
    }

    return result;
  },

  /**
   * Triggers rollback undo import on the backend.
   * @param {string} purchaseHistoryId 
   */
  async undoPurchaseImport(purchaseHistoryId) {
    const response = await fetch(`${API_BASE_URL}/ai-import/undo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purchaseHistoryId }),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || `Undo failed with status ${response.status}`);
    }

    return result;
  },

  async fetchSuppliers() {
    const response = await fetch(`${API_BASE_URL}/ai-import/suppliers`);
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "Failed to load suppliers.");
    return result;
  },

  async fetchSupplierProfile(id) {
    const response = await fetch(`${API_BASE_URL}/ai-import/suppliers/${id}`);
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "Failed to load supplier profile.");
    return result;
  },

  async fetchBIAnalytics() {
    const response = await fetch(`${API_BASE_URL}/ai-import/analytics`);
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "Failed to load analytics.");
    return result;
  },

  async searchBI(query) {
    const response = await fetch(`${API_BASE_URL}/ai-import/search?q=${encodeURIComponent(query)}`);
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "Search failed.");
    return result;
  },

  /**
   * FileReader wrapper returning a promise resolving to Base64 data string.
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  },

  /**
   * Helper fallback when file type is empty
   */
  getMimeFromExtension(filename) {
    const ext = filename.split(".").pop().toLowerCase();
    if (ext === "pdf") return "application/pdf";
    if (ext === "png") return "image/png";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    return "image/jpeg";
  }
};

export default purchaseImportService;
