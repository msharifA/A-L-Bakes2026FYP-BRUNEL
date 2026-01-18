import jwt from "jsonwebtoken";

export function requireCustomer(req, res, next) {
  try {
    const token = req.cookies?.albakes_customer;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload?.role !== "customer") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.customer = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
