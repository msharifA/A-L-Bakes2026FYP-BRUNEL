import Stripe from "stripe";
import { pool } from "../db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe webhook handler
 *
 * Why:
 * - Webhook is the most reliable source of truth for payment confirmation.
 * - Redirects can be faked; webhooks are signed.
 *
 * IMPORTANT:
 * - This controller expects req.body to be RAW bytes (express.raw in the route).
 */
export async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Checkout completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Update any existing order created with this session id
    const updated = await pool.query(
      `UPDATE orders
       SET payment_status='paid',
           status='paid',
           stripe_payment_intent_id=$2,
           updated_at=NOW()
       WHERE stripe_session_id=$1
       RETURNING id`,
      [session.id, session.payment_intent]
    );

    if (updated.rows.length) {
      const orderId = updated.rows[0].id;
      await pool.query(
        `INSERT INTO order_events (order_id, type, message)
         VALUES ($1,'status_change','Payment confirmed via webhook')`,
        [orderId]
      );
    }
  }

  return res.json({ received: true });
}
