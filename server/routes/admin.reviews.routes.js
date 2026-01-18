import express from "express";
import {
  adminListReviews,
  adminUpdateReviewStatus,
} from "../controllers/reviews.controller.js";

const router = express.Router();

// Admin routes (protected by requireAdmin middleware in index.js)
router.get("/reviews", adminListReviews);
router.patch("/reviews/:reviewId/status", adminUpdateReviewStatus);

export default router;
