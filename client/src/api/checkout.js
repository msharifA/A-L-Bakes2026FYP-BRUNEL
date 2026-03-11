// client/src/api/checkout.js

const BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function createCheckoutSession(payload) {
  const r = await fetch(`${BASE}/api/checkout/create-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) throw new Error(data.error || "Failed to create checkout session");
  return data; // expected: { url }
}