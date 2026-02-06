/**
 * =============================================================================
 * CUSTOMER PROFILE ROUTES
 * =============================================================================
 *
 * Protected routes for customer profile management.
 * All routes require customer authentication (requireCustomer middleware).
 *
 * ROUTES:
 * - GET  /api/customer/profile   → Get customer account info
 * - PUT  /api/customer/profile   → Update customer name
 * - GET  /api/customer/orders    → Get order history
 * - GET  /api/customer/reviews   → Get review history
 *
 * =============================================================================
 */

import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getOrderHistory,
  getReviewHistory,
} from "../controllers/customer.profile.controller.js";

const router = Router();

// Profile endpoints
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// History endpoints
router.get("/orders", getOrderHistory);
router.get("/reviews", getReviewHistory);

export default router;
