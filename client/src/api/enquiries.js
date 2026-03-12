const BASE = import.meta.env.VITE_API_BASE_URL || "";

export async function getCakeConfig() {
  const r = await fetch(`${BASE}/api/enquiries/config`);
  if (!r.ok) throw new Error("Failed to load cake options");
  return r.json();
}

export async function submitEnquiry(data) {
  const r = await fetch(`${BASE}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.error || "Failed to submit enquiry");
  return json;
}

export async function createDepositSession(enquiryId) {
  const r = await fetch(`${BASE}/api/enquiries/${enquiryId}/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.error || "Failed to create deposit session");
  return json;
}

export async function confirmDeposit(enquiryId, sessionId) {
  const r = await fetch(`${BASE}/api/enquiries/${enquiryId}/confirm-deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.error || "Failed to confirm deposit");
  return json;
}

export async function uploadReferenceImages(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const r = await fetch(`${BASE}/api/enquiries/upload-images`, {
    method: "POST",
    body: formData,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.error || "Failed to upload images");
  return json;
}

export async function getEnquiry(enquiryId) {
  const r = await fetch(`${BASE}/api/enquiries/${enquiryId}`);
  if (!r.ok) throw new Error("Enquiry not found");
  return r.json();
}

/**
 * =============================================================================
 * CONFIRM FINAL PAYMENT
 * =============================================================================
 *
 * CALLED BY: CustomCakeFinalPaymentSuccess.jsx
 * WHEN: After customer completes final payment on Stripe
 * PURPOSE: Verify payment with backend and mark enquiry as completed
 *
 * FLOW:
 * 1. Customer pays on Stripe checkout page
 * 2. Stripe redirects to success page with session_id
 * 3. Success page calls this function
 * 4. Backend verifies payment with Stripe
 * 5. Backend updates enquiry to 'completed'
 * 6. Backend sends confirmation email
 *
 * @param {string} enquiryId - The enquiry UUID
 * @param {string} sessionId - Stripe checkout session ID
 * @returns {Promise<{enquiry: object}>} Updated enquiry object
 */
export async function confirmFinalPayment(enquiryId, sessionId) {
  const r = await fetch(`${BASE}/api/enquiries/${enquiryId}/confirm-final-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.error || "Failed to confirm final payment");
  return json;
}
