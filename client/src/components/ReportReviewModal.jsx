import { useState } from "react";
import { submitReport } from "../api/reviewReports";

export default function ReportReviewModal({ reviewId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    email: "",
    reason: "",
    details: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reasons = [
    { value: "spam", label: "Spam or advertising" },
    { value: "inappropriate", label: "Inappropriate content" },
    { value: "fake", label: "Fake or misleading review" },
    { value: "other", label: "Other" },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.reason) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await submitReport(reviewId, form);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: 450,
          width: "100%",
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 16 }}>Report Review</h2>

        {error && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              borderRadius: 8,
              background: "rgba(220, 53, 69, 0.1)",
              color: "var(--color-error)",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Your Email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              style={{ padding: 12, width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Reason for Report *
            </label>
            <select
              name="reason"
              value={form.reason}
              onChange={handleChange}
              required
              style={{ padding: 12, width: "100%" }}
            >
              <option value="">Select a reason...</option>
              {reasons.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Additional Details
            </label>
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              placeholder="Please provide any additional context..."
              rows={3}
              style={{ padding: 12, width: "100%", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                background: "#dc3545",
                color: "#fff",
                fontWeight: 600,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                background: "var(--color-bg-card)",
                color: "var(--color-text)",
                border: "1px solid var(--color-border)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
