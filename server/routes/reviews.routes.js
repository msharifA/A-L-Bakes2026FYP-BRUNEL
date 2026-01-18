import express from "express";
import {
  getProductReviews,
  submitReview,
} from "../controllers/reviews.controller.js";

const router = express.Router();

// Public routes
router.get("/products/:productId/reviews", getProductReviews);
router.post("/products/:productId/reviews", submitReview);

export default router;
