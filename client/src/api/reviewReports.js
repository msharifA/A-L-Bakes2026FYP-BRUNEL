const API = import.meta.env.VITE_API_URL || "";

export async function submitReport(reviewId, data) {
  const res = await fetch(`${API}/api/reviews/${reviewId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to submit report");
  return json;
}

export async function getReports(status = "all") {
  const url = status && status !== "all"
    ? `${API}/api/admin/review-reports?status=${status}`
    : `${API}/api/admin/review-reports`;

  const res = await fetch(url, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

export async function updateReport(id, data) {
  const res = await fetch(`${API}/api/admin/review-reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update report");
  return json;
}

export async function getReportStats() {
  const res = await fetch(`${API}/api/admin/review-reports/stats`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}
