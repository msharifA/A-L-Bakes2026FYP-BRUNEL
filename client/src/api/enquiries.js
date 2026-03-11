const API = import.meta.env.VITE_API_URL || "";

export async function getCakeConfig() {
  const r = await fetch(`${API}/api/enquiries/config`);
  if (!r.ok) throw new Error("Failed to load cake options");
  return r.json();
}

export async function submitEnquiry(data) {
  const r = await fetch(`${API}/api/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.error || "Failed to submit enquiry");
  return json;
}

export async function createDepositSession(enquiryId) {
  const r = await fetch(`${API}/api/enquiries/${enquiryId}/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.error || "Failed to create deposit session");
  return json;
}

export async function confirmDeposit(enquiryId, sessionId) {
  const r = await fetch(`${API}/api/enquiries/${enquiryId}/confirm-deposit`, {
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

  const r = await fetch(`${API}/api/enquiries/upload-images`, {
    method: "POST",
    body: formData,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json.error || "Failed to upload images");
  return json;
}

export async function getEnquiry(enquiryId) {
  const r = await fetch(`${API}/api/enquiries/${enquiryId}`);
  if (!r.ok) throw new Error("Enquiry not found");
  return r.json();
}
