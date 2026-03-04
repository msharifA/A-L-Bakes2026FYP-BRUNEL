import express from "express";
import {
  submitEnquiry,
  createDepositSession,
  confirmDeposit,
  getEnquiry,
  getCakeConfig,
} from "../controllers/enquiries.controller.js";

const router = express.Router();

// Public routes
router.get("/config", getCakeConfig);
router.post("/", submitEnquiry);
router.get("/:id", getEnquiry);
router.post("/:id/deposit", createDepositSession);
router.post("/:id/confirm-deposit", confirmDeposit);

export default router;
