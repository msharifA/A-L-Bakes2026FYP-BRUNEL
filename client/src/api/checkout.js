// client/src/api/checkout.js

const API = import.meta.env.VITE_API_URL || "";

export async function createCheckoutSession(payload) {
  const r = await fetch(`${API}/api/checkout/create-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) throw new Error(data.error || "Failed to create checkout session");
  return data; // expected: { url }
}