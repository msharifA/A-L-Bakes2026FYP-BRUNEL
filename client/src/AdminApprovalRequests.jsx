import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminApprovalRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API}/api/auth/admin/approval-requests`, {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Not authenticated");
        }
        throw new Error("Failed to fetch requests");
      }

      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await fetch(`${API}/api/auth/admin/approval-requests/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to approve request");
      }

      setRequests(requests.filter((r) => r.id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!confirm("Are you sure you want to reject this request?")) return;

    setActionLoading(id);
    try {
      const res = await fetch(`${API}/api/auth/admin/approval-requests/${id}/reject`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to reject request");
      }

      setRequests(requests.filter((r) => r.id !== id));
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

  if (loading) {
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
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/admin" style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          ← Back to Dashboard
        </Link>
      </div>

      <h1 style={{ marginBottom: 24 }}>Admin Approval Requests</h1>

      {requests.length === 0 ? (
        <div
          className="card"
          style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}
        >
          No pending approval requests
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {requests.map((req) => (
            <div
              key={req.id}
              className="card"
              style={{
                padding: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <h3 style={{ marginBottom: 4 }}>
                  {req.first_name} {req.last_name}
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 4 }}>
                  {req.email}
                </p>
                <p style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                  Requested: {formatDate(req.created_at)}
                </p>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={actionLoading === req.id}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: "#28a745",
                    color: "#fff",
                    border: "none",
                    cursor: actionLoading === req.id ? "not-allowed" : "pointer",
                    opacity: actionLoading === req.id ? 0.7 : 1,
                  }}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  disabled={actionLoading === req.id}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: "#dc3545",
                    color: "#fff",
                    border: "none",
                    cursor: actionLoading === req.id ? "not-allowed" : "pointer",
                    opacity: actionLoading === req.id ? 0.7 : 1,
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
