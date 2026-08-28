import { API_BASE_URL } from "./apiConfig";

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

export async function getBillById(idOrNumber) {
  return requestJson(`/bills/${encodeURIComponent(idOrNumber)}`);
}

export async function uploadBillPDF(id, pdfData) {
  return requestJson(`/bills/${id}/pdf`, {
    method: "PUT",
    body: JSON.stringify({ pdfData }),
  });
}

export async function updateBill(id, billData) {
  return requestJson(`/bills/${id}`, {
    method: "PUT",
    body: JSON.stringify(billData),
  });
}

export async function deleteBill(id) {
  return requestJson(`/bills/${id}`, {
    method: "DELETE",
  });
}
