import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

export default function OrderSuccess() {
  const loc = useLocation();

  const sessionId = useMemo(() => {
    const q = new URLSearchParams(loc.search);
    return q.get("session_id");
  }, [loc.search]);

  return (
    <div style={{ padding: 16, maxWidth: 700, margin: "0 auto" }}>
      <h1>Order placed ✅</h1>
      <p>
        Thank you! Your payment was successful.
      </p>

      {sessionId && (
        <p style={{ fontSize: 13, color: "#bbb" }}>
          Stripe session: <code>{sessionId}</code>
        </p>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Link to="/menu">Back to Menu</Link>
        <Link to="/track">Track order (next)</Link>
      </div>
    </div>
  );
}
