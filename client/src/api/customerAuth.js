const BASE = "/api/auth/customer";

export async function customerRegister({ email, password, firstName, lastName }) {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, firstName, lastName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data;
}

export async function customerLogin(email, password) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function customerLogout() {
  const res = await fetch(`${BASE}/logout`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Logout failed");
  return data;
}

export async function checkCustomerAuth() {
  const res = await fetch(`${BASE}/me`, {
    credentials: "include",
  });
  const data = await res.json();
  return data;
}

export async function requestPasswordReset(email) {
  const res = await fetch(`${BASE}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${BASE}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Reset failed");
  return data;
}
