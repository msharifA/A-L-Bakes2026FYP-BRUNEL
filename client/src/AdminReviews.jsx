import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminListReviews, adminUpdateReviewStatus } from "./api/reviews";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await adminListReviews({ status: filter });
      setReviews(data.reviews);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStatus(reviewId, status) {
    try {
      await adminUpdateReviewStatus(reviewId, status);
      loadReviews();
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Review Management</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/admin">Back to Dashboard</Link>
        </div>
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ fontWeight: 500 }}>Filter by status:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "10px 14px", minWidth: 150 }}
        >
          <option value="">All Reviews</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {filter === "pending" && reviews.length > 0 && (
          <span className="badge badge-warning" style={{ marginLeft: 8 }}>
            {reviews.length} pending
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div className="spinner" style={{ margin: "0 auto" }}></div>
          <p style={{ marginTop: 16 }}>Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            {filter ? `No ${filter} reviews found.` : "No reviews yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="card"
              style={{
                padding: 20,
                borderLeft: `4px solid ${
                  review.status === "approved"
                    ? "var(--color-success)"
                    : review.status === "rejected"
                    ? "var(--color-error)"
                    : "var(--color-warning)"
                }`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <strong style={{ fontSize: 16 }}>{review.product_name}</strong>
                    <span
                      className={`badge ${
                        review.status === "approved"
                          ? "badge-success"
                          : review.status === "rejected"
                          ? "badge-error"
                          : "badge-warning"
                      }`}
                    >
                      {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>
                    by <strong>{review.customer_name}</strong> ({review.customer_email})
                    {review.verified_purchase && (
                      <span className="badge badge-success" style={{ marginLeft: 8, fontSize: 11 }}>
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 14 }}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "right" }}>
                  {new Date(review.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <p style={{ margin: "0 0 16px 0", lineHeight: 1.6, padding: 12, background: "var(--color-bg-secondary)", borderRadius: "var(--radius-sm)" }}>
                "{review.review_text}"
              </p>

              {review.status === "pending" && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => updateStatus(review.id, "approved")}
                    className="success"
                    style={{ padding: "10px 20px" }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => updateStatus(review.id, "rejected")}
                    style={{ padding: "10px 20px" }}
                  >
                    ✗ Reject
                  </button>
                </div>
              )}

              {review.status === "approved" && (
                <button
                  onClick={() => updateStatus(review.id, "rejected")}
                  style={{ padding: "10px 20px", fontSize: 14 }}
                >
                  Unpublish
                </button>
              )}

              {review.status === "rejected" && (
                <button
                  onClick={() => updateStatus(review.id, "approved")}
                  className="success"
                  style={{ padding: "10px 20px", fontSize: 14 }}
                >
                  Publish
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
