import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./cart/CartContext";
import { createCheckoutSession } from "./api/checkout";

const formatGBP = (pence) => `£${(pence / 100).toFixed(2)}`;

// simple fixed delivery fee for now (safe + easy)
const DELIVERY_FEE_PENCE = 499;

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validateUKPhone(phone) {
  // basic check (don’t over-engineer)
  const digits = phone.replace(/\s+/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export default function Checkout() {
  // hooks FIRST
  const nav = useNavigate();
  const { items, subtotalPence } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function handlePay() {
    setSubmitting(true);
    setError("");
  
    try {
      const payload = {
        cartItems: items.map((it) => ({
          productId: it.productId ?? it.id,
          qty: it.qty,
          customisation: it.customisation || {},
        })),
        checkout: {
          name,
          email,
          deliveryMethod, // "pickup" or "delivery"
          deliveryDate,   // optional
        },
      };
  
      const { url } = await createCheckoutSession(payload);
      window.location.href = url;
    } catch (e) {
      setError(e.message || "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  // form state
  const [deliveryMethod, setDeliveryMethod] = useState("pickup"); // pickup | delivery

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  const [touched, setTouched] = useState({}); // track blur to show validation
  const touch = (field) => setTouched((t) => ({ ...t, [field]: true }));

  const deliveryFeePence = deliveryMethod === "delivery" ? DELIVERY_FEE_PENCE : 0;

  const totalPence = useMemo(
    () => subtotalPence + deliveryFeePence,
    [subtotalPence, deliveryFeePence]
  );

  // validation rules (frontend UX)
  const errors = useMemo(() => {
    const e = {};

    if (!name.trim()) e.name = "Name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!validateEmail(email.trim())) e.email = "Enter a valid email.";

    if (!phone.trim()) e.phone = "Phone is required.";
    else if (!validateUKPhone(phone)) e.phone = "Enter a valid phone number.";

    if (!deliveryDate) e.deliveryDate = "Select a date.";

    if (deliveryMethod === "delivery") {
      if (!address1.trim()) e.address1 = "Address line 1 is required.";
      if (!city.trim()) e.city = "City is required.";
      if (!postcode.trim()) e.postcode = "Postcode is required.";
    }

    return e;
  }, [name, email, phone, deliveryDate, deliveryMethod, address1, city, postcode]);

  const isValid = Object.keys(errors).length === 0;

  function onContinue() {
    // mark all as touched so errors show if user clicks early
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

  // conditional render AFTER hooks
  if (!items.length) {
    return (
      <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
        <h1>Checkout</h1>
        <p>Your cart is empty.</p>
        <Link to="/menu">Go to Menu</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 950, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>Checkout</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        {/* LEFT: form */}
        <div style={{ border: "1px solid #333", borderRadius: 14, padding: 14 }}>
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

          <hr style={{ borderColor: "#333", margin: "16px 0" }} />

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

          <hr style={{ borderColor: "#333", margin: "16px 0" }} />

          <h2 style={{ marginTop: 0 }}>When do you want it?</h2>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Delivery/Pickup date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              onBlur={() => touch("deliveryDate")}
              style={{ padding: 10, width: "100%" }}
            />
            {touched.deliveryDate && errors.deliveryDate && (
              <div style={{ color: "crimson", fontSize: 13, marginTop: 6 }}>
                {errors.deliveryDate}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Notes (optional)</label>
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
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              background: isValid ? "#f5a623" : "#777",
              color: "#000",
              fontWeight: 700,
              cursor: "pointer",
              border: "none",
            }}
          >
            Continue to review
          </button>
          <button type="button" onClick={handlePay} disabled={submitting || !isValid}>
  {submitting ? "Redirecting..." : "Pay"}
</button>

{error ? <div style={{ color: "crimson", marginTop: 8 }}>{error}</div> : null}

          {!isValid && (
            <p style={{ marginTop: 10, color: "#bbb", fontSize: 13 }}>
              Fill the required fields to continue.
            </p>
          )}
        </div>

        {/* RIGHT: summary */}
        <div style={{ border: "1px solid #333", borderRadius: 14, padding: 14, height: "fit-content" }}>
          <h2 style={{ marginTop: 0 }}>Order summary</h2>

          <div style={{ display: "grid", gap: 10 }}>
            {items.map((it) => (
              <div key={it._key} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ maxWidth: 250 }}>
                  <strong>{it.name}</strong>
                  <div style={{ color: "#bbb", fontSize: 12 }}>
                    Qty: {it.qty}
                    {it.customisation?.size ? ` • ${it.customisation.size}` : ""}
                    {it.customisation?.flavour ? ` • ${it.customisation.flavour}` : ""}
                  </div>
                </div>
                <div>{formatGBP(it.unitPricePence * it.qty)}</div>
              </div>
            ))}
          </div>

          <hr style={{ borderColor: "#333", margin: "14px 0" }} />

          <Row label="Subtotal" value={formatGBP(subtotalPence)} />
          <Row label="Delivery fee" value={formatGBP(deliveryFeePence)} />
          <Row label={<strong>Total</strong>} value={<strong>{formatGBP(totalPence)}</strong>} />

          <div style={{ marginTop: 12 }}>
            <Link to="/cart">← Back to cart</Link>
          </div>
        </div>
      </div>

      {/* Mobile fallback */}
      <div style={{ marginTop: 12, color: "#777", fontSize: 12 }}>
        Tip: We’ll validate again on the server before Stripe (prevents tampering).
      </div>
    </div>
  );
}

function Field({ label, value, onChange, onBlur, error, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", marginBottom: 6 }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{ padding: 10, width: "100%" }}
      />
      {error ? <div style={{ color: "crimson", fontSize: 13, marginTop: 6 }}>{error}</div> : null}
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
    border: "1px solid #444",
    cursor: "pointer",
    background: active ? "#444" : "transparent",
    color: active ? "#fff" : "inherit",
  };
}