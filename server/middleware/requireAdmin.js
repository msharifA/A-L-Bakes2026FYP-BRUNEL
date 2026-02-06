/**
 * =============================================================================
 * ADMIN ROLE SEPARATION MIDDLEWARE
 * =============================================================================
 *
 * PURPOSE:
 * Protects admin-only API routes by verifying the user has admin role.
 * This is a critical security layer - without it, anyone could access
 * admin endpoints.
 *
 * WHY SEPARATE MIDDLEWARE?
 * - Single Responsibility: One file handles admin authorization
 * - Reusable: Used on all /api/admin/* routes
 * - Maintainable: Change auth logic in one place
 *
 * HOW IT'S USED (in server/index.js):
 * api.use("/admin", requireAdmin, adminOrdersRoutes);
 * api.use("/admin", requireAdmin, adminReviewsRoutes);
 * api.use("/admin", requireAdmin, adminProductsRoutes);
 *
 * ROLE SEPARATION ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────┐
 * │                     A&L BAKES API                       │
 * ├─────────────────────────────────────────────────────────┤
 * │  PUBLIC ROUTES (no auth)                                │
 * │  - GET /api/products                                    │
 * │  - GET /api/reviews/:productId                          │
 * │  - POST /api/checkout                                   │
 * ├─────────────────────────────────────────────────────────┤
 * │  CUSTOMER ROUTES (requireCustomer middleware)           │
 * │  - POST /api/reviews (leave review)                     │
 * │  - GET /api/auth/customer/me                            │
 * ├─────────────────────────────────────────────────────────┤
 * │  ADMIN ROUTES (requireAdmin middleware) ← THIS FILE     │
 * │  - GET /api/admin/orders                                │
 * │  - PUT /api/admin/products/:id                          │
 * │  - DELETE /api/admin/reviews/:id                        │
 * │  - GET /api/admin/sales/daily                           │
 * └─────────────────────────────────────────────────────────┘
 *
 * AUTHENTICATION FLOW:
 * 1. Admin logs in → JWT token stored in httpOnly cookie
 * 2. Request hits admin route → this middleware runs first
 * 3. Middleware extracts token from cookie
 * 4. JWT.verify() checks signature + expiry
 * 5. Payload.role must equal "admin"
 * 6. If valid → next() (continue to route handler)
 * 7. If invalid → 401/403 error response
 *
 * =============================================================================
 */

import jwt from "jsonwebtoken";
import { pool } from "../db.js";

/**
 * =============================================================================
 * requireAdmin - Basic Admin Authorization
 * =============================================================================
 *
 * Simple middleware that checks for valid admin JWT.
 * Used for most admin routes.
 *
 * SECURITY CHECKS:
 * 1. Cookie exists (albakes_admin)
 * 2. JWT signature is valid (not tampered)
 * 3. JWT is not expired
 * 4. Role in payload is "admin"
 */
export function requireAdmin(req, res, next) {
  try {
    // Extract JWT from httpOnly cookie (not accessible to JavaScript)
    const token = req.cookies?.albakes_admin;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    // Verify JWT signature and expiry
    // Throws error if invalid or expired
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Check role claim in JWT
    // Prevents customers from accessing admin routes
    if (payload?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Attach user info to request for use in route handlers
    req.user = payload;
    next();
  } catch {
    // JWT verification failed (tampered, expired, malformed)
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * =============================================================================
 * requireDbAdmin - Enhanced Admin Authorization with DB Validation
 * =============================================================================
 *
 * More thorough middleware that also checks the database.
 * Use for sensitive operations where we need to verify:
 * - Admin account still exists
 * - Admin account is still active
 * - Admin account is approved
 *
 * SUPPORTS TWO ADMIN TYPES:
 * 1. ENV-based admin (legacy) - single admin via environment variables
 * 2. DB-based admin (new) - multiple admins stored in users table
 */
export async function requireDbAdmin(req, res, next) {
  try {
    const token = req.cookies?.albakes_admin;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    /**
     * ENV-BASED ADMIN (LEGACY)
     * For admins authenticated via ADMIN_EMAIL/ADMIN_PASSWORD_HASH
     * environment variables. No DB lookup needed.
     */
    if (payload.isEnvAdmin) {
      req.user = payload;
      return next();
    }

    /**
     * DB-BASED ADMIN
     * For admins registered through admin registration flow.
     * Must verify account status in database.
     */
    if (payload.userId) {
      const result = await pool.query(
        `SELECT id, email, first_name, last_name, is_active, admin_approved
         FROM users WHERE id = $1 AND role = 'admin'`,
        [payload.userId]
      );

      // Admin deleted from database
      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Admin account not found" });
      }

      const admin = result.rows[0];

      // Admin was deactivated by another admin
      if (!admin.is_active) {
        return res.status(401).json({ error: "Admin account is deactivated" });
      }

      // Admin registered but not yet approved
      if (!admin.admin_approved) {
        return res.status(403).json({ error: "Admin account pending approval" });
      }

      // All checks passed - attach user info
      req.user = {
        ...payload,
        firstName: admin.first_name,
        lastName: admin.last_name,
      };
      return next();
    }

    // Fallback for older tokens (before isEnvAdmin flag was added)
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
