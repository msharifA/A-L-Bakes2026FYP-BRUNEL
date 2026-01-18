export async function adminLogout() {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // important
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Logout failed");
    return data;
  }

  export async function checkAuth() {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include"
      });
      if (!res.ok) return { authenticated: false };
      const data = await res.json();
      return { authenticated: true, user: data };
    } catch {
      return { authenticated: false };
    }
  }
  