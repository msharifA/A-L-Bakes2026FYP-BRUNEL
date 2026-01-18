import { pool } from "../db.js";

// POST /api/reviews/:reviewId/report - Submit a report (public)
export async function submitReport(req, res) {
  try {
    const { reviewId } = req.params;
    const { email, reason, details } = req.body || {};

    if (!email || !reason) {
      return res.status(400).json({ error: "Email and reason are required" });
    }

    const validReasons = ["spam", "inappropriate", "fake", "other"];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: "Invalid reason" });
    }

    // Check if review exists
    const reviewCheck = await pool.query("SELECT id FROM product_reviews WHERE id = $1", [reviewId]);
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check for duplicate report from same email
    const duplicateCheck = await pool.query(
      `SELECT id FROM review_reports
       WHERE review_id = $1 AND LOWER(reporter_email) = LOWER($2) AND status = 'pending'`,
      [reviewId, email]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: "You have already reported this review" });
    }

    await pool.query(
      `INSERT INTO review_reports (review_id, reporter_email, reason, details)
       VALUES ($1, LOWER($2), $3, $4)`,
      [reviewId, email, reason, details?.trim() || null]
    );

    return res.status(201).json({ ok: true, message: "Report submitted. Thank you for your feedback." });
  } catch (e) {
    console.error("submitReport error:", e);
    return res.status(500).json({ error: "Failed to submit report" });
  }
}

// GET /api/admin/review-reports - List all reports
export async function getReports(req, res) {
  try {
    const { status } = req.query;

    let query = `
      SELECT rr.id, rr.review_id, rr.reporter_email, rr.reason, rr.details,
             rr.status, rr.admin_notes, rr.created_at,
             pr.reviewer_name, pr.rating, pr.comment, pr.product_id,
             p.name as product_name,
             u.first_name || ' ' || u.last_name as reviewed_by_name
      FROM review_reports rr
      JOIN product_reviews pr ON pr.id = rr.review_id
      JOIN products p ON p.id = pr.product_id
      LEFT JOIN users u ON u.id = rr.reviewed_by
    `;

    const params = [];

    if (status && status !== "all") {
      query += ` WHERE rr.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY rr.created_at DESC`;

    const result = await pool.query(query, params);
    return res.json({ reports: result.rows });
  } catch (e) {
    console.error("getReports error:", e);
    return res.status(500).json({ error: "Failed to fetch reports" });
  }
}

// PATCH /api/admin/review-reports/:id - Update report status
export async function updateReport(req, res) {
  try {
    const { id } = req.params;
    const { status, adminNotes, deleteReview } = req.body || {};
    const adminId = req.user?.userId || null;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = ["pending", "reviewed", "dismissed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Get the report first
    const reportCheck = await pool.query(
      "SELECT id, review_id FROM review_reports WHERE id = $1",
      [id]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    const reviewId = reportCheck.rows[0].review_id;

    // Update the report
    const result = await pool.query(
      `UPDATE review_reports
       SET status = $1, admin_notes = $2, reviewed_by = $3
       WHERE id = $4
       RETURNING id, status`,
      [status, adminNotes?.trim() || null, adminId, id]
    );

    // If admin wants to delete the review
    if (deleteReview && status === "reviewed") {
      await pool.query("DELETE FROM product_reviews WHERE id = $1", [reviewId]);
    }

    return res.json({ ok: true, report: result.rows[0] });
  } catch (e) {
    console.error("updateReport error:", e);
    return res.status(500).json({ error: "Failed to update report" });
  }
}

// GET /api/admin/review-reports/stats - Get report statistics
export async function getReportStats(req, res) {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed,
        COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed,
        COUNT(*) as total
      FROM review_reports
    `);

    return res.json({ stats: result.rows[0] });
  } catch (e) {
    console.error("getReportStats error:", e);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
}
