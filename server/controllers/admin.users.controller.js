import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db.js";
import { sendPasswordResetEmail } from "../services/email.service.js";

const BCRYPT_ROUNDS = 12;

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8, // 8 hours for admins
  };
}

// POST /api/auth/admin/register - Request admin access (requires approval)
export async function adminRegisterRequest(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body || {};

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

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

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Insert admin request (not approved yet)
    await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, admin_approved)
       VALUES (LOWER($1), $2, $3, $4, 'admin', TRUE, FALSE)`,
      [email, passwordHash, firstName.trim(), lastName.trim()]
    );

    return res.status(201).json({
      ok: true,
      message: "Registration request submitted. Awaiting admin approval.",
    });
  } catch (e) {
    console.error("adminRegisterRequest error:", e);
    return res.status(500).json({ error: "Registration request failed" });
  }
}

// POST /api/auth/admin/forgot-password
export async function adminForgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const genericResponse = { ok: true, message: "If the email exists, a reset link will be sent" };

    // Find admin user
    const result = await pool.query(
      `SELECT id, email, first_name FROM users
       WHERE LOWER(email) = LOWER($1) AND role = 'admin' AND is_active = TRUE AND admin_approved = TRUE`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json(genericResponse);
    }

    const user = result.rows[0];

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate existing tokens
    await pool.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
      [user.id]
    );

    // Insert new token
    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, token, expiresAt]
    );

    sendPasswordResetEmail(user.email, token, user.first_name).catch((e) =>
      console.error("Failed to send admin password reset email:", e)
    );

    return res.json(genericResponse);
  } catch (e) {
    console.error("adminForgotPassword error:", e);
    return res.status(500).json({ error: "Failed to process request" });
  }
}

// GET /api/admin/approval-requests - List pending admin requests
export async function getApprovalRequests(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, created_at
       FROM users
       WHERE role = 'admin' AND admin_approved = FALSE AND is_active = TRUE
       ORDER BY created_at DESC`
    );

    return res.json({ requests: result.rows });
  } catch (e) {
    console.error("getApprovalRequests error:", e);
    return res.status(500).json({ error: "Failed to fetch requests" });
  }
}

// POST /api/admin/approval-requests/:id/approve
export async function approveAdminRequest(req, res) {
  try {
    const { id } = req.params;
    const approverId = req.user?.userId;

    const result = await pool.query(
      `UPDATE users
       SET admin_approved = TRUE, approved_by = $2, updated_at = NOW()
       WHERE id = $1 AND role = 'admin' AND admin_approved = FALSE
       RETURNING id, email, first_name, last_name`,
      [id, approverId || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found or already processed" });
    }

    return res.json({ ok: true, admin: result.rows[0] });
  } catch (e) {
    console.error("approveAdminRequest error:", e);
    return res.status(500).json({ error: "Failed to approve request" });
  }
}

// POST /api/admin/approval-requests/:id/reject
export async function rejectAdminRequest(req, res) {
  try {
    const { id } = req.params;

    // Deactivate the account instead of deleting
    const result = await pool.query(
      `UPDATE users
       SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND role = 'admin' AND admin_approved = FALSE
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found or already processed" });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("rejectAdminRequest error:", e);
    return res.status(500).json({ error: "Failed to reject request" });
  }
}

// GET /api/admin/users - List all admin users
export async function getAdminUsers(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.is_active,
              u.admin_approved, u.created_at, u.approved_by,
              approver.first_name || ' ' || approver.last_name as approved_by_name
       FROM users u
       LEFT JOIN users approver ON approver.id = u.approved_by
       WHERE u.role = 'admin'
       ORDER BY u.created_at DESC`
    );

    return res.json({ admins: result.rows });
  } catch (e) {
    console.error("getAdminUsers error:", e);
    return res.status(500).json({ error: "Failed to fetch admin users" });
  }
}

// PATCH /api/admin/users/:id/toggle-active
export async function toggleAdminActive(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    // Prevent self-deactivation
    if (currentUserId && parseInt(id) === currentUserId) {
      return res.status(400).json({ error: "Cannot deactivate your own account" });
    }

    const result = await pool.query(
      `UPDATE users
       SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND role = 'admin'
       RETURNING id, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    return res.json({ ok: true, admin: result.rows[0] });
  } catch (e) {
    console.error("toggleAdminActive error:", e);
    return res.status(500).json({ error: "Failed to update admin" });
  }
}
