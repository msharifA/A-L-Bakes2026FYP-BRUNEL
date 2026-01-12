import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,                 // true in prod (HTTPS)
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8,     // 8 hours
  };
}

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const adminEmail = String(process.env.ADMIN_EMAIL || "").toLowerCase();
    if (String(email).toLowerCase() !== adminEmail) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const hash = String(process.env.ADMIN_PASSWORD_HASH || "");
    if (!hash) {
      return res.status(500).json({ error: "Admin password hash not configured" });
    }

    const ok = await bcrypt.compare(String(password), hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not configured" });
    }

    const token = jwt.sign(
      { role: "admin", email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.cookie("albakes_admin", token, cookieOptions());
    return res.json({ ok: true, role: "admin" });
  } catch (e) {
    console.error("adminLogin error:", e);
    return res.status(500).json({ error: "Login failed" });
  }
}

export function logout(req, res) {
  res.clearCookie("albakes_admin", { path: "/" });
  return res.json({ ok: true });
}

export function me(req, res) {
  try {
    const token = req.cookies?.albakes_admin;
    if (!token) return res.json({ authenticated: false });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ authenticated: true, user: payload });
  } catch {
    return res.json({ authenticated: false });
  }
}
