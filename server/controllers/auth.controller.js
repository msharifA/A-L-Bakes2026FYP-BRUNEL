/**
 * =============================================================================
 * ADMIN AUTHENTICATION CONTROLLER
 * =============================================================================
 *
 * PURPOSE:
 * Handles admin login/logout for the A&L Bakes platform.
 * SEPARATE from customer auth for security isolation.
 *
 * WHY SEPARATE ADMIN AUTH?
 * - Different cookie names (albakes_admin vs albakes_customer)
 * - Different session lengths (8 hours vs 7 days)
 * - Admin can be ENV-based (no database) for simplicity
 * - Different security requirements
 *
 * ENDPOINTS:
 * - POST /api/auth/login  → adminLogin (admin login)
 * - POST /api/auth/logout → logout (clear admin cookie)
 * - GET  /api/auth/me     → me (check if admin is authenticated)
 *
 * ENV-BASED ADMIN:
 * For simplicity, the main admin is configured via environment variables:
 * - ADMIN_EMAIL: Admin email address
 * - ADMIN_PASSWORD_HASH: bcrypt hash of admin password
 *
 * This avoids needing a database for admin users during initial setup.
 * Additional admins can be added via the admin registration flow.
 *
 * =============================================================================
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * ADMIN JWT COOKIE CONFIGURATION
 *
 * Shorter session than customers (8h vs 7d) for security.
 * Admin sessions should expire during non-working hours.
 *
 * WHY httpOnly + secure + sameSite?
 * See customer.auth.controller.js for detailed explanation.
 */
function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,                    // Not accessible to JavaScript (XSS protection)
    secure: isProd,                    // HTTPS only in production
    sameSite: isProd ? "none" : "lax", // CSRF protection
    path: "/",
    maxAge: 1000 * 60 * 60 * 8,        // 8 hours (shorter than customer)
  };
}

/**
 * =============================================================================
 * ADMIN LOGIN
 * =============================================================================
 *
 * ENDPOINT: POST /api/auth/login
 *
 * FLOW:
 * 1. Validate email and password provided
 * 2. Check email matches ADMIN_EMAIL env var
 * 3. Compare password against ADMIN_PASSWORD_HASH
 * 4. Generate JWT with role: "admin"
 * 5. Set httpOnly cookie
 *
 * SECURITY:
 * - Password never logged or stored in plain text
 * - Generic "Invalid credentials" message (no info leak)
 * - Rate limiting should be added at infrastructure level
 */
export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Check email matches configured admin email (case-insensitive)
    const adminEmail = String(process.env.ADMIN_EMAIL || "").toLowerCase();
    if (String(email).toLowerCase() !== adminEmail) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Password hash from environment (set during deployment)
    const hash = String(process.env.ADMIN_PASSWORD_HASH || "");
    if (!hash) {
      return res.status(500).json({ error: "Admin password hash not configured" });
    }

    // Compare provided password against stored hash
    const ok = await bcrypt.compare(String(password), hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not configured" });
    }

    /**
     * GENERATE ADMIN JWT
     *
     * Payload includes:
     * - role: "admin" (checked by requireAdmin middleware)
     * - email: for logging/auditing
     */
    const token = jwt.sign(
      { role: "admin", email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Set cookie and respond
    res.cookie("albakes_admin", token, cookieOptions());
    return res.json({ ok: true, role: "admin" });
  } catch (e) {
    console.error("adminLogin error:", e);
    return res.status(500).json({ error: "Login failed" });
  }
}

/**
 * ADMIN LOGOUT
 *
 * Simply clears the admin cookie.
 * No need to invalidate JWT server-side (stateless auth).
 */
export function logout(req, res) {
  res.clearCookie("albakes_admin", { path: "/" });
  return res.json({ ok: true });
}

/**
 * CHECK ADMIN AUTH STATUS
 *
 * ENDPOINT: GET /api/auth/me
 *
 * Called by frontend on page load to check if admin is logged in.
 * Returns user info if authenticated, or { authenticated: false }.
 */
export function me(req, res) {
  try {
    const token = req.cookies?.albakes_admin;
    if (!token) return res.json({ authenticated: false });

    // Verify token - throws if invalid/expired
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ authenticated: true, user: payload });
  } catch {
    return res.json({ authenticated: false });
  }
}
