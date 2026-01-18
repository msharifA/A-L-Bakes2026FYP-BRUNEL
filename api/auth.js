
export async function authMe() {
  const res = await fetch("/api/auth/me", {
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to check auth");
  return data; // { authenticated: boolean, user?: {...} }
}

export async function adminLogout() {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Logout failed");
  return data;
}