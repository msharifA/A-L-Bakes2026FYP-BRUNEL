/**
 * =============================================================================
 * ORDERS CONTROLLER
 * =============================================================================
 *
 * PURPOSE:
 * Handles all order-related API endpoints for the A&L Bakes platform.
 * This is the core of the e-commerce functionality.
 *
 * ENDPOINTS:
 * - POST /api/orders/from-session → createOrderFromSession (create order after Stripe payment)
 * - GET  /api/orders/:id          → getOrderById (admin view full order details)
 * - GET  /api/orders/:id/track    → getOrderTracking (customer order tracking page)
 *
 * INTEGRATION WITH OTHER SERVICES:
 * - Stripe: Retrieves payment session details
 * - PostgreSQL: Stores order data in orders, order_items, order_events tables
 * - AWS SES: Sends confirmation emails (via email.service.js)
 *
 * DATABASE TABLES USED:
 * - orders: Main order record (customer info, totals, status)
 * - order_items: Individual products in each order
 * - order_events: Audit trail / status history for tracking
 *
 * =============================================================================
 */

import Stripe from "stripe";
import { pool } from "../db.js";
import {
  sendOrderConfirmationEmail,
  sendAdminNewOrderNotification,
  sendInvoiceEmail,
} from "../services/email.service.js";

// Initialize Stripe SDK with secret key (server-side only, never expose to frontend)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * =============================================================================
 * CREATE ORDER FROM STRIPE SESSION
 * =============================================================================
 *
 * ENDPOINT: POST /api/orders/from-session
 *
 * WHEN IS THIS CALLED?
 * After successful Stripe Checkout, user is redirected to /order-success page.
 * Frontend calls this endpoint with the Stripe session ID from URL params.
 *
 * FLOW:
 * 1. Validate sessionId is provided
 * 2. Check if order already exists (idempotency - prevents duplicates)
 * 3. Retrieve session from Stripe API
 * 4. Verify payment was successful
 * 5. Extract customer details and totals from session
 * 6. Create order in database (transaction for data integrity)
 * 7. Send confirmation emails asynchronously
 *
 * WHY IDEMPOTENCY?
 * Users might refresh the success page, or there might be network retries.
 * The ON CONFLICT clause ensures we don't create duplicate orders.
 */
export async function createOrderFromSession(req, res) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });

    /**
     * STEP 1: IDEMPOTENCY CHECK
     * Check if we've already created an order for this Stripe session.
     * This prevents duplicate orders if the user refreshes the page.
    //  */
    const existing = await pool.query(
      "SELECT id FROM orders WHERE stripe_session_id = $1 LIMIT 1",
      [sessionId]
    );
    if (existing.rows.length) {
      // Order already exists - return it instead of creating duplicate
      return res.json({ orderId: existing.rows[0].id, alreadyExisted: true });
    }

    /**
     * STEP 2: RETRIEVE STRIPE SESSION
     * Fetch the complete session data from Stripe's API.
     * This contains customer info, payment status, and order metadata.
     */
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    /**
     * STEP 3: VERIFY PAYMENT SUCCESS
     * Only create order if Stripe confirms payment is complete.
     * Prevents orders from unpaid/failed checkout sessions.
     */
    if (session.payment_status !== "paid") {
      return res.status(400).json({
        error: "Payment not confirmed",
        payment_status: session.payment_status,
      });
    }

    /**
     STEP 4: EXTRACT CUSTOMER and ORDER DETAILS
     Pull data from Stripe session to store in our database.
     We use optional chaining (?.) because some fields might be null.
     */
    const customer_email =
      session.customer_details?.email || session.customer_email || null;

    const customer_name =
      session.customer_details?.name || session.metadata?.customer_name || null;

    if (!customer_email) {
      return res.status(400).json({ error: "No customer email on Stripe session" });
    }

    // Financial details (all in pence to avoid floating point errors)
    const currency = session.currency || "gbp";
    const subtotal_pence = session.amount_subtotal ?? 0;
    const total_pence = session.amount_total ?? 0;
    const delivery_pence = total_pence - subtotal_pence; // Delivery fee is the difference

    // Order metadata (set during checkout session creation)
    const delivery_method = session.metadata?.delivery_method || "pickup";
    const delivery_date = session.metadata?.delivery_date || null;

    // Delivery address (optional - for delivery orders)
    const delivery_address_line1 = session.metadata?.delivery_address_line1 || null;
    const delivery_address_line2 = session.metadata?.delivery_address_line2 || null;
    const delivery_city = session.metadata?.delivery_city || null;
    const delivery_postcode = session.metadata?.delivery_postcode || null;
    const delivery_notes = session.metadata?.delivery_notes || null;

    /**
     * STEP 5: GET LINE ITEMS FROM STRIPE
     * Retrieve what products the customer ordered.
     * These are stored separately for order history and admin dashboard.
     */
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });

    /**
     * STEP 6: DATABASE TRANSACTION
     * Use a transaction to ensure all-or-nothing writes.
     * If any query fails, everything is rolled back (no partial orders).
     */
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const orderRes = await client.query(
        `INSERT INTO orders
          (customer_email, customer_name, status, payment_status,
           currency, subtotal_pence, delivery_pence, total_pence,
           stripe_session_id, stripe_payment_intent_id,
           delivery_method, delivery_date,
           delivery_address_line1, delivery_address_line2, delivery_city,
           delivery_postcode, delivery_notes)
         VALUES ($1,$2,'paid','paid',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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
          delivery_address_line1,
          delivery_address_line2,
          delivery_city,
          delivery_postcode,
          delivery_notes,
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

      /**
       * STEP 7: SEND CONFIRMATION EMAILS (ASYNC)
       *
       * We send emails AFTER the database commit is successful.
       * Emails are sent asynchronously (fire-and-forget) because:
       * - We don't want slow email delivery to block the response
       * - Order is already saved, so email failure doesn't affect order
       * - Errors are logged for debugging but don't crash the request
       *
       * Two emails are sent:
       * 1. Customer confirmation - receipt with order details
       * 2. Admin notification - alerts bakery owner of new order
       */
      const orderForEmail = {
        id: orderId,
        customer_email,
        customer_name,
        items: lineItems.data.map((li) => ({
          name: li.description || "Item",
          quantity: li.quantity ?? 1,
          price_pence: li.price?.unit_amount ?? 0,
          line_total_pence: (li.price?.unit_amount ?? 0) * (li.quantity ?? 1),
        })),
        subtotal_pence,
        delivery_pence: Math.max(0, delivery_pence),
        total_pence,
        delivery_method,
        delivery_date,
        delivery_address_line1,
        delivery_address_line2,
        delivery_city,
        delivery_postcode,
        delivery_notes,
      };

      // Customer confirmation email - sent via AWS SES
      sendOrderConfirmationEmail(customer_email, orderForEmail).catch((e) =>
        console.error("Failed to send order confirmation email:", e)
      );

      // Admin notification - alerts bakery owner immediately
      sendAdminNewOrderNotification(orderForEmail).catch((e) =>
        console.error("Failed to send admin notification email:", e)
      );

      // Invoice email - detailed invoice with itemized breakdown
      sendInvoiceEmail(orderForEmail, orderForEmail.items).catch((e) =>
        console.error("Failed to send invoice email:", e)
      );

      // Return success - frontend shows order confirmation page
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
 * =============================================================================
 * GET ORDER BY ID (ADMIN VIEW)
 * =============================================================================
 *
 * ENDPOINT: GET /api/orders/:id
 *
 * PURPOSE:
 * Returns complete order details for admin dashboard.
 * Includes all order data, items, and status history.
 *
 * USED BY:
 * - Admin dashboard order management page
 * - Order detail modal/view
 *
 * RETURNS:
 * - order: Main order record (customer info, totals, status, timestamps)
 * - items: Array of products ordered (name, quantity, price)
 * - events: Status history (created, paid, preparing, ready, collected)
 */
export async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    // Fetch main order record
    const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (!orderRes.rows.length) return res.status(404).json({ error: "Order not found" });

    // Fetch all items in this order
    const itemsRes = await pool.query("SELECT * FROM order_items WHERE order_id = $1", [id]);

    // Fetch order history/events (sorted chronologically for timeline display)
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
 * =============================================================================
 * GET ORDER TRACKING (CUSTOMER VIEW)
 * =============================================================================
 *
 * ENDPOINT: GET /api/orders/:id/track
 *
 * PURPOSE:
 * Returns limited order info for customer tracking page.
 * Unlike getOrderById, this exposes only what customers should see.
 *
 * USED BY:
 * - /track/:orderId page (linked from confirmation email)
 * - Customer checking their order status
 *
 * SECURITY:
 * - Only returns status info, not sensitive customer data
 * - Order ID acts as a "secret" link (UUIDs are unguessable)
 * - No authentication required (convenience for customers)
 *
 * RETURNS:
 * - order: Basic status info (id, status, timestamps)
 * - events: Status history for timeline display
 */
export async function getOrderTracking(req, res) {
  try {
    const { id } = req.params;

    // Only select non-sensitive fields for customer view
    const orderRes = await pool.query(
      "SELECT id, status, payment_status, created_at, updated_at FROM orders WHERE id = $1",
      [id]
    );
    if (!orderRes.rows.length) return res.status(404).json({ error: "Order not found" });

    // Get status timeline for tracking display
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