const API_BASE_URL = import.meta.env.VITE_API_URL ;

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload;
}

export async function createBill(billData) {
  return requestJson("/bills/checkout", {
    method: "POST",
    body: JSON.stringify(billData),
  });
}

export async function getBills() {
  return requestJson("/bills");
}
