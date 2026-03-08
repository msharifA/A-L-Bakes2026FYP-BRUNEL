const API = "/api/admin/enquiries";

export async function adminListEnquiries({ status = "", limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  const res = await fetch(`${API}?${params.toString()}`, {
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to load enquiries");
  return data;
}

export async function adminUpdateEnquiry(id, { status, adminNotes } = {}) {
  const res = await fetch(`${API}/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, adminNotes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to update enquiry");
  return data;
}
