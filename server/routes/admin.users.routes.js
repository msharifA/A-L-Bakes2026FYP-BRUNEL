import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  adminRegisterRequest,
  adminForgotPassword,
  getApprovalRequests,
  approveAdminRequest,
  rejectAdminRequest,
  getAdminUsers,
  toggleAdminActive,
} from "../controllers/admin.users.controller.js";

const router = Router();

// Public routes (no auth required)
router.post("/register", adminRegisterRequest);
router.post("/forgot-password", adminForgotPassword);

// Protected routes (require admin auth)
router.get("/approval-requests", requireAdmin, getApprovalRequests);
router.post("/approval-requests/:id/approve", requireAdmin, approveAdminRequest);
router.post("/approval-requests/:id/reject", requireAdmin, rejectAdminRequest);
router.get("/users", requireAdmin, getAdminUsers);
router.patch("/users/:id/toggle-active", requireAdmin, toggleAdminActive);

export default router;
