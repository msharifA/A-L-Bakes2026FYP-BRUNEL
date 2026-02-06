/**
 * =============================================================================
 * CHECKOUT REVIEW PAGE (STEP 2 OF 3) - STRIPE BOUNDARY
 * =============================================================================
 *
 * PURPOSE:
 * Shows order summary and handles the handoff to Stripe Checkout.
 * This is the LAST page before leaving to Stripe's payment page.
 *
 * CHECKOUT FLOW:
 * 1. /checkout → Customer enters details
 * 2. /checkout/review (THIS PAGE) → Review order, click "Pay with Stripe"
 * 3. Stripe Checkout → External Stripe-hosted payment page
 * 4. /order-success → Post-payment confirmation
 *
 * STRIPE BOUNDARY EXPLANATION:
 * This is called a "boundary" because it's where we transition from our
 * application to Stripe's hosted checkout. Key security benefits:
 *
 * 1. SECURITY: Stripe handles all payment card details
 *    - We NEVER see or store credit card numbers
 *    - PCI compliance is Stripe's responsibility
 *    - Reduces our security liability
 *
 * 2. TRUST: Customers see familiar Stripe UI
 *    - They enter card on stripe.com domain
 *    - Stripe's SSL certificate visible
 *
 * 3. FLEXIBILITY: Stripe handles payment methods
 *    - Apple Pay, Google Pay, cards automatically
 *    - 3D Secure authentication handled by Stripe
 *
 * HOW THE HANDOFF WORKS:
 * 1. User clicks "Pay with Stripe" button
 * 2. Frontend calls POST /api/checkout → backend
 * 3. Backend creates Stripe Checkout Session with:
 *    - Line items (products + prices)
 *    - Customer email
 *    - Success/cancel URLs
 *    - Metadata (delivery method, date)
 * 4. Stripe returns session URL
 * 5. Frontend redirects: window.location.href = url
 * 6. User pays on Stripe's hosted page
 * 7. Stripe redirects back to /order-success?session_id=xxx
 *
 * =============================================================================
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "./context/CartContext";
import { createCheckoutSession } from "./api/checkout";

const formatGBP = (pence) => `£${(pence / 100).toFixed(2)}`;
const DELIVERY_FEE_PENCE = 499;

function nice(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function CheckoutReview() {
  // Get cart items and subtotal from global context
  const { items, subtotalPence } = useCart();

  // Read customer details saved by previous checkout page
  const details = JSON.parse(localStorage.getItem("albakes_checkout_v1") || "null");

  // Loading and error state for Stripe redirect
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Calculate delivery fee based on method
  const deliveryFeePence = useMemo(() => {
    return details?.deliveryMethod === "delivery" ? DELIVERY_FEE_PENCE : 0;
  }, [details]);

  const totalPence = useMemo(() => {
    return subtotalPence + deliveryFeePence;
  }, [subtotalPence, deliveryFeePence]);

  /**
   * STRIPE HANDOFF FUNCTION
   *
   * This is where we leave our app and go to Stripe.
   * Called when user clicks "Pay with Stripe" button.
   */
  async function handlePay() {
    setSubmitting(true);
    setError("");

    try {
      /**
       * BUILD PAYLOAD FOR BACKEND
       *
       * We send cart items + customer details to backend.
       * Backend validates and creates Stripe session.
       *
       * WHY NOT CREATE SESSION CLIENT-SIDE?
       * - Stripe Secret Key must stay on server (security)
       * - Backend validates prices against database (prevents tampering)
       * - Backend can add metadata for order tracking
       */
      const payload = {
        cartItems: items.map((it) => ({
          productId: it.productId ?? it.id,
          qty: it.qty,
          customisation: it.customisation || {},
        })),
        checkout: {
          name: details.name,
          email: details.email,
          phone: details.phone,
          deliveryMethod: details.deliveryMethod,
          deliveryDate: details.deliveryDate,
          address: details.address,
          notes: details.notes,
        },
      };

      // Call backend to create Stripe session
      const { url } = await createCheckoutSession(payload);

      /**
       * REDIRECT TO STRIPE
       *
       * window.location.href performs a full page navigation.
       * This takes user to Stripe's hosted checkout page.
       * After payment, Stripe redirects back to our /order-success
       */
      window.location.href = url;
    } catch (e) {
      setError(e.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!details) {
    return (
      <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
        <h1>Review Order</h1>
        <p>No checkout details found.</p>
        <Link to="/checkout">Back to checkout</Link>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
        <h1>Review Order</h1>
        <p>Your cart is empty.</p>
        <Link to="/cart">Go to cart</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>Review Order</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        {/* LEFT: Review details */}
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, background: "var(--color-bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ marginTop: 0 }}>Order Details</h2>

          <DetailRow label="Name" value={details.name} />
          <DetailRow label="Email" value={details.email} />
          <DetailRow label="Phone" value={details.phone} />

          <hr style={{ borderColor: "var(--color-border)", margin: "16px 0" }} />

          <DetailRow label="Delivery Method" value={nice(details.deliveryMethod)} />
          <DetailRow label="Date" value={details.deliveryDate} />

          {details.address && (
            <>
              <hr style={{ borderColor: "var(--color-border)", margin: "16px 0" }} />
              <h3 style={{ marginTop: 0, fontSize: "1.2em" }}>Delivery Address</h3>
              <p style={{ margin: "8px 0", lineHeight: 1.6 }}>
                {details.address.address1}
                {details.address.address2 && (
                  <>
                    <br />
                    {details.address.address2}
                  </>
                )}
                <br />
                {details.address.city}, {details.address.postcode}
              </p>
            </>
          )}

          {details.notes && (
            <>
              <hr style={{ borderColor: "var(--color-border)", margin: "16px 0" }} />
              <DetailRow label="Notes" value={details.notes} />
            </>
          )}

          <div style={{ marginTop: 16 }}>
            <Link to="/checkout">← Edit details</Link>
          </div>
        </div>

        {/* RIGHT: Order summary + payment */}
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, background: "var(--color-bg-card)", boxShadow: "var(--shadow-sm)", height: "fit-content" }}>
          <h2 style={{ marginTop: 0 }}>Order Summary</h2>

          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            {items.map((it) => (
              <div key={it._key} style={{ paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <strong>{it.name}</strong>
                  <strong>{formatGBP(it.unitPricePence * it.qty)}</strong>
                </div>
                <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
                  Quantity: {it.qty} × {formatGBP(it.unitPricePence)}
                </div>
                {(it.customisation?.size || it.customisation?.flavour || it.customisation?.message) && (
                  <div style={{ color: "var(--color-text-muted)", fontSize: 13, marginTop: 4 }}>
                    {it.customisation.size && `Size: ${it.customisation.size}`}
                    {it.customisation.size && it.customisation.flavour && " • "}
                    {it.customisation.flavour && `Flavour: ${it.customisation.flavour}`}
                    {it.customisation.message && (
                      <>
                        <br />
                        Message: "{it.customisation.message}"
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <hr style={{ borderColor: "var(--color-border)", margin: "16px 0" }} />

          <SummaryRow label="Subtotal" value={formatGBP(subtotalPence)} />
          <SummaryRow
            label="Delivery"
            value={deliveryFeePence > 0 ? formatGBP(deliveryFeePence) : "Free"}
          />
          <SummaryRow
            label={<strong>Total</strong>}
            value={<strong style={{ fontSize: "1.2em" }}>{formatGBP(totalPence)}</strong>}
            bold
          />

          <button
            onClick={handlePay}
            disabled={submitting || items.length === 0}
            className="primary"
            style={{
              width: "100%",
              padding: 14,
              marginTop: 20,
              fontSize: "1.1em",
              borderRadius: 12,
            }}
          >
            {submitting ? "Redirecting to Stripe..." : "Pay with Stripe"}
          </button>

          {error && (
            <div style={{ color: "var(--color-error)", marginTop: 12, padding: 10, background: "rgba(255, 107, 107, 0.1)", borderRadius: 8, fontSize: 14 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: 12, color: "var(--color-text-muted)", textAlign: "center" }}>
            🔒 Secure payment via Stripe
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 15 }}>{value}</div>
    </div>
  );
}

function SummaryRow({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: bold ? "1.1em" : "1em" }}>
      <div>{label}</div>
      <div>{value}</div>
    </div>
  );
}
