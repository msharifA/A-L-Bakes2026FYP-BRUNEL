import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminListEnquiries, adminUpdateEnquiry } from "./api/adminEnquiries";
import { formatGBP } from "./utils/formatGBP";

const STATUS_OPTIONS = ["", "new", "deposit_paid", "in_progress", "ready", "completed", "cancelled"];

function nice(s) {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(s) {
  const colors = {
    new: "#3498db",
    deposit_paid: "#f5a623",
    in_progress: "#9b59b6",
    ready: "#2ecc71",
    completed: "#27ae60",
    cancelled: "#e74c3c",
  };
  return colors[s] || "#888";
}

export default function AdminEnquiries() {
  const nav = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const canPrev = offset > 0;
  const canNext = enquiries.length === limit;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await adminListEnquiries({ status: statusFilter, limit, offset });
        if (!cancelled) setEnquiries(data.enquiries || []);
      } catch (e) {
        if (e.message?.toLowerCase().includes("not authenticated")) {
          nav("/admin/login");
          return;
        }
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [statusFilter, limit, offset, nav]);

  function selectEnquiry(enq) {
    setSelected(enq);
    setNewStatus(enq.status);
    setAdminNotes(enq.admin_notes || "");
  }

  async function handleSave() {
    if (!selected) return;
    try {
      setSaving(true);
      const data = await adminUpdateEnquiry(selected.id, { status: newStatus, adminNotes });
      setSelected(data.enquiry);
      setEnquiries((prev) => prev.map((e) => (e.id === data.enquiry.id ? data.enquiry : e)));
    } catch (e) {
      if (e.message?.toLowerCase().includes("not authenticated")) {
        nav("/admin/login");
        return;
      }
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  const refImages = selected?.reference_images ? (() => { try { return JSON.parse(selected.reference_images); } catch { return []; } })() : [];

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Cake Enquiries</h1>
        <a href="/admin" style={{ color: "var(--color-primary)" }}>Back to Dashboard</a>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <label>
          Status{" "}
          <select value={statusFilter} onChange={(e) => { setOffset(0); setStatusFilter(e.target.value); }}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s ? nice(s) : "All"}</option>
            ))}
          </select>
        </label>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setOffset(Math.max(0, offset - limit))} disabled={!canPrev || loading}>Prev</button>
          <button onClick={() => setOffset(offset + limit)} disabled={!canNext || loading}>Next</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        {/* Enquiries list */}
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 16, background: "var(--color-bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ marginTop: 0 }}>Enquiries</h2>
          {loading && <p>Loading...</p>}
          {!loading && error && <p style={{ color: "salmon" }}>{error}</p>}
          {!loading && !error && enquiries.length === 0 && <p>No enquiries found.</p>}

          {!loading && !error && enquiries.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ padding: "10px 8px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "10px 8px", textAlign: "left" }}>Customer</th>
                  <th style={{ padding: "10px 8px", textAlign: "left" }}>Cake</th>
                  <th style={{ padding: "10px 8px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "10px 8px", textAlign: "left" }}>Deposit</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enq) => (
                  <tr
                    key={enq.id}
                    onClick={() => selectEnquiry(enq)}
                    style={{
                      cursor: "pointer",
                      background: selected?.id === enq.id ? "rgba(245,166,35,0.1)" : "transparent",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <td style={{ padding: "10px 8px", fontSize: 13 }}>{new Date(enq.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "10px 8px", fontSize: 13 }}>{enq.customer_name}</td>
                    <td style={{ padding: "10px 8px", fontSize: 13 }}>{enq.cake_size} {enq.cake_flavour}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: statusColor(enq.status) + "22", color: statusColor(enq.status) }}>
                        {nice(enq.status)}
                      </span>
                    </td>
                    <td style={{ padding: "10px 8px", fontSize: 13 }}>{nice(enq.deposit_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Enquiry detail */}
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 16, background: "var(--color-bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ marginTop: 0 }}>Enquiry Details</h2>

          {!selected && <p>Select an enquiry to view details.</p>}

          {selected && (
            <>
              <div style={{ background: "var(--color-bg-secondary)", padding: 16, borderRadius: 10, marginBottom: 16 }}>
                <p style={{ margin: "4px 0" }}><strong>Customer:</strong> {selected.customer_name}</p>
                <p style={{ margin: "4px 0" }}><strong>Email:</strong> {selected.customer_email}</p>
                {selected.customer_phone && <p style={{ margin: "4px 0" }}><strong>Phone:</strong> {selected.customer_phone}</p>}
                <p style={{ margin: "4px 0" }}><strong>Submitted:</strong> {new Date(selected.created_at).toLocaleString()}</p>
              </div>

              <h3 style={{ marginBottom: 8 }}>Cake Details</h3>
              <p style={{ margin: "4px 0" }}><strong>Size:</strong> {selected.cake_size}</p>
              <p style={{ margin: "4px 0" }}><strong>Flavour:</strong> {selected.cake_flavour}</p>
              {selected.filling && <p style={{ margin: "4px 0" }}><strong>Filling:</strong> {selected.filling}</p>}
              {selected.frosting && <p style={{ margin: "4px 0" }}><strong>Frosting:</strong> {selected.frosting}</p>}
              {selected.message_on_cake && <p style={{ margin: "4px 0" }}><strong>Message:</strong> "{selected.message_on_cake}"</p>}
              {selected.special_requests && <p style={{ margin: "4px 0" }}><strong>Special Requests:</strong> {selected.special_requests}</p>}
              {selected.event_type && <p style={{ margin: "4px 0" }}><strong>Event:</strong> {selected.event_type}</p>}
              {selected.event_date && <p style={{ margin: "4px 0" }}><strong>Date Needed:</strong> {new Date(selected.event_date).toLocaleDateString("en-GB")}</p>}

              {/* Reference images */}
              {refImages.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <strong>Reference Images:</strong>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {refImages.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Reference ${i + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--color-border)" }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <hr style={{ borderColor: "var(--color-border)", margin: "16px 0" }} />

              <h3 style={{ marginBottom: 8 }}>Pricing</h3>
              <p style={{ margin: "4px 0" }}><strong>Estimated Price:</strong> {formatGBP(selected.estimated_price_pence)}</p>
              <p style={{ margin: "4px 0" }}><strong>Deposit:</strong> {formatGBP(selected.deposit_pence)}</p>
              <p style={{ margin: "4px 0" }}>
                <strong>Deposit Status:</strong>{" "}
                <span style={{ color: selected.deposit_status === "paid" ? "#2ecc71" : "#e74c3c", fontWeight: 600 }}>
                  {nice(selected.deposit_status)}
                </span>
              </p>
              <p style={{ margin: "4px 0" }}><strong>Remaining:</strong> {formatGBP(selected.estimated_price_pence - selected.deposit_pence)}</p>

              <hr style={{ borderColor: "var(--color-border)", margin: "16px 0" }} />

              <h3 style={{ marginBottom: 8 }}>Update Status</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid var(--color-border)" }}>
                  {STATUS_OPTIONS.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{nice(s)}</option>
                  ))}
                </select>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Admin notes (visible to customer in status emails)"
                  rows={3}
                  style={{ padding: 8, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)", resize: "vertical" }}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "var(--color-primary)",
                    color: "#000",
                    fontWeight: 600,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Update Enquiry"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
