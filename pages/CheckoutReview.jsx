
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { createCheckoutSession } from "../api/orders";
import "../styles/checkout-review.css";

export default function CheckoutReview() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [checkoutData, setCheckoutData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load checkout data from sessionStorage
    const stored = sessionStorage.getItem("checkoutData");
    if (!stored) {
      navigate("/checkout");
      return;
    }
    setCheckoutData(JSON.parse(stored));
  }, [navigate]);

  if (!checkoutData) {
    return <div className="review-loading">Loading...</div>;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.2; // Example 20% VAT
  const total = subtotal + tax;

  const isValid = cart.length > 0 && checkoutData.email && checkoutData.firstName && checkoutData.lastName && checkoutData.pickupDate;

  async function handlePayment() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const sessionData = await createCheckoutSession({
        items: cart,
        email: checkoutData.email,
        firstName: checkoutData.firstName,
        lastName: checkoutData.lastName,
        pickupDate: checkoutData.pickupDate,
      });

      // Clear cart only after successful session creation
      clearCart();
      sessionStorage.removeItem("checkoutData");

      // Redirect to Stripe Checkout
      if (sessionData.url) {
        window.location.href = sessionData.url;
      }
    } catch (err) {
      setError(err.message || "Failed to process payment. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="review-container">
      <h1>Order Review</h1>

      <div className="review-content">
        <section className="review-items">
          <h2>Order Items</h2>
          <div className="items-list">
            {cart.map((item) => (
              <div key={item.id} className="review-item">
                <div className="item-info">
                  <span className="item-name">{item.name}</span>
                  <span className="item-qty">Qty: {item.qty}</span>
                </div>
                <span className="item-price">
                  £{(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="review-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>£{subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (20%)</span>
            <span>£{tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>£{total.toFixed(2)}</span>
          </div>
        </section>

        <section className="review-details">
          <h2>Pickup Details</h2>
          <p><strong>Name:</strong> {checkoutData.firstName} {checkoutData.lastName}</p>
          <p><strong>Email:</strong> {checkoutData.email}</p>
          <p><strong>Pickup Date:</strong> {new Date(checkoutData.pickupDate).toLocaleDateString()}</p>
        </section>

        {error && <div className="error-banner">{error}</div>}

        <div className="review-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/checkout")}
            disabled={isSubmitting}
          >
            Back to Checkout
          </button>
          <button
            className="btn-primary"
            onClick={handlePayment}
            disabled={!isValid || isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Processing..." : "Pay with Stripe"}
          </button>
        </div>
      </div>
    </div>
  );
}