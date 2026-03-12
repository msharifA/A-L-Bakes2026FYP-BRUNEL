import { useEffect, useState } from "react";
import { formatGBP } from "./utils/formatGBP";
import { getCakeConfig, submitEnquiry, createDepositSession, uploadReferenceImages } from "./api/enquiries";

const STEPS = ["Size", "Flavour", "Filling & Frosting", "Details", "Review"];

export default function CustomCakeBuilder() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [enquiryId, setEnquiryId] = useState(null);

  // Form state
  const [cakeSize, setCakeSize] = useState("");
  const [cakeFlavour, setCakeFlavour] = useState("");
  const [filling, setFilling] = useState("");
  const [frosting, setFrosting] = useState("");
  const [messageOnCake, setMessageOnCake] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddressLine1, setDeliveryAddressLine1] = useState("");
  const [deliveryAddressLine2, setDeliveryAddressLine2] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryPostcode, setDeliveryPostcode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [referenceImages, setReferenceImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    getCakeConfig()
      .then(setConfig)
      .catch(() => setError("Failed to load options"))
      .finally(() => setLoading(false));
  }, []);

  const selectedSize = config?.sizes?.find((s) => s.value === cakeSize);
  const estimatedPrice = selectedSize?.pricePence || 0;
  const depositAmount = Math.round(estimatedPrice * 0.5);

  const canNext = () => {
    if (step === 0) return !!cakeSize;
    if (step === 1) return !!cakeFlavour;
    if (step === 2) return true;
    if (step === 3) return !!customerName && !!customerEmail;
    return true;
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    const total = referenceImages.length + selected.length;
    if (total > 5) {
      setError("Maximum 5 reference images allowed");
      return;
    }
    const valid = selected.filter((f) => {
      if (f.size > 5 * 1024 * 1024) { setError(`${f.name} is too large (max 5MB)`); return false; }
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)) { setError(`${f.name} is not a supported image type`); return false; }
      return true;
    });
    const newFiles = [...referenceImages, ...valid];
    setReferenceImages(newFiles);
    valid.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let imageUrls = [];
      if (referenceImages.length > 0) {
        const uploadResult = await uploadReferenceImages(referenceImages);
        imageUrls = uploadResult.imageUrls;
      }
      const result = await submitEnquiry({
        customerName, customerEmail, customerPhone,
        cakeSize, cakeFlavour, filling, frosting,
        messageOnCake, specialRequests,
        referenceImages: imageUrls,
        eventType, eventDate: eventDate || null,
        deliveryAddressLine1, deliveryAddressLine2,
        deliveryCity, deliveryPostcode, deliveryNotes,
      });
      setEnquiryId(result.enquiry.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!enquiryId) return;
    setSubmitting(true);
    setError(null);
    try {
      const { url } = await createDepositSession(enquiryId);
      window.location.href = url;
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 16, maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <p>Loading cake builder...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ padding: 16, maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "salmon" }}>{error || "Failed to load cake builder. Please try again later."}</p>
      </div>
    );
  }

  // Enquiry submitted - show deposit prompt
  if (enquiryId) {
    return (
      <div style={{ padding: 16, maxWidth: 600, margin: "0 auto" }}>
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>Enquiry Submitted!</h2>
          <p>Your custom cake enquiry has been received. To secure your order, pay a 50% deposit below.</p>

          <div style={{ background: "var(--color-bg-secondary)", padding: 20, borderRadius: 12, margin: "24px 0" }}>
            <p style={{ margin: "4px 0" }}><strong>Cake:</strong> {selectedSize?.label} {cakeFlavour}</p>
            {filling && <p style={{ margin: "4px 0" }}><strong>Filling:</strong> {filling}</p>}
            {frosting && <p style={{ margin: "4px 0" }}><strong>Frosting:</strong> {frosting}</p>}
            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "12px 0" }} />
            <p style={{ margin: "4px 0" }}><strong>Estimated Total:</strong> {formatGBP(estimatedPrice)}</p>
            <p style={{ margin: "4px 0", fontSize: 18, fontWeight: 700 }}>
              <strong>Deposit (50%):</strong> {formatGBP(depositAmount)}
            </p>
          </div>

          {error && <p style={{ color: "salmon", marginBottom: 12 }}>{error}</p>}

          <button
            onClick={handlePayDeposit}
            disabled={submitting}
            style={{
              padding: "14px 32px",
              borderRadius: 10,
              background: "var(--color-primary)",
              color: "#000",
              fontWeight: 700,
              fontSize: 16,
              border: "none",
              cursor: submitting ? "wait" : "pointer",
              width: "100%",
            }}
          >
            {submitting ? "Redirecting to payment..." : `Pay Deposit - ${formatGBP(depositAmount)}`}
          </button>

          <p style={{ marginTop: 16, fontSize: 13, color: "var(--color-text-muted)" }}>
            The remaining {formatGBP(estimatedPrice - depositAmount)} is due on collection/delivery.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: 8 }}>Build Your Custom Cake</h1>
      <p style={{ textAlign: "center", color: "var(--color-text-muted)", marginBottom: 24 }}>
        Design your perfect cake and we'll bring it to life
      </p>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: i <= step ? "var(--color-primary)" : "var(--color-border)",
                transition: "background 0.3s",
              }}
            />
            <span style={{ fontSize: 11, color: i <= step ? "var(--color-primary)" : "var(--color-text-muted)", marginTop: 4, display: "block" }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 24 }}>
        {/* Step 0: Size */}
        {step === 0 && (
          <>
            <h2 style={{ marginTop: 0 }}>Choose Your Size</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {config.sizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setCakeSize(size.value)}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border: cakeSize === size.value ? "2px solid var(--color-primary)" : "2px solid var(--color-border)",
                    background: cakeSize === size.value ? "rgba(245,166,35,0.1)" : "var(--color-bg-secondary)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{size.label}</div>
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{size.servings} servings</div>
                  <div style={{ fontWeight: 700, color: "var(--color-primary)", marginTop: 8 }}>{formatGBP(size.pricePence)}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 1: Flavour */}
        {step === 1 && (
          <>
            <h2 style={{ marginTop: 0 }}>Choose Your Flavour</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {config.flavours.map((f) => (
                <button
                  key={f}
                  onClick={() => setCakeFlavour(f)}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: cakeFlavour === f ? "2px solid var(--color-primary)" : "2px solid var(--color-border)",
                    background: cakeFlavour === f ? "rgba(245,166,35,0.1)" : "var(--color-bg-secondary)",
                    cursor: "pointer",
                    fontWeight: cakeFlavour === f ? 700 : 400,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Filling & Frosting */}
        {step === 2 && (
          <>
            <h2 style={{ marginTop: 0 }}>Filling & Frosting</h2>
            <h3 style={{ marginBottom: 8 }}>Filling (optional)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
              {config.fillings.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilling(filling === f ? "" : f)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: filling === f ? "2px solid var(--color-primary)" : "2px solid var(--color-border)",
                    background: filling === f ? "rgba(245,166,35,0.1)" : "var(--color-bg-secondary)",
                    cursor: "pointer",
                    fontWeight: filling === f ? 700 : 400,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <h3 style={{ marginBottom: 8 }}>Frosting (optional)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
              {config.frostings.map((f) => (
                <button
                  key={f}
                  onClick={() => setFrosting(frosting === f ? "" : f)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: frosting === f ? "2px solid var(--color-primary)" : "2px solid var(--color-border)",
                    background: frosting === f ? "rgba(245,166,35,0.1)" : "var(--color-bg-secondary)",
                    cursor: "pointer",
                    fontWeight: frosting === f ? 700 : 400,
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <>
            <h2 style={{ marginTop: 0 }}>Your Details</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Name *</span>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your full name"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                />
              </label>
              <label>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Email *</span>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                />
              </label>
              <label>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Phone (optional)</span>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="07xxx xxx xxx"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                />
              </label>

              <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />
              <h3 style={{ marginTop: 12, marginBottom: 8 }}>Delivery Address (optional)</h3>

              <label>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Address Line 1</span>
                <input
                  value={deliveryAddressLine1}
                  onChange={(e) => setDeliveryAddressLine1(e.target.value)}
                  placeholder="House number and street"
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                />
              </label>
              <label>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Address Line 2</span>
                <input
                  value={deliveryAddressLine2}
                  onChange={(e) => setDeliveryAddressLine2(e.target.value)}
                  placeholder="Flat, building, etc."
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>City</span>
                  <input
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    placeholder="e.g. London"
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                  />
                </label>
                <label>
                  <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Postcode</span>
                  <input
                    value={deliveryPostcode}
                    onChange={(e) => setDeliveryPostcode(e.target.value)}
                    placeholder="e.g. UB8 1AA"
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                  />
                </label>
              </div>
              <label>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Delivery Notes</span>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Special delivery instructions, etc."
                  rows={2}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)", resize: "vertical" }}
                />
              </label>

              <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />

              <label>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Event Type</span>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                >
                  <option value="">Select event type</option>
                  {config.eventTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Event Date</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                />
              </label>
              <label>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Message on Cake</span>
                <input
                  value={messageOnCake}
                  onChange={(e) => setMessageOnCake(e.target.value)}
                  placeholder="e.g. Happy Birthday Sarah!"
                  maxLength={200}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                />
              </label>
              <label>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Special Requests</span>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Allergies, colour scheme, etc."
                  rows={3}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)", resize: "vertical" }}
                />
              </label>
              <div>
                <span style={{ fontWeight: 600, display: "block", marginBottom: 4 }}>Reference Images (optional, max 5)</span>
                <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "0 0 8px" }}>
                  Upload photos of designs you like. JPEG, PNG, WebP or GIF, max 5MB each.
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleFileSelect}
                  disabled={referenceImages.length >= 5}
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border)", background: "var(--color-bg-secondary)" }}
                />
                {imagePreviews.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {imagePreviews.map((src, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <img src={src} alt={`Reference ${i + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid var(--color-border)" }} />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "#e74c3c", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <>
            <h2 style={{ marginTop: 0 }}>Review Your Cake</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p><strong>Size:</strong> {selectedSize?.label} ({selectedSize?.servings} servings)</p>
              <p><strong>Flavour:</strong> {cakeFlavour}</p>
              {filling && <p><strong>Filling:</strong> {filling}</p>}
              {frosting && <p><strong>Frosting:</strong> {frosting}</p>}
              {messageOnCake && <p><strong>Message:</strong> "{messageOnCake}"</p>}
              {specialRequests && <p><strong>Special Requests:</strong> {specialRequests}</p>}
              {imagePreviews.length > 0 && (
                <div>
                  <strong>Reference Images:</strong> {imagePreviews.length} image(s)
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    {imagePreviews.map((src, i) => (
                      <img key={i} src={src} alt={`Reference ${i + 1}`} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6 }} />
                    ))}
                  </div>
                </div>
              )}
              {eventType && <p><strong>Event:</strong> {eventType}</p>}
              {eventDate && <p><strong>Date:</strong> {new Date(eventDate).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>}
              <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />
              <p><strong>Name:</strong> {customerName}</p>
              <p><strong>Email:</strong> {customerEmail}</p>
              {customerPhone && <p><strong>Phone:</strong> {customerPhone}</p>}
              {(deliveryAddressLine1 || deliveryCity || deliveryPostcode) && (
                <>
                  <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />
                  <p><strong>Delivery Address:</strong></p>
                  <p style={{ marginLeft: 16, lineHeight: 1.6 }}>
                    {deliveryAddressLine1}
                    {deliveryAddressLine2 && <><br />{deliveryAddressLine2}</>}
                    {deliveryCity && <><br />{deliveryCity}{deliveryPostcode && `, ${deliveryPostcode}`}</>}
                  </p>
                  {deliveryNotes && <p><strong>Delivery Notes:</strong> {deliveryNotes}</p>}
                </>
              )}
              <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "8px 0" }} />
              <p style={{ fontSize: 18 }}><strong>Estimated Price:</strong> {formatGBP(estimatedPrice)}</p>
              <p style={{ fontSize: 18, color: "var(--color-primary)" }}>
                <strong>Deposit (50%):</strong> {formatGBP(depositAmount)}
              </p>
            </div>
          </>
        )}

        {error && <p style={{ color: "salmon", marginTop: 12 }}>{error}</p>}

        {/* Navigation buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-text)",
              cursor: step === 0 ? "not-allowed" : "pointer",
              opacity: step === 0 ? 0.4 : 1,
            }}
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: canNext() ? "var(--color-primary)" : "var(--color-border)",
                color: "#000",
                fontWeight: 600,
                cursor: canNext() ? "pointer" : "not-allowed",
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: "var(--color-primary)",
                color: "#000",
                fontWeight: 700,
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              {submitting ? "Submitting..." : "Submit & Pay Deposit"}
            </button>
          )}
        </div>
      </div>

      {/* Live price preview */}
      {cakeSize && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "12px 20px",
            boxShadow: "var(--shadow-sm)",
            zIndex: 50,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Estimated Price</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{formatGBP(estimatedPrice)}</div>
          <div style={{ fontSize: 12, color: "var(--color-primary)" }}>Deposit: {formatGBP(depositAmount)}</div>
        </div>
      )}
    </div>
  );
}
