import express from "express";
import {
  submitEnquiry,
  createDepositSession,
  confirmDeposit,
  getEnquiry,
  getCakeConfig,
  uploadReferenceImages,
} from "../controllers/enquiries.controller.js";
import { uploadImages } from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/config", getCakeConfig);
router.post("/upload-images", uploadImages, uploadReferenceImages);
router.post("/", submitEnquiry);
router.get("/:id", getEnquiry);
router.post("/:id/deposit", createDepositSession);
router.post("/:id/confirm-deposit", confirmDeposit);

export default router;
