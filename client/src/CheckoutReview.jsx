import { Link } from "react-router-dom";
import { useCart } from "./cart/CartContext";

export default function CheckoutReview() {
  const { items, subtotalPence } = useCart();
  const details = JSON.parse(localStorage.getItem("albakes_checkout_v1") || "null");

  if (!details) {
    return (
      <div style={{ padding: 16 }}>
        <p>No checkout details found.</p>
        <Link to="/checkout">Back to checkout</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1>Review</h1>

      <p><strong>Name:</strong> {details.name}</p>
      <p><strong>Email:</strong> {details.email}</p>
      <p><strong>Phone:</strong> {details.phone}</p>
      <p><strong>Delivery:</strong> {details.deliveryMethod}</p>

      {details.address && (
        <p>
          <strong>Address:</strong> {details.address.address1}, {details.address.city}, {details.address.postcode}
        </p>
      )}

      <p><strong>Date:</strong> {details.deliveryDate}</p>

      <hr />

      <p><strong>Items:</strong> {items.length}</p>
      <p><strong>Subtotal:</strong> £{(subtotalPence / 100).toFixed(2)}</p>

      

      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/checkout">Back</Link>
        <button disabled style={{ padding: "10px 14px", opacity: 0.7 }}>
          Pay with Stripe (next)
        </button>
      </div>
    </div>
  );
}
