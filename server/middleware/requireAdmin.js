// src/server/middleware/requireAdmin.js
import jwt from "jsonwebtoken";

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
