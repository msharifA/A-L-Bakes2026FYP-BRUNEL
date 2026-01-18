export async function getProducts() {
    const res = await fetch("/api/products");
    if (!res.ok) throw new Error(`Failed to fetch products (${res.status})`);
    return res.json();
  }
  
  export async function getFeaturedProducts() {
    const res = await fetch("/api/products/featured");
    if (!res.ok) throw new Error("Failed to load featured products");
    return res.json();
  }
  