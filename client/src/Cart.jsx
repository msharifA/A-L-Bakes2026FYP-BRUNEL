import { Link } from "react-router-dom";
import { useCart } from "./cart/CartContext";

const formatGBP = (pence) => `£${(pence / 100).toFixed(2)}`;

export default function Cart() {
  const { items, removeItem, setQty, subtotalPence, clearCart, maxQtyPerItem } = useCart();

  if (!items.length) {
    return (
      <div style={{ padding: 16, maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <img
          src="/src/assets/logo.jpg"
          alt="A&L Bakes"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 16,
          }}
        />
        <h1>Your Cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/menu">Go to Menu</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <img
          src="/src/assets/logo.jpg"
          alt="A&L Bakes"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </div>
      <h1>Your Cart</h1>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {items.map((it) => (
          <div
            key={it._key}
            style={{
              border: "1px solid #333",
              borderRadius: 14,
              padding: 12,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 260 }}>
              <strong>{it.name}</strong>
              <div style={{ color: "#bbb", fontSize: 13 }}>
                {it.customisation?.size && <div>Size: {it.customisation.size}</div>}
                {it.customisation?.flavour && <div>Flavour: {it.customisation.flavour}</div>}
                {it.customisation?.message && <div>Message: “{it.customisation.message}”</div>}
              </div>
              <div style={{ marginTop: 6 }}>{formatGBP(it.unitPricePence)} each</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label>Qty</label>
              <input
                type="number"
                min="1"
                max={maxQtyPerItem}
                value={it.qty}
                onChange={(e) => setQty(it._key, e.target.value)}
                style={{ width: 70, padding: 8 }}
              />
              <button onClick={() => removeItem(it._key)} style={{ padding: "8px 12px" }}>
                Remove
              </button>
            </div>

            <div style={{ minWidth: 120, textAlign: "right" }}>
              <strong>{formatGBP(it.unitPricePence * it.qty)}</strong>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, borderTop: "1px solid #333", paddingTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <strong>{formatGBP(subtotalPence)}</strong>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <button onClick={clearCart} style={{ padding: "10px 14px" }}>
            Clear cart
          </button>

          <Link
            to="/checkout"
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: "#f5a623",
              color: "#000",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Proceed to checkout
          </Link>

          <Link to="/menu" style={{ padding: "10px 14px" }}>
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
