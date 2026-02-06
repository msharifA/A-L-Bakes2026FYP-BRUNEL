/**
 * =============================================================================
 * CUSTOMER PROFILE CONTROLLER
 * =============================================================================
 *
 * PURPOSE:
 * Handles customer profile data, order history, and review history.
 * All endpoints require customer authentication via requireCustomer middleware.
 *
 * ENDPOINTS:
 * - GET /api/customer/profile       → getProfile (account info)
 * - PUT /api/customer/profile       → updateProfile (update name)
 * - GET /api/customer/orders        → getOrderHistory (past orders)
 * - GET /api/customer/reviews       → getReviewHistory (reviews by customer)
 *
 * =============================================================================
 */

import { pool } from "../db.js";

/**
 * GET CUSTOMER PROFILE
 *
 * Returns the customer's account information.
 * Uses req.customer.userId set by requireCustomer middleware.
 */
export async function getProfile(req, res) {
  try {
    const { userId } = req.customer;

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, created_at
       FROM users
       WHERE id = $1 AND role = 'customer' AND is_active = TRUE`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const user = result.rows[0];
    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
    });
  } catch (e) {
    console.error("getProfile error:", e);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
}

/**
 * UPDATE CUSTOMER PROFILE
 *
 * Allows customer to update their first name and last name.
 * Email changes are not allowed (would require re-verification).
 */
export async function updateProfile(req, res) {
  try {
    const { userId } = req.customer;
    const { firstName, lastName } = req.body || {};

    if (!firstName || !lastName) {
      return res.status(400).json({ error: "First name and last name are required" });
    }

    const result = await pool.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, updated_at = NOW()
       WHERE id = $3 AND role = 'customer' AND is_active = TRUE
       RETURNING id, email, first_name, last_name`,
      [firstName.trim(), lastName.trim(), userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const user = result.rows[0];
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
    console.error("updateProfile error:", e);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}

/**
 * GET ORDER HISTORY
 *
 * Returns all orders placed by the customer, sorted by most recent first.
 * Orders are linked by email (not user_id) since orders were placed before accounts.
 */
export async function getOrderHistory(req, res) {
  try {
    const { email } = req.customer;

    // Get all orders for this customer
    const ordersResult = await pool.query(
      `SELECT
         id, status, payment_status, total_pence, delivery_method,
         delivery_date, created_at
       FROM orders
       WHERE LOWER(customer_email) = LOWER($1)
       ORDER BY created_at DESC`,
      [email]
    );

    // For each order, get its items
    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          `SELECT name, quantity, unit_price_pence, line_total_pence
           FROM order_items
           WHERE order_id = $1`,
          [order.id]
        );

        return {
          id: order.id,
          status: order.status,
          paymentStatus: order.payment_status,
          totalPence: order.total_pence,
          deliveryMethod: order.delivery_method,
          deliveryDate: order.delivery_date,
          createdAt: order.created_at,
          items: itemsResult.rows.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPricePence: item.unit_price_pence,
            lineTotalPence: item.line_total_pence,
          })),
        };
      })
    );

    return res.json({ orders });
  } catch (e) {
    console.error("getOrderHistory error:", e);
    return res.status(500).json({ error: "Failed to fetch order history" });
  }
}

/**
 * GET REVIEW HISTORY
 *
 * Returns all reviews submitted by the customer.
 * Includes product name and review status (pending/approved/rejected).
 */
export async function getReviewHistory(req, res) {
  try {
    const { email } = req.customer;

    const result = await pool.query(
      `SELECT
         r.id, r.product_id, r.rating, r.review_text, r.status,
         r.verified_purchase, r.created_at,
         p.name as product_name, p.image_url as product_image
       FROM product_reviews r
       JOIN products p ON p.id = r.product_id
       WHERE LOWER(r.customer_email) = LOWER($1)
       ORDER BY r.created_at DESC`,
      [email]
    );

    const reviews = result.rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      productImage: r.product_image,
      rating: r.rating,
      reviewText: r.review_text,
      status: r.status,
      verifiedPurchase: r.verified_purchase,
      createdAt: r.created_at,
    }));

    return res.json({ reviews });
  } catch (e) {
    console.error("getReviewHistory error:", e);
    return res.status(500).json({ error: "Failed to fetch review history" });
  }
}
