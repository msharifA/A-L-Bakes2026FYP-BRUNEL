const API = import.meta.env.VITE_API_URL || "";

export async function getProducts() {
  const res = await fetch(`${API}/api/admin/products`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function getProduct(id) {
  const res = await fetch(`${API}/api/admin/products/${id}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export async function createProduct(data) {
  const res = await fetch(`${API}/api/admin/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create product");
  return json;
}

export async function updateProduct(id, data) {
  const res = await fetch(`${API}/api/admin/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update product");
  return json;
}

export async function deleteProduct(id) {
  const res = await fetch(`${API}/api/admin/products/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete product");
  return res.json();
}

export async function toggleFeatured(id) {
  const res = await fetch(`${API}/api/admin/products/${id}/toggle-featured`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to toggle featured");
  return res.json();
}

export async function toggleActive(id) {
  const res = await fetch(`${API}/api/admin/products/${id}/toggle-active`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to toggle active");
  return res.json();
}
