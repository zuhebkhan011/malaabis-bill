const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getProducts() {
  return requestJson("/products");
}

export async function createProduct(productData) {
  return requestJson("/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(id, productData) {
  return requestJson(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(productData),
  });
}

export async function removeProduct(id) {
  return requestJson(`/products/${id}`, {
    method: "DELETE",
  });
}

export { API_BASE_URL };