export async function getProductReviews(productId, { limit = 10, offset = 0, sort = "newest" } = {}) {
  const params = new URLSearchParams({ limit, offset, sort });
  const res = await fetch(`/api/products/${productId}/reviews?${params}`);
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function submitProductReview(productId, reviewData) {
  const res = await fetch(`/api/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reviewData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to submit review");
  return data;
}

export async function adminListReviews({ status = "", productId = "", limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ status, productId, limit, offset });
  const res = await fetch(`/api/admin/reviews?${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch reviews");
  return res.json();
}

export async function adminUpdateReviewStatus(reviewId, status) {
  const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update review");
  return res.json();
}
