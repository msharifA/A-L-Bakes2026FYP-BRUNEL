import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

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
        <h1 style={{ marginBottom: 8 }}>Welcome Back</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Sign in to your A&L Bakes account
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
              placeholder="Enter your password"
              required
              style={{ padding: 12, width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 16, textAlign: "right" }}>
            <Link
              to="/forgot-password"
              style={{ color: "var(--color-primary)", fontSize: 14 }}
            >
              Forgot password?
            </Link>
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
            {loading ? "Signing in..." : "Sign In"}
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
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link to="/admin/login" style={{ color: "var(--color-text-muted)", fontSize: 13 }}>
          Admin login
        </Link>
      </div>
    </div>
  );
}
