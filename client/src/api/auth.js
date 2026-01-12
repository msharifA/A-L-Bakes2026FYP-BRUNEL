export async function adminLogout() {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // important
    });
  
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Logout failed");
    return data;
  }
  