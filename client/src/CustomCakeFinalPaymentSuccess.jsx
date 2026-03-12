/**
 * =============================================================================
 * CUSTOM CAKE FINAL PAYMENT SUCCESS PAGE
 * =============================================================================
 *
 * PURPOSE:
 * Shows confirmation after customer completes final payment for custom cake
 *
 * WHEN IS THIS SHOWN?
 * After customer clicks payment link in email and completes payment on Stripe,
 * Stripe redirects here with session_id in URL params
 *
 * FLOW:
 * 1. User pays on Stripe → Stripe redirects to this page
 * 2. Page extracts session_id and enquiry_id from URL params
 * 3. Calls backend API to confirm payment
 * 4. Backend verifies with Stripe and marks enquiry as completed
 * 5. Shows success message to customer
 *
 * URL PARAMS:
 * - session_id: Stripe checkout session ID (from Stripe redirect)
 * - enquiry_id: Our enquiry UUID (set in success_url when creating session)
 *
 * EXAMPLE URL:
 * /custom-cake/final-payment-success?enquiry_id=abc123&session_id=cs_test_xyz
 */

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { confirmFinalPayment } from "./api/enquiries";

export default function CustomCakeFinalPaymentSuccess() {
  // Extract URL parameters (Stripe puts session_id in URL)
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const enquiryId = searchParams.get("enquiry_id");

  // Component state
  // 'loading' → verifying payment with backend
  // 'success' → payment confirmed
  // 'error' → something went wrong
  const [status, setStatus] = useState("loading");
  const [enquiry, setEnquiry] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  /**
   * ON PAGE LOAD: Verify payment with backend
   * useEffect runs once when component mounts
   */
  useEffect(() => {
    // VALIDATION: Ensure we have required URL params
    if (!sessionId || !enquiryId) {
      setStatus("error");
      setErrorMessage("Missing payment information in URL");
      console.error("Missing session_id or enquiry_id in URL params");
      return;
    }

    console.log(`Confirming final payment for enquiry ${enquiryId}...`);

    // CALL BACKEND: Verify payment and update enquiry status
    confirmFinalPayment(enquiryId, sessionId)
      .then((response) => {
        console.log("✅ Final payment confirmed:", response);
        setEnquiry(response.enquiry);
        setStatus("success");

        // If payment was already confirmed (user refreshed page)
        if (response.alreadyPaid) {
          console.log("Payment was already confirmed previously (idempotent)");
        }
      })
      .catch((error) => {
        console.error("❌ Failed to confirm final payment:", error);
        setStatus("error");
        setErrorMessage(error.message || "Failed to verify payment");
      });
  }, [sessionId, enquiryId]);

  /**
   * LOADING STATE
   * Show spinner while verifying payment with backend
   */
  if (status === "loading") {
    return (
      <div style={{
        padding: 40,
        maxWidth: 600,
        margin: "0 auto",
        textAlign: "center",
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
        <div style={{
          display: "inline-block",
          width: 50,
          height: 50,
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #f5a623",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px",
        }} />
        <h2 style={{ margin: 0, color: "var(--color-text)" }}>
          Confirming your payment...
        </h2>
        <p style={{ color: "var(--color-text-muted)", marginTop: 8 }}>
          Please wait while we verify your transaction
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  /**
   * ERROR STATE
   * Show error message if payment confirmation failed
   */
  if (status === "error") {
    return (
      <div style={{
        padding: 40,
        maxWidth: 600,
        margin: "0 auto",
        textAlign: "center",
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
        <div style={{
          fontSize: 60,
          marginBottom: 20,
        }}>❌</div>
        <h1 style={{ margin: 0, color: "var(--color-error)" }}>
          Payment Confirmation Failed
        </h1>
        <p style={{
          color: "var(--color-text-muted)",
          marginTop: 12,
          fontSize: 15,
        }}>
          {errorMessage || "We couldn't verify your payment. Please contact us."}
        </p>
        <div style={{ marginTop: 30, display: "flex", gap: 12, justifyContent: "center" }}>
          <Link
            to="/custom-cake"
            style={{
              padding: "12px 24px",
              background: "var(--color-border)",
              color: "var(--color-text)",
              textDecoration: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Back to Custom Cakes
          </Link>
          <a
            href="mailto:albakes@example.com"
            style={{
              padding: "12px 24px",
              background: "var(--color-primary)",
              color: "#000",
              textDecoration: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  /**
   * SUCCESS STATE
   * Show celebration message after successful payment confirmation
   */
  return (
    <div style={{
      padding: 40,
      maxWidth: 700,
      margin: "0 auto",
      minHeight: "70vh",
    }}>
      {/* SUCCESS HEADER */}
      <div style={{
        textAlign: "center",
        marginBottom: 40,
      }}>
        <div style={{
          fontSize: 80,
          marginBottom: 16,
          animation: "bounce 0.6s ease",
        }}>🎉</div>
        <h1 style={{
          margin: 0,
          fontSize: 32,
          color: "#28a745",
        }}>
          Payment Complete!
        </h1>
        <p style={{
          color: "var(--color-text-muted)",
          marginTop: 8,
          fontSize: 16,
        }}>
          Thank you for your payment. Your cake is ready!
        </p>
      </div>

      {/* ORDER SUMMARY CARD */}
      <div style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: 24,
        boxShadow: "var(--shadow-sm)",
      }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>Order Summary</h2>

        <div style={{
          background: "var(--color-bg-secondary)",
          padding: 16,
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <p style={{ margin: "4px 0", fontSize: 18, fontWeight: 600 }}>
            {enquiry?.cake_size} {enquiry?.cake_flavour} Cake
          </p>
          {enquiry?.filling && (
            <p style={{ margin: "4px 0", color: "var(--color-text-muted)" }}>
              <strong>Filling:</strong> {enquiry.filling}
            </p>
          )}
          {enquiry?.frosting && (
            <p style={{ margin: "4px 0", color: "var(--color-text-muted)" }}>
              <strong>Frosting:</strong> {enquiry.frosting}
            </p>
          )}
        </div>

        {/* PAYMENT BREAKDOWN */}
        <div style={{
          background: "#d4edda",
          border: "1px solid #c3e6cb",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
            color: "#155724",
          }}>
            <span>✓ Deposit Paid:</span>
            <strong>£{((enquiry?.deposit_pence || 0) / 100).toFixed(2)}</strong>
          </div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
            color: "#155724",
          }}>
            <span>✓ Final Payment:</span>
            <strong>£{((enquiry?.final_payment_pence || 0) / 100).toFixed(2)}</strong>
          </div>
          <hr style={{
            border: "none",
            borderTop: "1px solid #c3e6cb",
            margin: "12px 0",
          }} />
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 18,
            fontWeight: 700,
            color: "#155724",
          }}>
            <span>Total Paid:</span>
            <span>£{((enquiry?.estimated_price_pence || 0) / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* DELIVERY/COLLECTION INFO */}
        {enquiry?.delivery_address_line1 ? (
          <div style={{
            background: "var(--color-bg-secondary)",
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>📍 Delivery Address</h3>
            <p style={{ margin: "4px 0" }}>{enquiry.delivery_address_line1}</p>
            {enquiry.delivery_address_line2 && (
              <p style={{ margin: "4px 0" }}>{enquiry.delivery_address_line2}</p>
            )}
            <p style={{ margin: "4px 0" }}>
              {enquiry.delivery_city} {enquiry.delivery_postcode}
            </p>
            {enquiry.delivery_notes && (
              <p style={{
                margin: "8px 0 0",
                fontStyle: "italic",
                color: "var(--color-text-muted)",
              }}>
                Note: {enquiry.delivery_notes}
              </p>
            )}
          </div>
        ) : (
          <div style={{
            background: "var(--color-bg-secondary)",
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>🏪 Collection</h3>
            <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
              Your cake is ready for collection
            </p>
          </div>
        )}

        {/* EVENT DATE */}
        {enquiry?.event_date && (
          <div style={{
            background: "var(--color-bg-secondary)",
            padding: 16,
            borderRadius: 8,
            marginBottom: 16,
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>📅 Event Date</h3>
            <p style={{ margin: 0 }}>
              {new Date(enquiry.event_date).toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* CONFIRMATION EMAIL NOTICE */}
        <div style={{
          background: "#cce5ff",
          border: "1px solid #b3d9ff",
          borderRadius: 8,
          padding: 12,
          fontSize: 14,
        }}>
          <strong>📧 Confirmation Email Sent</strong>
          <p style={{ margin: "4px 0 0" }}>
            A confirmation email has been sent to <strong>{enquiry?.customer_email}</strong> with all the details.
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{
        marginTop: 30,
        display: "flex",
        gap: 12,
        justifyContent: "center",
      }}>
        <Link
          to="/"
          style={{
            padding: "12px 24px",
            background: "var(--color-primary)",
            color: "#000",
            textDecoration: "none",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Back to Home
        </Link>
        <Link
          to="/menu"
          style={{
            padding: "12px 24px",
            background: "var(--color-border)",
            color: "var(--color-text)",
            textDecoration: "none",
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Browse Menu
        </Link>
      </div>

      {/* BOUNCE ANIMATION */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
