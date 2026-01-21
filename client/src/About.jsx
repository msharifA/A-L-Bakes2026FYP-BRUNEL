import { Link } from "react-router-dom";

export default function About() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img
          src="/logo.jpg"
          alt="A&L Bakes"
          style={{
            width: 150,
            height: 150,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 16,
          }}
        />
        <h1 style={{ fontSize: 36, marginBottom: 8 }}>About A&L Bakes</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: 18 }}>
          Handcrafted with love, baked with passion
        </p>
      </div>

      <div
        className="card"
        style={{ padding: 24, marginBottom: 24, lineHeight: 1.8 }}
      >
        <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>Our Story</h2>
        <p>
          A&L Bakes started as a small family kitchen dream in 2020. What began as
          baking treats for friends and family quickly blossomed into a beloved
          local bakery known for its artisan cakes and pastries.
        </p>
        <p>
          Every item we create is made from scratch using the finest ingredients,
          traditional techniques, and a whole lot of love. We believe that the best
          baked goods come from taking the time to do things right.
        </p>
      </div>

      <div
        className="card"
        style={{ padding: 24, marginBottom: 24, lineHeight: 1.8 }}
      >
        <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>What We Offer</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 16 }}>
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎂</div>
            <strong>Custom Cakes</strong>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              Bespoke designs for birthdays, weddings & celebrations
            </p>
          </div>
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧁</div>
            <strong>Cupcakes</strong>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              Perfectly portioned treats in various flavours
            </p>
          </div>
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🥐</div>
            <strong>Pastries</strong>
            <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
              Freshly baked croissants, danishes & more
            </p>
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{ padding: 24, marginBottom: 24, lineHeight: 1.8 }}
      >
        <h2 style={{ marginTop: 0, color: "var(--color-primary)" }}>Our Promise</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>Fresh ingredients sourced locally where possible</li>
          <li>No artificial preservatives or additives</li>
          <li>Made to order for maximum freshness</li>
          <li>Allergen information available on request</li>
        </ul>
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <p style={{ marginBottom: 16 }}>Ready to taste the difference?</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to="/menu"
            style={{
              padding: "14px 26px",
              borderRadius: 14,
              background: "var(--color-primary)",
              color: "#000",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View Our Menu
          </Link>
          <Link
            to="/contact"
            style={{
              padding: "14px 26px",
              borderRadius: 14,
              border: "1px solid var(--color-border)",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
