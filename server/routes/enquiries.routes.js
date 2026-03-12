import express from "express";
import {
  submitEnquiry,
  createDepositSession,
  confirmDeposit,
  confirmFinalPayment,
  getEnquiry,
  getCakeConfig,
  uploadReferenceImages,
} from "../controllers/enquiries.controller.js";
import { uploadImages } from "../middleware/upload.js";

const router = express.Router();

/**
 * =============================================================================
 * ENQUIRIES ROUTES
 * =============================================================================
 *
 * Public endpoints for custom cake enquiries and payments
 *
 * FLOW:
 * 1. GET  /config → Get cake builder options (sizes, flavours, etc.)
 * 2. POST /upload-images → Upload reference images to S3
 * 3. POST / → Submit enquiry
 * 4. POST /:id/deposit → Create Stripe session for 50% deposit
 * 5. POST /:id/confirm-deposit → Confirm deposit payment
 * 6. POST /:id/confirm-final-payment → Confirm final payment (NEW!)
 * 7. GET  /:id → Get enquiry details
 */

// Public routes
router.get("/config", getCakeConfig);
router.post("/upload-images", uploadImages, uploadReferenceImages);
router.post("/", submitEnquiry);
router.get("/:id", getEnquiry);

// PAYMENT ROUTES
router.post("/:id/deposit", createDepositSession);
router.post("/:id/confirm-deposit", confirmDeposit);

// FINAL PAYMENT (triggered when admin marks cake as 'ready')
router.post("/:id/confirm-final-payment", confirmFinalPayment);

export default router;
