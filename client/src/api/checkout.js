// client/src/api/checkout.js

const API = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function createCheckoutSession(payload) {
  const r = await fetch(`${API}/checkout/create-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) throw new Error(data.error || "Failed to create checkout session");
  return data; // expected: { url }
}