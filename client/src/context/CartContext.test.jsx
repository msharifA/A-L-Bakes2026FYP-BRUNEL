import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";

// Mock product for testing
const mockProduct = {
  id: 1,
  name: "Chocolate Cake",
  price_pence: 2500,
  category: "Cakes",
};

const mockProduct2 = {
  id: 2,
  name: "Vanilla Cupcake",
  price_pence: 350,
  category: "Cupcakes",
};

describe("CartContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
  });

  it("starts with empty cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current.items).toEqual([]);
    expect(result.current.subtotalPence).toBe(0);
  });

  it("loads cart from localStorage on mount", () => {
    const savedCart = [
      {
        _key: '{"productId":1,"customisation":{}}',
        productId: 1,
        name: "Saved Cake",
        unitPricePence: 2000,
        qty: 2,
        customisation: {},
      },
    ];
    localStorage.getItem.mockReturnValue(JSON.stringify(savedCart));

    const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe("Saved Cake");
  });

  describe("addItem", () => {
    it("adds new item to cart", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, { size: "Medium" }, 1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].name).toBe("Chocolate Cake");
      expect(result.current.items[0].qty).toBe(1);
      expect(result.current.items[0].customisation).toEqual({ size: "Medium" });
    });

    it("merges quantity when same product+customisation added", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, { size: "Medium" }, 1);
      });

      act(() => {
        result.current.addItem(mockProduct, { size: "Medium" }, 1);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].qty).toBe(2);
    });

    it("creates separate items for different customisations", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, { size: "Small" }, 1);
      });

      act(() => {
        result.current.addItem(mockProduct, { size: "Large" }, 1);
      });

      expect(result.current.items).toHaveLength(2);
    });

    it("respects MAX_QTY_PER_ITEM limit of 3", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, {}, 5);
      });

      expect(result.current.items[0].qty).toBe(3);
    });

    it("caps quantity at 3 when adding to existing item", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, {}, 2);
      });

      act(() => {
        result.current.addItem(mockProduct, {}, 2);
      });

      expect(result.current.items[0].qty).toBe(3);
    });
  });

  describe("removeItem", () => {
    it("removes item from cart by key", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, {}, 1);
        result.current.addItem(mockProduct2, {}, 1);
      });

      const keyToRemove = result.current.items[0]._key;

      act(() => {
        result.current.removeItem(keyToRemove);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].name).toBe("Vanilla Cupcake");
    });
  });

  describe("setQty", () => {
    it("updates quantity of item", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, {}, 1);
      });

      const key = result.current.items[0]._key;

      act(() => {
        result.current.setQty(key, 2);
      });

      expect(result.current.items[0].qty).toBe(2);
    });

    it("respects minimum quantity of 1", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, {}, 2);
      });

      const key = result.current.items[0]._key;

      act(() => {
        result.current.setQty(key, 0);
      });

      expect(result.current.items[0].qty).toBe(1);
    });

    it("respects maximum quantity of 3", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, {}, 1);
      });

      const key = result.current.items[0]._key;

      act(() => {
        result.current.setQty(key, 10);
      });

      expect(result.current.items[0].qty).toBe(3);
    });
  });

  describe("clearCart", () => {
    it("removes all items from cart", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, {}, 1);
        result.current.addItem(mockProduct2, {}, 2);
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe("subtotalPence", () => {
    it("calculates correct subtotal", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, {}, 2); // 2500 * 2 = 5000
        result.current.addItem(mockProduct2, {}, 3); // 350 * 3 = 1050
      });

      expect(result.current.subtotalPence).toBe(6050);
    });

    it("returns 0 for empty cart", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      expect(result.current.subtotalPence).toBe(0);
    });
  });

  describe("localStorage persistence", () => {
    it("saves cart to localStorage on change", () => {
      const { result } = renderHook(() => useCart(), { wrapper: CartProvider });

      act(() => {
        result.current.addItem(mockProduct, {}, 1);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "albakes_cart_v1",
        expect.any(String)
      );
    });
  });
});
