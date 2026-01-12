import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

function formatGBPFromPence(pence) {
  if (typeof pence !== "number") return "";
  return `£${(pence / 100).toFixed(2)}`;
}

function niceStatus(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function TrackOrder() {
  const { orderId } = useParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/orders/${orderId}/track`);
        const json = await res.json();

        if (!res.ok) throw new Error(json?.error || "Failed to load tracking");

        if (cancelled) return;
        setData(json);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (orderId) load();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1>Track order</h1>

      <p style={{ marginTop: 0 }}>
        <strong>Order ID:</strong>{" "}
        <code style={{ fontSize: 12 }}>{orderId}</code>
      </p>

      {loading && <p>Loading tracking…</p>}

      {!loading && error && (
        <div style={{ padding: 12, border: "1px solid #444", borderRadius: 8 }}>
          <p style={{ marginTop: 0 }}>
            <strong>Couldn’t load this order.</strong>
          </p>
          <p style={{ marginBottom: 0 }}>{error}</p>

          <div style={{ marginTop: 12 }}>
            <Link to="/shop">Back to Menu</Link>
          </div>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div style={{ padding: 12, border: "1px solid #444", borderRadius: 8 }}>
            <p style={{ marginTop: 0 }}>
              <strong>Status:</strong> {niceStatus(data.order.status)}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Payment:</strong> {niceStatus(data.order.payment_status)}
            </p>

            <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, opacity: 0.85 }}>
              Created: {new Date(data.order.created_at).toLocaleString()}
              <br />
              Updated: {new Date(data.order.updated_at).toLocaleString()}
            </p>
          </div>

          <h2 style={{ marginTop: 18 }}>Updates</h2>

          {data.events.length === 0 ? (
            <p>No updates yet.</p>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {data.events.map((ev, idx) => (
                <li key={idx} style={{ marginBottom: 10 }}>
                  <div>
                    <strong>{ev.message}</strong>
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.8 }}>
                    {new Date(ev.created_at).toLocaleString()} — {ev.type}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Link to="/shop">Back to Menu</Link>
            <Link to="/cart">Cart</Link>
          </div>
        </>
      )}
    </div>
  );
}
