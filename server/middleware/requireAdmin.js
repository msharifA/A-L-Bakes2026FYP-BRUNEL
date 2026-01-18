// src/server/middleware/requireAdmin.js
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.albakes_admin;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// New middleware that validates DB admin users (approved admins from users table)
export async function requireDbAdmin(req, res, next) {
  try {
    const token = req.cookies?.albakes_admin;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // For ENV-based admin (legacy), just proceed
    if (payload.isEnvAdmin) {
      req.user = payload;
      return next();
    }

    // For DB-based admin, verify they still exist and are approved
    if (payload.userId) {
      const result = await pool.query(
        `SELECT id, email, first_name, last_name, is_active, admin_approved
         FROM users WHERE id = $1 AND role = 'admin'`,
        [payload.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Admin account not found" });
      }

      const admin = result.rows[0];

      if (!admin.is_active) {
        return res.status(401).json({ error: "Admin account is deactivated" });
      }

      if (!admin.admin_approved) {
        return res.status(403).json({ error: "Admin account pending approval" });
      }

      req.user = {
        ...payload,
        firstName: admin.first_name,
        lastName: admin.last_name,
      };
      return next();
    }

    // Fallback for existing ENV-based admins without isEnvAdmin flag
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
