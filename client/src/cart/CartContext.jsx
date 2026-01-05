import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "albakes_cart_v1";

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    return safeParse(localStorage.getItem(STORAGE_KEY), []);
  });

  // persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // helpers
  const addItem = (product, customisation, qty = 1) => {
    const productId = product.id;

    // same product + same customisation should merge quantities
    const key = JSON.stringify({
      productId,
      customisation: customisation || {},
    });

    setItems((prev) => {
      const next = [...prev];
      const idx = next.findIndex((it) => it._key === key);

      if (idx >= 0) {
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }

      next.push({
        _key: key, // internal unique key for merge
        productId,
        name: product.name,
        unitPricePence: product.price_pence,
        category: product.category,
        qty,
        customisation: customisation || {},
      });
      return next;
    });
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((it) => it._key !== key));
  };

  const setQty = (key, qty) => {
    const q = Number(qty);
    if (!Number.isFinite(q)) return;
    setItems((prev) =>
      prev
        .map((it) => (it._key === key ? { ...it, qty: Math.max(1, Math.min(99, q)) } : it))
        .filter((it) => it.qty > 0)
    );
  };

  const clearCart = () => setItems([]);

  const subtotalPence = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPricePence * it.qty, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQty, clearCart, subtotalPence }),
    [items, subtotalPence]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
