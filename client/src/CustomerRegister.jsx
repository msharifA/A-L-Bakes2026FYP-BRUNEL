import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await register({ email, password, firstName, lastName });
      navigate("/");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 450, margin: "0 auto", padding: 16 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <img
          src="/logo.jpg"
          alt="A&L Bakes"
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 16,
          }}
        />
        <h1 style={{ marginBottom: 8 }}>Create Account</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Join A&L Bakes to save your cart and track orders
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                style={{ padding: 12, width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                style={{ padding: 12, width: "100%" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Email
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

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              style={{ padding: 12, width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
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
            {loading ? "Creating account..." : "Create Account"}
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
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
