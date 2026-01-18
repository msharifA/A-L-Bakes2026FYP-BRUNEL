import express from "express";
import {
  adminListOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
} from "../controllers/adminOrders.controller.js";

const router = express.Router();

/**
 * GET /api/admin/orders
 * Query params:
 *  - status=paid|processing|shipped|delivered|cancelled|refunded
 *  - q=email search
 *  - limit=20
 *  - offset=0
 */
router.get("/orders", adminListOrders);

/**
 * GET /api/admin/orders/:id
 */
router.get("/orders/:id", adminGetOrder);

/**
 * PATCH /api/admin/orders/:id/status
 * Body: { status: "processing", message?: "Optional note" }
 */
router.patch("/orders/:id/status", adminUpdateOrderStatus);

export default router;
