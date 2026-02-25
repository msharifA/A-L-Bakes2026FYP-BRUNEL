import { useEffect, useMemo, useState } from "react";
import { getProducts } from "./api/products";
import { Link } from "react-router-dom";
import { useCart } from "./hooks/useCart";
import { formatGBP } from "./utils/formatGBP";

const CATEGORIES = ["All", "Cakes", "Pastries"];

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { items, addItem, removeItem, setQty, maxQtyPerItem } = useCart();

  // Helper to get quantity of a product in cart (with default customisation)
  const getProductQty = (productId) => {
    const key = JSON.stringify({
      productId,
      customisation: { size: "Medium", flavour: "Vanilla", message: "" },
    });
    const item = items.find((it) => it._key === key);
    return item ? item.qty : 0;
  };

  // Helper to get the cart key for a product
  const getCartKey = (productId) => {
    return JSON.stringify({
      productId,
      customisation: { size: "Medium", flavour: "Vanilla", message: "" },
    });
  };


  useEffect(() => {
    getProducts()
      .then((rows) => setProducts(rows))
      .catch((e) => setError(e.message || "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
  
    // filter
    let out = products.filter((p) => {
      const catOk = category === "All" || p.category === category;
      const text = `${p.name ?? ""} ${p.description ?? ""}`.toLowerCase();
      const searchOk = !q || text.includes(q);
      return catOk && searchOk;
    });
  
    // IMPORTANT: copy before sort (avoids mutating anything unexpectedly)
    out = [...out];
  
    // sort
    switch (sort) {
      case "newest":
        out.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        break;
  
      case "oldest":
        out.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        break;
  
      case "price_asc":
        out.sort((a, b) => (a.price_pence ?? 0) - (b.price_pence ?? 0));
        break;
  
      case "price_desc":
        out.sort((a, b) => (b.price_pence ?? 0) - (a.price_pence ?? 0));
        break;
  
      case "name_asc":
        out.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
  
      case "featured":
        // featured first, then newest
        out.sort((a, b) => {
          const af = a.is_featured ? 1 : 0;
          const bf = b.is_featured ? 1 : 0;
          if (bf !== af) return bf - af;
          return (b.id ?? 0) - (a.id ?? 0);
        });
        break;
  
      default:
        break;
    }
  
    return out;
  }, [products, search, category, sort]);
  
  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 12 }}>Menu</h1>

      {/* Search + Sort (wireframe top bar) */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          style={{ padding: 10, flex: 1, minWidth: 240 }}
        />
       <select value={sort} onChange={(e) => setSort(e.target.value)}>
  <option value="newest">Sort: Newest</option>
  <option value="oldest">Sort: Oldest</option>
  <option value="price_asc">Price: Low → High</option>
  <option value="price_desc">Price: High → Low</option>
  <option value="name_asc">Name: A → Z</option>
  <option value="featured">Featured first</option>
</select>

      </div>

      {/* Category tabs (All / Cakes / Pastries) */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #444",
              background: category === c ? "#444" : "transparent",
              color: category === c ? "white" : "inherit",
              cursor: "pointer",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && <p>Loading products…</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {!loading && !error && (
        <>
          <p style={{ marginBottom: 12 }}>{filtered.length} item(s)</p>

          {/* Grid cards (wireframe) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            {filtered.map((p) => (
              <div key={p.id} style={{ border: "1px solid #333", borderRadius: 14, padding: 12 }}>
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{
                      height: 140,
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
                    height: 140,
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

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
  <Link
    to={`/product/${p.id}`}
    style={{ textDecoration: "none", color: "inherit", flex: 1 }}
  >
    <strong style={{ lineHeight: 1.2 }}>{p.name}</strong>
  </Link>
  <span>{formatGBP(p.price_pence)}</span>
</div>

                {p.description && <p style={{ color: "#bbb", fontSize: 13 }}>{p.description}</p>}

                {getProductQty(p.id) === 0 ? (
                  <button
                    onClick={() =>
                      addItem(p, { size: "Medium", flavour: "Vanilla", message: "" }, 1)
                    }
                    style={{ marginTop: 10, width: "100%", padding: 10, borderRadius: 12 }}
                  >
                    Add to Cart
                  </button>
                ) : (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      background: "var(--color-bg-secondary)",
                      borderRadius: 12,
                      padding: 6,
                    }}
                  >
                    <button
                      onClick={() => {
                        const qty = getProductQty(p.id);
                        if (qty <= 1) {
                          removeItem(getCartKey(p.id));
                        } else {
                          setQty(getCartKey(p.id), qty - 1);
                        }
                      }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 18,
                        fontWeight: 600,
                      }}
                    >
                      -
                    </button>
                    <span style={{ fontWeight: 600, minWidth: 24, textAlign: "center" }}>
                      {getProductQty(p.id)}
                    </span>
                    <button
                      onClick={() =>
                        addItem(p, { size: "Medium", flavour: "Vanilla", message: "" }, 1)
                      }
                      disabled={getProductQty(p.id) >= maxQtyPerItem}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                        background: getProductQty(p.id) >= maxQtyPerItem ? "var(--color-border)" : "var(--color-primary)",
                        color: "#000",
                        cursor: getProductQty(p.id) >= maxQtyPerItem ? "not-allowed" : "pointer",
                        fontSize: 18,
                        fontWeight: 600,
                        opacity: getProductQty(p.id) >= maxQtyPerItem ? 0.5 : 1,
                      }}
                      title={getProductQty(p.id) >= maxQtyPerItem ? `Max ${maxQtyPerItem} per item` : "Add one more"}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
