import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getProduct, createProduct, updateProduct } from "./api/adminProducts";

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState({
    name: "",
    description: "",
    pricePounds: "",
    imageUrl: "",
    category: "",
    isFeatured: false,
    isActive: true,
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const data = await getProduct(id);
      const p = data.product;
      setForm({
        name: p.name || "",
        description: p.description || "",
        pricePounds: (p.price_pence / 100).toFixed(2),
        imageUrl: p.image_url || "",
        category: p.category || "",
        isFeatured: p.is_featured || false,
        isActive: p.is_active !== false,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Product name is required");
      return;
    }

    const priceNum = parseFloat(form.pricePounds);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Please enter a valid price");
      return;
    }

    setSaving(true);

    try {
      const data = {
        name: form.name,
        description: form.description,
        pricePence: Math.round(priceNum * 100),
        imageUrl: form.imageUrl,
        category: form.category,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      };

      if (isEditing) {
        await updateProduct(id, data);
      } else {
        await createProduct(data);
      }

      navigate("/admin/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/admin/products" style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          ← Back to Products
        </Link>
        <h1 style={{ marginTop: 8 }}>{isEditing ? "Edit Product" : "Add New Product"}</h1>
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
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Product Name *
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Chocolate Cake"
              required
              style={{ padding: 12, width: "100%" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your product..."
              rows={3}
              style={{ padding: 12, width: "100%", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                Price (£) *
              </label>
              <input
                type="number"
                name="pricePounds"
                value={form.pricePounds}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                style={{ padding: 12, width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                Category
              </label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Cakes, Pastries"
                style={{ padding: 12, width: "100%" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
              Image URL
            </label>
            <input
              type="url"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              style={{ padding: 12, width: "100%" }}
            />
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Preview"
                style={{
                  marginTop: 12,
                  maxWidth: 200,
                  maxHeight: 150,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
                onError={(e) => (e.target.style.display = "none")}
              />
            )}
          </div>

          <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                name="isFeatured"
                checked={form.isFeatured}
                onChange={handleChange}
                style={{ width: 18, height: 18 }}
              />
              <span>Featured Product</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                style={{ width: 18, height: 18 }}
              />
              <span>Active (visible in shop)</span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 12,
                background: "var(--color-primary)",
                color: "#000",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                border: "none",
              }}
            >
              {saving ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
            </button>
            <Link
              to="/admin/products"
              style={{
                padding: "14px 24px",
                borderRadius: 12,
                background: "var(--color-bg-card)",
                color: "var(--color-text)",
                textDecoration: "none",
                border: "1px solid var(--color-border)",
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
