import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminLogout } from "./api/auth";
import {
  adminGetOrder,
  adminListOrders,
  adminUpdateOrderStatus,
} from "./api/admin";
import { formatGBP } from "./utils/formatGBP";

const STATUS_OPTIONS = [
  "",
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

function gbp(pence) {
  if (typeof pence !== "number") return "";
  return formatGBP(pence);
}

function nice(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AdminDashboard() {
  const nav = useNavigate();

  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [newStatus, setNewStatus] = useState("processing");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const canPrev = offset > 0;
  const canNext = orders.length === limit;

  const queryKey = useMemo(
    () => JSON.stringify({ status, q, limit, offset }),
    [status, q, limit, offset]
  );

  /* ======================
     Load orders (protected)
     ====================== */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await adminListOrders({
          status,
          q,
          limit,
          offset,
        });

        if (cancelled) return;
        setOrders(data.orders || []);
      } catch (e) {
        const msg = e?.message || "Failed";

        // 🔐 Redirect if not authenticated
        if (msg.toLowerCase().includes("not authenticated")) {
          nav("/admin/login");
          return;
        }

        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [queryKey, nav, status, q, limit, offset]);

  /* ======================
     Open order details
     ====================== */
  async function openOrder(orderId) {
    setSelectedId(orderId);
    setDetail(null);
    setDetailError(null);
    setMessage("");
    setSaving(false);

    try {
      setDetailLoading(true);
      const data = await adminGetOrder(orderId);
      setDetail(data);
      setNewStatus(data?.order?.status || "processing");
    } catch (e) {
      const msg = e?.message || "Failed to load order";

      if (msg.toLowerCase().includes("not authenticated")) {
        nav("/admin/login");
        return;
      }

      setDetailError(msg);
    } finally {
      setDetailLoading(false);
    }
  }
  // ✅ Logout handler (inside AdminDashboard)
  async function onLogout() {
    try {
      await adminLogout();
      nav("/admin/login");
    } catch (e) {
      alert(e?.message || "Logout failed");
    }
  }
  /* ======================
     Save status update
     ====================== */
  async function saveStatus() {
    if (!selectedId) return;

    try {
      setSaving(true);

      await adminUpdateOrderStatus(
        selectedId,
        newStatus,
        message.trim()
      );

      // refresh detail + list
      const refreshed = await adminGetOrder(selectedId);
      setDetail(refreshed);

      const listRefreshed = await adminListOrders({
        status,
        q,
        limit,
        offset,
      });
      setOrders(listRefreshed.orders || []);

      setMessage("");
    } catch (e) {
      const msg = e?.message || "Failed to update";

      if (msg.toLowerCase().includes("not authenticated")) {
        nav("/admin/login");
        return;
      }

      alert(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/admin/products">Products</Link>
          <Link to="/admin/reviews">Reviews</Link>
          <Link to="/admin/review-reports">Reports</Link>
          <Link to="/admin/sales">Sales</Link>
          <Link to="/admin/approvals">Approvals</Link>
          <Link to="/menu">Menu</Link>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 14,
          alignItems: "center",
        }}
      >
        <label>
          Status{" "}
          <select
            value={status}
            onChange={(e) => {
              setOffset(0);
              setStatus(e.target.value);
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s ? nice(s) : "All"}
              </option>
            ))}
          </select>
        </label>

        <label>
          Search email{" "}
          <input
            value={q}
            onChange={(e) => {
              setOffset(0);
              setQ(e.target.value);
            }}
            placeholder="test@example.com"
            style={{ minWidth: 260 }}
          />
        </label>

        <button onClick={() => setOffset(0)} disabled={loading}>
          Refresh
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={!canPrev || loading}
          >
            Prev
          </button>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={!canNext || loading}
          >
            Next
          </button>
        </div>
      </div>

      {/* Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 16,
          marginTop: 16,
        }}
      >
        {/* Orders list */}
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 16, background: "var(--color-bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ marginTop: 0 }}>Orders</h2>

          {loading && <p>Loading…</p>}
          {!loading && error && <p style={{ color: "salmon" }}>{error}</p>}
          {!loading && !error && orders.length === 0 && (
            <p>No orders found.</p>
          )}

          {!loading && !error && orders.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600 }}>Created</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600 }}>Email</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: 600 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => openOrder(o.id)}
                    style={{
                      cursor: "pointer",
                      background:
                        selectedId === o.id
                          ? "rgba(245, 166, 35, 0.1)"
                          : "transparent",
                      borderBottom: "1px solid var(--color-border)",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedId !== o.id) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedId !== o.id) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <td style={{ padding: "12px 8px" }}>{new Date(o.created_at).toLocaleString()}</td>
                    <td style={{ padding: "12px 8px" }}>{o.customer_email}</td>
                    <td style={{ padding: "12px 8px" }}>{nice(o.status)}</td>
                    <td style={{ padding: "12px 8px" }}>{gbp(o.total_pence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Order detail */}
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 12, padding: 16, background: "var(--color-bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ marginTop: 0 }}>Order Details</h2>

          {!selectedId && <p>Select an order.</p>}
          {selectedId && detailLoading && <p>Loading…</p>}
          {selectedId && detailError && (
            <p style={{ color: "salmon" }}>{detailError}</p>
          )}

          {selectedId && detail && (
            <>
              <p>
                <strong>ID:</strong>{" "}
                <code style={{ fontSize: 12 }}>{detail.order.id}</code>
              </p>

              {/* Customer Info */}
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>Customer Info</h3>
              <p style={{ margin: "4px 0" }}>
                <strong>Name:</strong> {detail.order.customer_name || "N/A"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Email:</strong> {detail.order.customer_email}
              </p>

              {/* Order Status */}
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>Order Status</h3>
              <p style={{ margin: "4px 0" }}>
                <strong>Status:</strong> {nice(detail.order.status)} •{" "}
                <strong>Payment:</strong> {nice(detail.order.payment_status)}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Delivery:</strong> {nice(detail.order.delivery_method) || "N/A"}
                {detail.order.delivery_date && (
                  <> • <strong>Date:</strong> {new Date(detail.order.delivery_date).toLocaleDateString()}</>
                )}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Total:</strong> {gbp(detail.order.total_pence)}
              </p>

              {/* Order Items */}
              <h3 style={{ marginTop: 16, marginBottom: 8 }}>Items</h3>
              {detail.items && detail.items.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {detail.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      <strong>{item.product_name}</strong> × {item.quantity}
                      <span style={{ color: "#888", marginLeft: 8 }}>
                        {gbp(item.price_pence)} each
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#888" }}>No items found.</p>
              )}

              <hr />

              <h3>Update status</h3>
              <div style={{ display: "flex", gap: 10 }}>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {nice(s)}
                    </option>
                  ))}
                </select>

                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Optional message"
                  style={{ flex: 1 }}
                />

                <button onClick={saveStatus} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>

              <hr />

              <h3>Timeline</h3>
              <ul>
                {detail.events.map((ev, i) => (
                  <li key={i}>
                    <strong>{ev.message}</strong>
                    <br />
                    <small>
                      {new Date(ev.created_at).toLocaleString()}
                    </small>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
