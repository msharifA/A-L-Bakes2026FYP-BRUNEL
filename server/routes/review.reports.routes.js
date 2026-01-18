import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  submitReport,
  getReports,
  updateReport,
  getReportStats,
} from "../controllers/review.reports.controller.js";

const router = Router();

// Public route - submit a report
router.post("/reviews/:reviewId/report", submitReport);

// Admin routes
router.get("/admin/review-reports", requireAdmin, getReports);
router.get("/admin/review-reports/stats", requireAdmin, getReportStats);
router.patch("/admin/review-reports/:id", requireAdmin, updateReport);

export default router;
