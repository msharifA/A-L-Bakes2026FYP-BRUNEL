import express from "express";
import {
  createOrderFromSession,
  getOrderById,
  getOrderTracking,
} from "../controllers/orders.controller.js";

const router = express.Router();

/**
 * POST /api/orders/from-session
 * Called by frontend OrderSuccess page
 * Uses Stripe session_id to create the order safely
 */
router.post("/from-session", createOrderFromSession);

/**
 * GET /api/orders/:id/track
 * Lightweight status + events for tracking page
 *
 * NOTE: this must be BEFORE "/:id" to avoid route conflicts
 */
router.get("/:id/track", getOrderTracking);

/**
 * GET /api/orders/:id
 * Fetch full order details (items + events)
 */
router.get("/:id", getOrderById);

export default router;