import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getReports, updateReport } from "./api/reviewReports";

export default function AdminReviewReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await getReports(filter);
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status, deleteReview = false) => {
    setActionLoading(id);
    try {
      await updateReport(id, { status, deleteReview });
      setReports(reports.filter((r) => r.id !== id));
      setSelectedReport(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const reasonLabels = {
    spam: "Spam",
    inappropriate: "Inappropriate",
    fake: "Fake Review",
    other: "Other",
  };

  if (loading && reports.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "var(--color-error)" }}>{error}</p>
        <Link to="/admin" style={{ color: "var(--color-primary)" }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/admin" style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ marginTop: 8 }}>Review Reports</h1>
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        {["pending", "reviewed", "dismissed", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: filter === f ? "var(--color-primary)" : "var(--color-bg-card)",
              color: filter === f ? "#000" : "var(--color-text)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <div
          className="card"
          style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}
        >
          No {filter !== "all" ? filter : ""} reports found
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {reports.map((report) => (
            <div key={report.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        background:
                          report.status === "pending"
                            ? "#f5a623"
                            : report.status === "reviewed"
                            ? "#28a745"
                            : "#6c757d",
                        color: report.status === "pending" ? "#000" : "#fff",
                      }}
                    >
                      {report.status}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        background: "#dc3545",
                        color: "#fff",
                      }}
                    >
                      {reasonLabels[report.reason] || report.reason}
                    </span>
                  </div>

                  <h3 style={{ marginBottom: 8 }}>
                    Review on: {report.product_name}
                  </h3>

                  <div
                    style={{
                      background: "var(--color-bg)",
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <strong>{report.reviewer_name}</strong>
                      <span style={{ color: "#f5a623" }}>
                        {"★".repeat(report.rating)}
                        {"☆".repeat(5 - report.rating)}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                      {report.comment || "(No comment)"}
                    </p>
                  </div>

                  <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 4 }}>
                    <strong>Reported by:</strong> {report.reporter_email}
                  </p>
                  {report.details && (
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 4 }}>
                      <strong>Details:</strong> {report.details}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                    Reported: {formatDate(report.created_at)}
                  </p>
                </div>

                {report.status === "pending" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={() => handleAction(report.id, "reviewed", true)}
                      disabled={actionLoading === report.id}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "#dc3545",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Delete Review
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "reviewed", false)}
                      disabled={actionLoading === report.id}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "#28a745",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => handleAction(report.id, "dismissed")}
                      disabled={actionLoading === report.id}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        background: "var(--color-bg-card)",
                        color: "var(--color-text-muted)",
                        border: "1px solid var(--color-border)",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
