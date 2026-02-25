import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFeaturedProducts } from "./api/products";
import { formatGBP } from "./utils/formatGBP";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getFeaturedProducts()
      .then(setFeatured)
      .catch((e) => setError(e.message || "Failed to load featured products"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      {/* HERO */}
      <section style={{ padding: "60px 0", textAlign: "center" }}>
        <img
          src="/logo.jpg"
          alt="A&L Bakes"
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: 24,
          }}
        />
        <h1 style={{ fontSize: 42, marginBottom: 12 }}>Freshly Baked, Made to Order</h1>
        <p style={{ color: "#bbb", marginBottom: 24 }}>
          Artisan cakes & pastries baked fresh for every occasion.
        </p>
        <Link
          to="/menu"
          style={{
            padding: "14px 26px",
            borderRadius: 14,
            background: "#f5a623",
            color: "#000",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Order Online
        </Link>
      </section>

      {/* FEATURED */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ marginBottom: 16 }}>Our Popular Bakes</h2>

        {loading && <p>Loading featured products…</p>}
        {error && <p style={{ color: "crimson" }}>{error}</p>}

        {!loading && !error && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {featured.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                style={{
                  border: "1px solid #333",
                  borderRadius: 14,
                  padding: 12,
                  textDecoration: "none",
                  color: "inherit",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#333";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{
                      height: 120,
                      width: "100%",
                      borderRadius: 12,
                      objectFit: "cover",
                      marginBottom: 10,
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  style={{
                    height: 120,
                    borderRadius: 12,
                    background: "#2a2a2a",
                    display: p.image_url ? "none" : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                    fontSize: 12,
                    color: "#aaa",
                  }}
                >
                  No image
                </div>

                <strong>{p.name}</strong>
                <p style={{ fontSize: 13, color: "#bbb" }}>{p.description}</p>
                <p>{formatGBP(p.price_pence)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ marginBottom: 48, textAlign: "center" }}>
        <p style={{ fontSize: 18 }}>
          ⭐⭐⭐⭐⭐ <strong>4.9/5</strong> from happy customers
        </p>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          borderTop: "1px solid #333",
          paddingTop: 24,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span>© A&L Bakes</span>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/menu">Menu</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/about">About</Link>
        </div>
      </footer>
    </div>
  );
}
