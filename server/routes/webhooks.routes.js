import express from "express";
import { handleStripeWebhook } from "../controllers/stripeWebhook.controller.js";

const router = express.Router();

/**
 * Stripe requires the RAW request body
 * This route must NOT use express.json()
 */
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

export default router;
