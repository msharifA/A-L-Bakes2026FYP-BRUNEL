import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useCart } from "./context/CartContext";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState(null);
  const [alreadyExisted, setAlreadyExisted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function createOrder() {
      try {
        setLoading(true);
        setError(null);

        if (!sessionId) {
          throw new Error("Missing Stripe session_id in URL.");
        }

        const res = await fetch("/api/orders/from-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to create order");
        }

        if (cancelled) return;

        setOrderId(data.orderId);
        setAlreadyExisted(Boolean(data.alreadyExisted));
        clearCart();
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    createOrder();

    return () => {
      cancelled = true;
    };
  }, [sessionId, clearCart]);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1>Order placed ✅</h1>

      {loading && (
        <p>
          Confirming payment and creating your order…
          <br />
          <small>(This usually takes a moment.)</small>
        </p>
      )}

      {!loading && error && (
        <div style={{ padding: 12, border: "1px solid #444", borderRadius: 8 }}>
          <p style={{ marginTop: 0 }}>
            <strong>We couldn’t confirm your order.</strong>
          </p>
          <p style={{ marginBottom: 0 }}>{error}</p>

          <div style={{ marginTop: 12 }}>
            <p style={{ marginBottom: 6 }}>
              Stripe session:
              <br />
              <code style={{ fontSize: 12 }}>{sessionId || "missing"}</code>
            </p>

            <Link to="/checkout">Back to checkout</Link>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <p>Thank you! Your payment was successful.</p>

          <p style={{ marginBottom: 6 }}>
            <strong>Order ID:</strong>
          </p>
          <code style={{ display: "block", fontSize: 12, padding: 10, border: "1px solid #444", borderRadius: 8 }}>
            {orderId}
          </code>

          {alreadyExisted && (
            <p style={{ fontSize: 13, opacity: 0.8 }}>
              (This order was already created — we didn’t duplicate it.)
            </p>
          )}

          <p style={{ marginTop: 12, marginBottom: 6 }}>
            Stripe session:
          </p>
          <code style={{ fontSize: 12 }}>{sessionId}</code>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <Link to="/shop">Back to Menu</Link>

            {/* ✅ Track page you’ll build next */}
            {orderId ? (
              <Link to={`/track/${orderId}`}>Track order</Link>
            ) : (
              <span style={{ opacity: 0.6 }}>Track order</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
