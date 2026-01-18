import { pool } from "../db.js";

// Get all approved reviews for a product
export async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;
    const { limit = 10, offset = 0, sort = "newest" } = req.query;

    let orderBy = "created_at DESC";
    if (sort === "highest") orderBy = "rating DESC, created_at DESC";
    if (sort === "lowest") orderBy = "rating ASC, created_at DESC";

    const result = await pool.query(
      `
      SELECT
        id,
        customer_name,
        rating,
        review_text,
        verified_purchase,
        created_at
      FROM product_reviews
      WHERE product_id = $1 AND status = 'approved'
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3
      `,
      [productId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      "SELECT COUNT(*) FROM product_reviews WHERE product_id = $1 AND status = 'approved'",
      [productId]
    );

    // Get average rating
    const avgResult = await pool.query(
      "SELECT AVG(rating)::numeric(2,1) as avg_rating FROM product_reviews WHERE product_id = $1 AND status = 'approved'",
      [productId]
    );

    res.json({
      reviews: result.rows,
      total: parseInt(countResult.rows[0].count),
      avgRating: parseFloat(avgResult.rows[0].avg_rating) || 0,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

// Submit a new review (customer)
export async function submitReview(req, res) {
  try {
    const { productId } = req.params;
    const { orderId, customerEmail, customerName, rating, reviewText } = req.body;

    // Validation
    if (!customerEmail || !customerName || !rating || !reviewText) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be 1-5" });
    }

    if (reviewText.length < 10) {
      return res.status(400).json({ error: "Review must be at least 10 characters" });
    }

    // Check if this is a verified purchase
    let verifiedPurchase = false;
    if (orderId) {
      const orderCheck = await pool.query(
        `
        SELECT oi.id
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.id = $1 AND o.customer_email = $2 AND oi.product_id = $3 AND o.status IN ('delivered', 'processing', 'shipped')
        `,
        [orderId, customerEmail, productId]
      );
      verifiedPurchase = orderCheck.rows.length > 0;
    }

    // Insert review (pending approval)
    const result = await pool.query(
      `
      INSERT INTO product_reviews (
        product_id, order_id, customer_email, customer_name, rating, review_text, verified_purchase, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id, created_at
      `,
      [productId, orderId || null, customerEmail, customerName, rating, reviewText, verifiedPurchase]
    );

    res.json({
      success: true,
      reviewId: result.rows[0].id,
      message: "Review submitted! It will appear after approval.",
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
}

// Admin: List all reviews (pending + approved + rejected)
export async function adminListReviews(req, res) {
  try {
    const { status = "", productId = "", limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT
        r.id, r.product_id, r.customer_email, r.customer_name,
        r.rating, r.review_text, r.verified_purchase, r.status, r.created_at,
        p.name as product_name
      FROM product_reviews r
      JOIN products p ON p.id = r.product_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (productId) {
      query += ` AND r.product_id = $${paramIndex}`;
      params.push(productId);
      paramIndex++;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ reviews: result.rows });
  } catch (error) {
    console.error("Error listing reviews:", error);
    res.status(500).json({ error: "Failed to list reviews" });
  }
}

// Admin: Approve or reject review
export async function adminUpdateReviewStatus(req, res) {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    await pool.query(
      "UPDATE product_reviews SET status = $1, updated_at = NOW() WHERE id = $2",
      [status, reviewId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating review status:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
}
