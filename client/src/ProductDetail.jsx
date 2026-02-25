import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "./hooks/useCart";
import ReviewsList from "./components/ReviewsList";
import ReviewForm from "./components/ReviewForm";
import { formatGBP } from "./utils/formatGBP";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [p, setP] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Customisation state
  const [size, setSize] = useState("Medium");
  const [flavour, setFlavour] = useState("Vanilla");
  const [message, setMessage] = useState("");

  const handleAddToCart = () => {
    addItem(p, { size, flavour, message: message.trim() || null }, 1);
    navigate("/cart");
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setP)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (err) return <p style={{ padding: 16, color: "var(--color-error)" }}>Error: {err}</p>;
  if (!p) return null;

  return (
    <div style={{ maxWidth: 950, margin: "0 auto", padding: 16 }}>
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h1 style={{ marginTop: 0 }}>{p.name}</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: 16, lineHeight: 1.6 }}>{p.description}</p>
        <p style={{ fontSize: 24, fontWeight: 600, color: "var(--color-primary)", margin: "16px 0" }}>
          {formatGBP(p.price_pence)}
        </p>

        <div style={{ marginTop: 24, border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: 20, background: "var(--color-bg-secondary)" }}>
          <h3 style={{ marginTop: 0 }}>Customise your order</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              style={{ padding: "10px 14px", width: "100%", maxWidth: 300 }}
            >
              <option>Small</option>
              <option>Medium</option>
              <option>Large</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Flavour</label>
            <select
              value={flavour}
              onChange={(e) => setFlavour(e.target.value)}
              style={{ padding: "10px 14px", width: "100%", maxWidth: 300 }}
            >
              <option>Vanilla</option>
              <option>Chocolate</option>
              <option>Red Velvet</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Cake message (optional)
            </label>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Happy Birthday"
              maxLength={30}
              style={{ padding: "12px 14px", width: "100%", maxWidth: 500 }}
            />
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6, marginBottom: 0 }}>
              {message.length}/30 characters
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            style={{
              marginTop: 12,
              padding: "14px 24px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-primary)",
              color: "#000",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewsList productId={id} />

      {/* Review Form */}
      <ReviewForm productId={id} productName={p.name} />
    </div>
  );
}
