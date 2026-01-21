import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db.js";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../services/email.service.js";

const BCRYPT_ROUNDS = 12;

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days for customers
  };
}

// POST /api/auth/customer/register
export async function customerRegister(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body || {};

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Check if email already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
       VALUES (LOWER($1), $2, $3, $4, 'customer', TRUE)
       RETURNING id, email, first_name, last_name, role`,
      [email, passwordHash, firstName.trim(), lastName.trim()]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { role: "customer", userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("albakes_customer", token, cookieOptions());

    // Send welcome email (don't block response)
    sendWelcomeEmail(user.email, user.first_name).catch((e) =>
      console.error("Failed to send welcome email:", e)
    );

    return res.status(201).json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (e) {
    console.error("customerRegister error:", e);
    return res.status(500).json({ error: "Registration failed" });
  }
}

// POST /api/auth/customer/login
export async function customerLogin(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user
    const result = await pool.query(
      `SELECT id, email, password_hash, first_name, last_name, role, is_active
       FROM users WHERE LOWER(email) = LOWER($1) AND role = 'customer'`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Verify password
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { role: "customer", userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("albakes_customer", token, cookieOptions());
    return res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (e) {
    console.error("customerLogin error:", e);
    return res.status(500).json({ error: "Login failed" });
  }
}

// POST /api/auth/customer/logout
export function customerLogout(req, res) {
  res.clearCookie("albakes_customer", { path: "/" });
  return res.json({ ok: true });
}

// GET /api/auth/customer/me
export async function customerMe(req, res) {
  try {
    const token = req.cookies?.albakes_customer;
    if (!token) return res.json({ authenticated: false });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "customer") {
      return res.json({ authenticated: false });
    }

    // Get fresh user data
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, is_active
       FROM users WHERE id = $1 AND role = 'customer'`,
      [payload.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      res.clearCookie("albakes_customer", { path: "/" });
      return res.json({ authenticated: false });
    }

    const user = result.rows[0];
    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch {
    return res.json({ authenticated: false });
  }
}

// POST /api/auth/customer/forgot-password
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Always return success to prevent email enumeration
    const genericResponse = { ok: true, message: "If the email exists, a reset link will be sent" };

    // Find user
    const result = await pool.query(
      "SELECT id, email FROM users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE",
      [email]
    );

    if (result.rows.length === 0) {
      return res.json(genericResponse);
    }

    const user = result.rows[0];

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate existing tokens for this user
    await pool.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
      [user.id]
    );

    // Insert new token
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, token, expiresAt]
    );

    // Get user's first name for email
    const userDetails = await pool.query(
      "SELECT first_name FROM users WHERE id = $1",
      [user.id]
    );
    const firstName = userDetails.rows[0]?.first_name || "Customer";

    // Send password reset email
    sendPasswordResetEmail(user.email, token, firstName).catch((e) =>
      console.error("Failed to send password reset email:", e)
    );

    return res.json(genericResponse);
  } catch (e) {
    console.error("forgotPassword error:", e);
    return res.status(500).json({ error: "Failed to process request" });
  }
}

// POST /api/auth/customer/reset-password
export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Find valid token and get current password hash
    const result = await pool.query(
      `SELECT prt.id, prt.user_id, u.email, u.password_hash
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1
         AND prt.used_at IS NULL
         AND prt.expires_at > NOW()
         AND u.is_active = TRUE`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const { id: tokenId, user_id: userId, password_hash: currentHash } = result.rows[0];

    // Check if new password is the same as the current password
    const isSamePassword = await bcrypt.compare(newPassword, currentHash);
    if (isSamePassword) {
      return res.status(400).json({ error: "New password must be different from your current password" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update password and mark token as used
    await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [
      passwordHash,
      userId,
    ]);
    await pool.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1", [tokenId]);

    return res.json({ ok: true, message: "Password reset successfully" });
  } catch (e) {
    console.error("resetPassword error:", e);
    return res.status(500).json({ error: "Failed to reset password" });
  }
}
