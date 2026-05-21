const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function requestJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload;
}

export async function getReportsDashboard(timeframe = "WEEKLY") {
<<<<<<< HEAD
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return requestJson(`/reports/dashboard?timeframe=${encodeURIComponent(timeframe)}&timezone=${encodeURIComponent(tz)}`);
=======
  return requestJson(`/reports/dashboard?timeframe=${encodeURIComponent(timeframe)}`);
>>>>>>> 8f307e9dc34d0fb8cabee8a6a53f983ecf55b3a9
}