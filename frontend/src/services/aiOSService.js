import { API_BASE_URL } from "./apiConfig";

export const aiOSService = {
  async fetchOSSummary() {
    const response = await fetch(`${API_BASE_URL}/ai-assistant/os/summary`);
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "Failed to load dashboard summary.");
    return result;
  },

  async fetchOSCustomers() {
    const response = await fetch(`${API_BASE_URL}/ai-assistant/os/customers`);
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "Failed to load customers analysis.");
    return result;
  },

  async fetchOSReorders() {
    const response = await fetch(`${API_BASE_URL}/ai-assistant/os/reorders`);
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "Failed to load reorder suggestions.");
    return result;
  },

  async fetchOSHealth() {
    const response = await fetch(`${API_BASE_URL}/ai-assistant/os/health`);
    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "Failed to load diagnostics.");
    return result;
  },

  async triggerBackupDownload() {
    // Navigate browser to download endpoint directly
    window.open(`${API_BASE_URL}/ai-assistant/os/backup`, "_blank");
  },

  async restoreBackup(backupData) {
    const response = await fetch(`${API_BASE_URL}/ai-assistant/os/restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backupData),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) throw new Error(result?.error || "Failed to restore backup.");
    return result;
  }
};

export default aiOSService;
