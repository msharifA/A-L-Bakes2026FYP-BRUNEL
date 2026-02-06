// Cart Context - Global shopping cart with localStorage persistence

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "albakes_cart_v1";
const MAX_QTY_PER_ITEM = 3;

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function CartProvider({ children }) {
  // Load cart from localStorage on mount
  const [items, setItems] = useState(() => safeParse(localStorage.getItem(STORAGE_KEY), []));

  // Persist cart to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Add item to cart (merges if same product+customisation exists)
  const addItem = (product, customisation, qty = 1) => {
    const key = JSON.stringify({ productId: product.id, customisation: customisation || {} });

    setItems((prev) => {
      const next = [...prev];
      const idx = next.findIndex((it) => it._key === key);

      if (idx >= 0) {
        next[idx] = { ...next[idx], qty: Math.min(next[idx].qty + qty, MAX_QTY_PER_ITEM) };
        return next;
      }

      next.push({
        _key: key,
        productId: product.id,
        name: product.name,
        unitPricePence: product.price_pence,
        category: product.category,
        qty: Math.min(qty, MAX_QTY_PER_ITEM),
        customisation: customisation || {},
      });
      return next;
    });
  };

  const removeItem = (key) => setItems((prev) => prev.filter((it) => it._key !== key));

  const setQty = (key, qty) => {
    const q = Number(qty);
    if (!Number.isFinite(q)) return;
    setItems((prev) =>
      prev
        .map((it) => (it._key === key ? { ...it, qty: Math.max(1, Math.min(MAX_QTY_PER_ITEM, q)) } : it))
        .filter((it) => it.qty > 0)
    );
  };

  const clearCart = useCallback(() => setItems([]), []);

  const subtotalPence = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPricePence * it.qty, 0),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQty, clearCart, subtotalPence, maxQtyPerItem: MAX_QTY_PER_ITEM }),
    [items, subtotalPence, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Hook to access cart from any component
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
