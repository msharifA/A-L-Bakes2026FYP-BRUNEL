import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const formatGBP = (pence) => `£${(pence / 100).toFixed(2)}`;

export default function ProductDetail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Customisation state (wireframe)
  const [size, setSize] = useState("Medium");
  const [flavour, setFlavour] = useState("Vanilla");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setP)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (err) return <p style={{ padding: 16, color: "crimson" }}>Error: {err}</p>;
  if (!p) return null;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1>{p.name}</h1>
      <p style={{ color: "#bbb" }}>{p.description}</p>
      <p style={{ fontSize: 18 }}>{formatGBP(p.price_pence)}</p>

      <div style={{ marginTop: 18, border: "1px solid #333", borderRadius: 14, padding: 14 }}>
        <h3>Customise your order</h3>

        <label style={{ display: "block", marginTop: 10 }}>Size</label>
        <select value={size} onChange={(e) => setSize(e.target.value)} style={{ padding: 10 }}>
          <option>Small</option>
          <option>Medium</option>
          <option>Large</option>
        </select>

        <label style={{ display: "block", marginTop: 10 }}>Flavour</label>
        <select value={flavour} onChange={(e) => setFlavour(e.target.value)} style={{ padding: 10 }}>
          <option>Vanilla</option>
          <option>Chocolate</option>
          <option>Red Velvet</option>
        </select>

        <label style={{ display: "block", marginTop: 10 }}>Cake message (optional)</label>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Happy Birthday"
          maxLength={30}
          style={{ padding: 10, width: "100%", maxWidth: 420 }}
        />

        <p style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
          {message.length}/30 characters
        </p>

        <button
          disabled
          style={{ marginTop: 12, padding: 12, borderRadius: 12, opacity: 0.7, cursor: "not-allowed" }}
          title="Cart comes next"
        >
          Add to Cart (next)
        </button>
      </div>
    </div>
  );
}
