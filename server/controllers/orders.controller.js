import Stripe from "stripe";
import { pool } from "../db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/orders/from-session
 */
export async function createOrderFromSession(req, res) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    // 1) Idempotency check
    const existing = await pool.query(
      "SELECT id FROM orders WHERE stripe_session_id = $1 LIMIT 1",
      [sessionId]
    );
    if (existing.rows.length) {
      return res.json({ orderId: existing.rows[0].id, alreadyExisted: true });
    }

    // 2) Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 3) Ensure payment is confirmed
    if (session.payment_status !== "paid") {
      return res.status(400).json({
        error: "Payment not confirmed",
        payment_status: session.payment_status,
      });
    }

    // 4) Pull customer + totals
    const customer_email =
      session.customer_details?.email || session.customer_email || null;

    const customer_name =
      session.customer_details?.name || session.metadata?.customer_name || null;

    if (!customer_email) {
      return res.status(400).json({ error: "No customer email on Stripe session" });
    }

    const currency = session.currency || "gbp";
    const subtotal_pence = session.amount_subtotal ?? 0;
    const total_pence = session.amount_total ?? 0;
    const delivery_pence = total_pence - subtotal_pence;

    const delivery_method = session.metadata?.delivery_method || "pickup";
    const delivery_date = session.metadata?.delivery_date || null;

    // 5) Get line items snapshot
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });

    // 6) Write to DB transactionally
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const orderRes = await client.query(
        `INSERT INTO orders
          (customer_email, customer_name, status, payment_status,
           currency, subtotal_pence, delivery_pence, total_pence,
           stripe_session_id, stripe_payment_intent_id,
           delivery_method, delivery_date)
         VALUES ($1,$2,'paid','paid',$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (stripe_session_id)
         DO UPDATE SET
           stripe_payment_intent_id = COALESCE(orders.stripe_payment_intent_id, EXCLUDED.stripe_payment_intent_id),
           payment_status = 'paid',
           status = CASE WHEN orders.status = 'pending' THEN 'paid' ELSE orders.status END,
           updated_at = NOW()
         RETURNING id`,
        [
          customer_email,
          customer_name,
          currency,
          subtotal_pence,
          Math.max(0, delivery_pence),
          total_pence,
          session.id,
          session.payment_intent,
          delivery_method,
          delivery_date,
        ]
      );

      const orderId = orderRes.rows[0].id;

      // prevent duplicate items/events if /from-session is called multiple times
      await client.query("DELETE FROM order_items WHERE order_id = $1", [orderId]);
      await client.query(
        "DELETE FROM order_events WHERE order_id = $1 AND message = 'Payment confirmed'",
        [orderId]
      );

      for (const li of lineItems.data) {
        const qty = li.quantity ?? 1;
        const unit_price_pence = li.price?.unit_amount ?? 0;
        const name = li.description || "Item";
        const line_total_pence = unit_price_pence * qty;

        await client.query(
          `INSERT INTO order_items
            (order_id, product_id, name, unit_price_pence, quantity, line_total_pence)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [orderId, null, name, unit_price_pence, qty, line_total_pence]
        );
      }

      await client.query(
        `INSERT INTO order_events (order_id, type, message)
         VALUES ($1,'status_change','Payment confirmed')`,
        [orderId]
      );


      await client.query("COMMIT");
      return res.status(201).json({ orderId });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("DB order create error:", e);
      return res.status(500).json({ error: "Failed to create order" });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("createOrderFromSession error:", e);
    return res.status(500).json({ error: e.message || "Failed" });
  }
}

/**
 * GET /api/orders/:id
 */
export async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (!orderRes.rows.length) return res.status(404).json({ error: "Order not found" });

    const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [id]);
    const eventsRes = await pool.query(
      "SELECT * FROM order_events WHERE order_id = $1 ORDER BY created_at ASC",
      [id]
    );

    return res.json({
      order: orderRes.rows[0],
      items: itemsRes.rows,
      events: eventsRes.rows,
    });
  } catch (e) {
    console.error("getOrderById error:", e);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
}

/**
 * GET /api/orders/:id/track
 */
export async function getOrderTracking(req, res) {
  try {
    const { id } = req.params;

    const orderRes = await pool.query(
      "SELECT id, status, payment_status, created_at, updated_at FROM orders WHERE id = $1",
      [id]
    );
    if (!orderRes.rows.length) return res.status(404).json({ error: "Order not found" });

    const eventsRes = await pool.query(
      "SELECT type, message, created_at FROM order_events WHERE order_id = $1 ORDER BY created_at ASC",
      [id]
    );

    return res.json({ order: orderRes.rows[0], events: eventsRes.rows });
  } catch (e) {
    console.error("getOrderTracking error:", e);
    return res.status(500).json({ error: "Failed to fetch tracking" });
  }
}