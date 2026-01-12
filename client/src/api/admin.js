export async function adminListOrders({ status = "", q = "", limit = 20, offset = 0 } = {}) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    params.set("limit", String(limit));
    params.set("offset", String(offset));
  
    const res = await fetch(`/api/admin/orders?${params.toString()}`, {
      credentials: "include", // ✅ send httpOnly cookie
    });
  
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load orders");
    return data;
  }
  
  export async function adminGetOrder(orderId) {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      credentials: "include", // ✅
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to load order");
    return data;
  }
  
  export async function adminUpdateOrderStatus(orderId, status, message = "") {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      credentials: "include", // ✅
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to update status");
    return data;
  }
  
  