const API = import.meta.env.VITE_API_URL || "";

export async function getOverview() {
  const res = await fetch(`${API}/api/admin/reports/overview`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch overview");
  return res.json();
}

export async function getSalesByPeriod(period = "day", days = 30) {
  const res = await fetch(`${API}/api/admin/reports/sales-by-period?period=${period}&days=${days}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch sales data");
  return res.json();
}

export async function getTopProducts(limit = 10, days = 30) {
  const res = await fetch(`${API}/api/admin/reports/top-products?limit=${limit}&days=${days}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch top products");
  return res.json();
}

export async function getRecentOrders(limit = 10) {
  const res = await fetch(`${API}/api/admin/reports/recent-orders?limit=${limit}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch recent orders");
  return res.json();
}
