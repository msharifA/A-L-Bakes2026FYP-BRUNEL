import { useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "";

export default function AdminRegister() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
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
          <h1 style={{ marginBottom: 8 }}>Request Submitted</h1>
        </div>

        <div className="card" style={{ padding: 24, textAlign: "center" }}>
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
            ✓
          </div>
          <p style={{ marginBottom: 20 }}>
            Your admin registration request has been submitted. An existing admin will review
            and approve your request. You'll be able to log in once approved.
          </p>
          <Link
            to="/admin/login"
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
            Go to Admin Login
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
        <h1 style={{ marginBottom: 8 }}>Admin Registration</h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Request admin access to A&L Bakes
        </p>
      </div>

      <div className="card" style={{ padding: 24 }}>
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
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
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
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
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
              name="email"
              value={form.email}
              onChange={handleChange}
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
              name="password"
              value={form.password}
              onChange={handleChange}
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
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
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
            {loading ? "Submitting..." : "Request Admin Access"}
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
            Already have admin access?{" "}
            <Link to="/admin/login" style={{ color: "var(--color-primary)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
