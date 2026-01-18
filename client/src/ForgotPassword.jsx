import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "./api/customerAuth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 450, margin: "0 auto", padding: 16 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/src/assets/logo.jpg"
            alt="A&L Bakes"
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: 16,
            }}
          />
          <h1 style={{ marginBottom: 8 }}>Check Your Email</h1>
        </div>

        <div
          className="card"
          style={{ padding: 24, textAlign: "center" }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "rgba(40, 167, 69, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 28,
            }}
          >
            ✉️
          </div>
          <p style={{ marginBottom: 16 }}>
            If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
          </p>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14, marginBottom: 20 }}>
            Check your spam folder if you don't see it in your inbox.
          </p>
          <Link
            to="/login"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: 10,
              background: "var(--color-primary)",
              color: "#000",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 450, margin: "0 auto", padding: 16 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <img
          src="/src/assets/logo.jpg"
          alt="A&L Bakes"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 16,
          }}
        />
        <h1 style={{ marginBottom: 8 }}>Forgot Password</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div
        className="card"
        style={{ padding: 24 }}
      >
        {error && (
          <div
            style={{
              padding: 12,
              marginBottom: 16,
              borderRadius: 8,
              background: "rgba(220, 53, 69, 0.1)",
              color: "var(--color-error)",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ padding: 12, width: "100%" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              background: "var(--color-primary)",
              color: "#000",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            paddingTop: 20,
            borderTop: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <Link to="/login" style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
