import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { formatGBP } from "./utils/formatGBP";
import { getEnquiry, confirmDeposit } from "./api/enquiries";

export default function CustomCakeSuccess() {
  const [params] = useSearchParams();
  const enquiryId = params.get("enquiry_id");
  const sessionId = params.get("session_id");

  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!enquiryId || !sessionId) {
      setError("Missing enquiry or session information");
      setLoading(false);
      return;
    }

    confirmDeposit(enquiryId, sessionId)
      .then((data) => {
        setEnquiry(data.enquiry);
        setConfirmed(true);
      })
      .catch(() => {
        // Deposit might already be confirmed - try fetching enquiry
        return getEnquiry(enquiryId).then((data) => {
          setEnquiry(data.enquiry);
          if (data.enquiry.deposit_status === "paid") setConfirmed(true);
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [enquiryId, sessionId]);

  if (loading) {
    return (
      <div style={{ padding: 16, maxWidth: 600, margin: "0 auto", textAlign: "center", marginTop: 60 }}>
        <p>Confirming your deposit...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, maxWidth: 600, margin: "0 auto", textAlign: "center", marginTop: 60 }}>
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ marginTop: 0, color: "salmon" }}>Something went wrong</h2>
          <p>{error}</p>
          <Link
            to="/custom-cake"
            style={{
              display: "inline-block",
              marginTop: 16,
              padding: "10px 24px",
              borderRadius: 8,
              background: "var(--color-primary)",
              color: "#000",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to Cake Builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: "0 auto", marginTop: 40 }}>
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>&#10003;</div>
        <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>
          {confirmed ? "Deposit Confirmed!" : "Enquiry Received"}
        </h2>

        {confirmed ? (
          <p>Thank you! Your 50% deposit has been received and your custom cake order is confirmed.</p>
        ) : (
          <p>We've received your enquiry. Please complete the deposit to confirm your order.</p>
        )}

        {enquiry && (
          <div style={{ background: "var(--color-bg-secondary)", padding: 20, borderRadius: 12, margin: "24px 0", textAlign: "left" }}>
            <p style={{ margin: "6px 0" }}><strong>Size:</strong> {enquiry.cake_size}</p>
            <p style={{ margin: "6px 0" }}><strong>Flavour:</strong> {enquiry.cake_flavour}</p>
            {enquiry.filling && <p style={{ margin: "6px 0" }}><strong>Filling:</strong> {enquiry.filling}</p>}
            {enquiry.frosting && <p style={{ margin: "6px 0" }}><strong>Frosting:</strong> {enquiry.frosting}</p>}
            {enquiry.message_on_cake && <p style={{ margin: "6px 0" }}><strong>Message:</strong> "{enquiry.message_on_cake}"</p>}
            {enquiry.event_date && (
              <p style={{ margin: "6px 0" }}>
                <strong>Date:</strong> {new Date(enquiry.event_date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "12px 0" }} />
            <p style={{ margin: "6px 0" }}><strong>Estimated Total:</strong> {formatGBP(enquiry.estimated_price_pence)}</p>
            {confirmed && (
              <>
                <p style={{ margin: "6px 0", color: "var(--color-primary)", fontWeight: 700 }}>
                  <strong>Deposit Paid:</strong> {formatGBP(enquiry.deposit_pence)}
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>Remaining Balance:</strong> {formatGBP(enquiry.estimated_price_pence - enquiry.deposit_pence)}
                </p>
              </>
            )}
          </div>
        )}

        <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 24 }}>
          A confirmation email has been sent to <strong>{enquiry?.customer_email}</strong>. We'll be in touch to finalise the details.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/menu"
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              background: "var(--color-primary)",
              color: "#000",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Browse Menu
          </Link>
          <Link
            to="/"
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              textDecoration: "none",
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
