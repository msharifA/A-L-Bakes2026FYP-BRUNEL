import { pool } from "../db.js";

const ALLOWED_STATUSES = new Set([
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export async function adminListOrders(req, res) {
  try {
    const status = (req.query.status || "").toString().trim();
    const q = (req.query.q || "").toString().trim().toLowerCase();

    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const offset = Math.max(0, Number(req.query.offset || 0));

    const where = [];
    const params = [];
    let i = 1;

    if (status) {
      where.push(`status = $${i++}`);
      params.push(status);
    }
    if (q) {
      where.push(`LOWER(customer_email) LIKE $${i++}`);
      params.push(`%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const ordersRes = await pool.query(
      `SELECT id, customer_email, customer_name, status, payment_status,
              total_pence, currency, delivery_method, delivery_date, created_at
       FROM orders
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${i++} OFFSET $${i++}`,
      [...params, limit, offset]
    );

    return res.json({ orders: ordersRes.rows, limit, offset });
  } catch (e) {
    console.error("adminListOrders error:", e);
    return res.status(500).json({ error: "Failed to list orders" });
  }
}

export async function adminGetOrder(req, res) {
  try {
    const { id } = req.params;

    const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (!orderRes.rows.length) return res.status(404).json({ error: "Order not found" });

    const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [id]);
    const eventsRes = await pool.query(
      "SELECT * FROM order_events WHERE order_id = $1 ORDER BY created_at ASC",
      [id]
    );

    return res.json({ order: orderRes.rows[0], items: itemsRes.rows, events: eventsRes.rows });
  } catch (e) {
    console.error("adminGetOrder error:", e);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
}

export async function adminUpdateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const status = (req.body.status || "").toString().trim();
    const message = (req.body.message || "").toString().trim();

    if (!ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    // Basic guard: don’t let admin mark unpaid orders as shipped/delivered etc.
    // (You can loosen/tighten this later.)
    const currentRes = await pool.query("SELECT id, payment_status, status FROM orders WHERE id=$1", [id]);
    if (!currentRes.rows.length) return res.status(404).json({ error: "Order not found" });

    const current = currentRes.rows[0];
    if (current.payment_status !== "paid" && ["processing", "shipped", "delivered"].includes(status)) {
      return res.status(400).json({ error: "Cannot progress an unpaid order" });
    }

    const updatedRes = await pool.query(
      `UPDATE orders
       SET status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status]
    );

    const note = message || `Status updated to ${status}`;
    await pool.query(
      `INSERT INTO order_events (order_id, type, message)
       VALUES ($1,'status_change',$2)`,
      [id, note]
    );

    return res.json({ order: updatedRes.rows[0] });
  } catch (e) {
    console.error("adminUpdateOrderStatus error:", e);
    return res.status(500).json({ error: "Failed to update order status" });
  }
}
