import { Link } from "react-router-dom";

export default function Contact() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
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
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>Contact Us</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: 18 }}>
          We'd love to hear from you!
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {/* Contact Info Card */}
        <div
          className="card"
          style={{ padding: 24, lineHeight: 1.8 }}
        >
          <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>Get in Touch</h2>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>📞</span>
              <div>
                <strong>Phone</strong>
                <div style={{ color: "var(--color-text-muted)" }}>
                  <a href="tel:+447123456789" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                    07123 456 789
                  </a>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>📧</span>
              <div>
                <strong>Email</strong>
                <div style={{ color: "var(--color-text-muted)" }}>
                  <a href="mailto:hello@albakes.co.uk" style={{ color: "var(--color-primary)", textDecoration: "none" }}>
                    hello@albakes.co.uk
                  </a>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>📍</span>
              <div>
                <strong>Location</strong>
                <div style={{ color: "var(--color-text-muted)" }}>
                  123 Bakery Lane<br />
                  London, UB8 1AA
                </div>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: "var(--color-border)", margin: "20px 0" }} />

          <h3 style={{ marginBottom: 12 }}>Opening Hours</h3>
          <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Monday - Friday</span>
              <span style={{ color: "var(--color-text-muted)" }}>8:00 AM - 6:00 PM</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Saturday</span>
              <span style={{ color: "var(--color-text-muted)" }}>9:00 AM - 5:00 PM</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Sunday</span>
              <span style={{ color: "var(--color-text-muted)" }}>10:00 AM - 4:00 PM</span>
            </div>
          </div>
        </div>

        {/* Order Info Card */}
        <div
          className="card"
          style={{ padding: 24, lineHeight: 1.8 }}
        >
          <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>Ordering Information</h2>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 8, fontSize: 16 }}>Custom Orders</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>
              For custom cakes and large orders, please contact us at least 48 hours in advance.
              We're happy to accommodate special requests and dietary requirements.
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 8, fontSize: 16 }}>Delivery</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>
              We deliver within a 10-mile radius of our location. Delivery fees apply based on distance.
              Free pickup is always available!
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 8, fontSize: 16 }}>Payment</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14, margin: 0 }}>
              We accept all major credit/debit cards through our secure online checkout powered by Stripe.
            </p>
          </div>

          <div
            style={{
              background: "var(--color-bg-secondary)",
              padding: 16,
              borderRadius: 12,
              marginTop: 20,
            }}
          >
            <p style={{ margin: 0, fontSize: 14 }}>
              <strong>Quick Tip:</strong> Order online for the fastest service! Browse our menu and place your order anytime.
            </p>
            <Link
              to="/menu"
              style={{
                display: "inline-block",
                marginTop: 12,
                padding: "10px 20px",
                borderRadius: 10,
                background: "var(--color-primary)",
                color: "#000",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Order Now
            </Link>
          </div>
        </div>
      </div>

      {/* Facebook */}
      <div
        className="card"
        style={{ padding: 24, marginTop: 24, textAlign: "center" }}
      >
        <h3 style={{ marginTop: 0 }}>Find Us on Facebook</h3>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 16 }}>
          Follow us for our latest creations, behind-the-scenes baking, and special offers!
        </p>
        <a
          href="https://www.facebook.com/people/AL-Bakes/61587012191793/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 24px",
            borderRadius: 12,
            background: "#1877F2",
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none",
            fontSize: 16,
          }}
        >
          <span style={{ fontSize: 24 }}>👍</span>
          A&L Bakes
        </a>
      </div>
    </div>
  );
}
