import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getProducts, deleteProduct, toggleFeatured, toggleActive } from "./api/adminProducts";

const formatGBP = (pence) => `£${(pence / 100).toFixed(2)}`;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will hide it from the shop.`)) {
      return;
    }

    setActionLoading(id);
    try {
      await deleteProduct(id);
      setProducts(products.map((p) => (p.id === id ? { ...p, is_active: false } : p)));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (id) => {
    setActionLoading(id);
    try {
      const data = await toggleFeatured(id);
      setProducts(
        products.map((p) => (p.id === id ? { ...p, is_featured: data.product.is_featured } : p))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (id) => {
    setActionLoading(id);
    try {
      const data = await toggleActive(id);
      setProducts(
        products.map((p) => (p.id === id ? { ...p, is_active: data.product.is_active } : p))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "var(--color-error)" }}>{error}</p>
        <Link to="/admin" style={{ color: "var(--color-primary)" }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Link to="/admin" style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ marginTop: 8 }}>Product Management</h1>
        </div>
        <Link
          to="/admin/products/new"
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            background: "var(--color-primary)",
            color: "#000",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          + Add Product
        </Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              <th style={{ textAlign: "left", padding: 12 }}>Product</th>
              <th style={{ textAlign: "left", padding: 12 }}>Category</th>
              <th style={{ textAlign: "right", padding: 12 }}>Price</th>
              <th style={{ textAlign: "center", padding: 12 }}>Featured</th>
              <th style={{ textAlign: "center", padding: 12 }}>Active</th>
              <th style={{ textAlign: "right", padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  opacity: product.is_active ? 1 : 0.5,
                }}
              >
                <td style={{ padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{
                          width: 50,
                          height: 50,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    )}
                    <div>
                      <strong>{product.name}</strong>
                      {product.description && (
                        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                          {product.description.slice(0, 50)}
                          {product.description.length > 50 ? "..." : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ padding: 12, color: "var(--color-text-muted)" }}>
                  {product.category || "-"}
                </td>
                <td style={{ padding: 12, textAlign: "right", fontWeight: 600 }}>
                  {formatGBP(product.price_pence)}
                </td>
                <td style={{ padding: 12, textAlign: "center" }}>
                  <button
                    onClick={() => handleToggleFeatured(product.id)}
                    disabled={actionLoading === product.id}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: product.is_featured ? "#f5a623" : "var(--color-bg-card)",
                      color: product.is_featured ? "#000" : "var(--color-text-muted)",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {product.is_featured ? "Yes" : "No"}
                  </button>
                </td>
                <td style={{ padding: 12, textAlign: "center" }}>
                  <button
                    onClick={() => handleToggleActive(product.id)}
                    disabled={actionLoading === product.id}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: product.is_active ? "#28a745" : "#dc3545",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td style={{ padding: 12, textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <Link
                      to={`/admin/products/${product.id}/edit`}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        background: "var(--color-bg-card)",
                        color: "var(--color-text)",
                        textDecoration: "none",
                        fontSize: 13,
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={actionLoading === product.id}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 6,
                        background: "transparent",
                        color: "#dc3545",
                        border: "1px solid #dc3545",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)" }}>
          No products found. Add your first product!
        </div>
      )}
    </div>
  );
}
