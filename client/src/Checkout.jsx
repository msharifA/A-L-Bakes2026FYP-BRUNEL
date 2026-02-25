/**
 * =============================================================================
 * CHECKOUT PAGE (STEP 1 OF 3)
 * =============================================================================
 *
 * PURPOSE:
 * Collects customer details before payment. This is the first step in the
 * checkout flow:
 *
 * CHECKOUT FLOW:
 * 1. /checkout (THIS PAGE) → Customer enters name, email, phone, delivery info
 * 2. /checkout/review → Customer reviews order, clicks "Pay with Stripe"
 * 3. Stripe Checkout → External Stripe-hosted payment page
 * 4. /order-success → Post-payment confirmation
 *
 * DATA FLOW:
 * - Form data is validated client-side
 * - On submit, data is saved to localStorage (albakes_checkout_v1)
 * - User is redirected to /checkout/review
 * - Review page reads localStorage and sends to backend
 *
 * WHY LOCALSTORAGE?
 * - Simple state persistence between pages
 * - No complex state management needed
 * - Data is sent to backend at review step (not here)
 *
 * VALIDATION:
 * - Name, email, phone are required
 * - Email must be valid format
 * - UK phone number validation
 * - Delivery address required only if delivery method selected
 * - Delivery date must be at least 7 days in future
 *
 * =============================================================================
 */

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./hooks/useCart";
import { formatGBP } from "./utils/formatGBP";

/** Delivery fee in pence (£4.99) */
const DELIVERY_FEE_PENCE = 499;

/** Email validation regex - basic format check */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** UK phone validation - check digit count */
function validateUKPhone(phone) {
  const digits = phone.replace(/\s+/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

/** Get date N days from today (for minimum delivery date) */
function getTomorrowPlusN(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function Checkout() {
  const nav = useNavigate();
  const { items, subtotalPence } = useCart();

  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  const [touched, setTouched] = useState({});
  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const deliveryFeePence = deliveryMethod === "delivery" ? DELIVERY_FEE_PENCE : 0;

  const totalPence = useMemo(
    () => subtotalPence + deliveryFeePence,
    [subtotalPence, deliveryFeePence]
  );

  const errors = useMemo(() => {
    const e = {};

    if (!name.trim()) e.name = "Name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!validateEmail(email.trim())) e.email = "Enter a valid email.";

    if (!phone.trim()) e.phone = "Phone is required.";
    else if (!validateUKPhone(phone)) e.phone = "Enter a valid phone number.";

    if (!deliveryDate) {
      e.deliveryDate = "Select a date.";
    } else {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() + 7);
      minDate.setHours(0, 0, 0, 0);
      const selected = new Date(deliveryDate);
      selected.setHours(0, 0, 0, 0);
      if (selected < minDate) {
        e.deliveryDate = "Date must be at least 7 days from today.";
      }
    }

    if (deliveryMethod === "delivery") {
      if (!address1.trim()) e.address1 = "Address line 1 is required.";
      if (!city.trim()) e.city = "City is required.";
      if (!postcode.trim()) e.postcode = "Postcode is required.";
    }

    return e;
  }, [name, email, phone, deliveryDate, deliveryMethod, address1, city, postcode]);

  const isValid = Object.keys(errors).length === 0;

  function onContinue() {
    setTouched({
      name: true,
      email: true,
      phone: true,
      address1: true,
      city: true,
      postcode: true,
      deliveryDate: true,
    });

    if (!isValid) return;

    const checkoutDetails = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      deliveryMethod,
      address:
        deliveryMethod === "delivery"
          ? {
              address1: address1.trim(),
              address2: address2.trim(),
              city: city.trim(),
              postcode: postcode.trim(),
            }
          : null,
      deliveryDate,
      notes: notes.trim(),
    };

    localStorage.setItem("albakes_checkout_v1", JSON.stringify(checkoutDetails));
    nav("/checkout/review");
  }

  if (!items.length) {
    return (
      <div style={{ padding: 16, maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <img
          src="/logo.jpg"
          alt="A&L Bakes"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 16,
          }}
        />
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link to="/menu">Go to Menu</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 950, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <img
          src="/logo.jpg"
          alt="A&L Bakes"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </div>
      <h1 style={{ marginBottom: 12 }}>Checkout</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        {/* LEFT: form */}
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, background: "var(--color-bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ marginTop: 0 }}>Customer details</h2>

          <Field
            label="Full name"
            value={name}
            onChange={setName}
            onBlur={() => touch("name")}
            error={touched.name ? errors.name : ""}
            placeholder="e.g. Mohamed Sharif"
          />

          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            onBlur={() => touch("email")}
            error={touched.email ? errors.email : ""}
            placeholder="e.g. mohamed@email.com"
          />

          <Field
            label="Phone"
            value={phone}
            onChange={setPhone}
            onBlur={() => touch("phone")}
            error={touched.phone ? errors.phone : ""}
            placeholder="e.g. 07xxx xxxxxx"
          />

          <hr style={{ borderColor: "var(--color-border)", margin: "16px 0" }} />

          <h2 style={{ marginTop: 0 }}>Delivery</h2>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <button
              type="button"
              onClick={() => setDeliveryMethod("pickup")}
              style={pill(deliveryMethod === "pickup")}
            >
              Pickup (Free)
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMethod("delivery")}
              style={pill(deliveryMethod === "delivery")}
            >
              Delivery ({formatGBP(DELIVERY_FEE_PENCE)})
            </button>
          </div>

          {deliveryMethod === "delivery" && (
            <div style={{ marginTop: 10 }}>
              <Field
                label="Address line 1"
                value={address1}
                onChange={setAddress1}
                onBlur={() => touch("address1")}
                error={touched.address1 ? errors.address1 : ""}
                placeholder="House number + street"
              />
              <Field
                label="Address line 2 (optional)"
                value={address2}
                onChange={setAddress2}
                onBlur={() => touch("address2")}
                error=""
                placeholder="Flat, building, etc."
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field
                  label="City"
                  value={city}
                  onChange={setCity}
                  onBlur={() => touch("city")}
                  error={touched.city ? errors.city : ""}
                  placeholder="e.g. London"
                />
                <Field
                  label="Postcode"
                  value={postcode}
                  onChange={setPostcode}
                  onBlur={() => touch("postcode")}
                  error={touched.postcode ? errors.postcode : ""}
                  placeholder="e.g. UB8 1AA"
                />
              </div>
            </div>
          )}

          <hr style={{ borderColor: "var(--color-border)", margin: "16px 0" }} />

          <h2 style={{ marginTop: 0 }}>When do you want it?</h2>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Delivery/Pickup date
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              onBlur={() => touch("deliveryDate")}
              min={getTomorrowPlusN(7)}
              style={{ padding: 10, width: "100%" }}
            />
            {touched.deliveryDate && errors.deliveryDate && (
              <div style={{ color: "var(--color-error)", fontSize: 13, marginTop: 6 }}>
                {errors.deliveryDate}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Allergies, delivery instructions, etc."
              rows={3}
              style={{ padding: 10, width: "100%" }}
            />
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="primary"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              fontWeight: 700,
              cursor: isValid ? "pointer" : "not-allowed",
            }}
            disabled={!isValid}
          >
            Continue to review
          </button>

          {!isValid && (
            <p style={{ marginTop: 10, color: "var(--color-text-muted)", fontSize: 13 }}>
              Fill the required fields to continue.
            </p>
          )}
        </div>

        {/* RIGHT: summary */}
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 14, padding: 16, height: "fit-content", background: "var(--color-bg-card)", boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ marginTop: 0 }}>Order summary</h2>

          <div style={{ display: "grid", gap: 10 }}>
            {items.map((it) => (
              <div key={it._key} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ maxWidth: 250 }}>
                  <strong>{it.name}</strong>
                  <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                    Qty: {it.qty}
                    {it.customisation?.size ? ` • ${it.customisation.size}` : ""}
                    {it.customisation?.flavour ? ` • ${it.customisation.flavour}` : ""}
                  </div>
                </div>
                <div>{formatGBP(it.unitPricePence * it.qty)}</div>
              </div>
            ))}
          </div>

          <hr style={{ borderColor: "var(--color-border)", margin: "14px 0" }} />

          <Row label="Subtotal" value={formatGBP(subtotalPence)} />
          <Row label="Delivery fee" value={formatGBP(deliveryFeePence)} />
          <Row label={<strong>Total</strong>} value={<strong>{formatGBP(totalPence)}</strong>} />

          <div style={{ marginTop: 12 }}>
            <Link to="/cart">← Back to cart</Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, color: "var(--color-text-muted)", fontSize: 12 }}>
        Tip: We'll validate again on the server before Stripe (prevents tampering).
      </div>
    </div>
  );
}

function Field({ label, value, onChange, onBlur, error, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{ padding: 10, width: "100%" }}
      />
      {error ? <div style={{ color: "var(--color-error)", fontSize: 13, marginTop: 6 }}>{error}</div> : null}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <div>{label}</div>
      <div>{value}</div>
    </div>
  );
}

function pill(active) {
  return {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid var(--color-border)",
    cursor: "pointer",
    background: active ? "var(--color-border)" : "transparent",
    color: active ? "#fff" : "inherit",
    transition: "all 0.2s ease",
  };
}
