import { useState } from "react";
import { submitProductReview } from "../api/reviews";

export default function ReviewForm({ productId, productName, orderId = null, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await submitProductReview(productId, {
        orderId,
        customerName,
        customerEmail,
        rating,
        reviewText,
      });

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="alert alert-success" style={{ marginTop: 24, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 48 }}>🎉</span>
          <div>
            <h3 style={{ margin: 0, color: "var(--color-success)" }}>✓ Review Posted!</h3>
          </div>
        </div>
        <p style={{ margin: "8px 0 0 0" }}>
          Thank you for your {rating}-star review! Your feedback helps other customers and improves our service.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>Write a Review for {productName}</h3>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Your Rating <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "2.5em",
                    cursor: "pointer",
                    color: star <= (hoverRating || rating) ? "#F5A623" : "#E8E3DD",
                    padding: 0,
                    transition: "color 0.2s ease, transform 0.2s ease",
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "scale(0.9)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div style={{ marginTop: 8, fontSize: 14, color: "var(--color-text-muted)" }}>
                You selected {rating} {rating === 1 ? "star" : "stars"}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Your Name <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              placeholder="e.g. Sarah J."
              style={{ width: "100%", padding: "12px 14px" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Email <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
              placeholder="sarah@example.com"
              style={{ width: "100%", padding: "12px 14px" }}
            />
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
              Your email won't be published
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Your Review <span style={{ color: "var(--color-error)" }}>*</span>
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
              minLength={10}
              rows={5}
              placeholder="Tell us about your experience with this product..."
              style={{ width: "100%", padding: "12px 14px", resize: "vertical" }}
            />
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
              Minimum 10 characters
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !rating}
            className="primary"
            style={{
              padding: "14px 20px",
              fontSize: "1.05em",
              cursor: submitting || !rating ? "not-allowed" : "pointer"
            }}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>

          <div style={{ fontSize: 12, color: "var(--color-text-muted)", textAlign: "center" }}>
            Your review will be published after approval
          </div>
        </form>
      </div>
    </div>
  );
}
