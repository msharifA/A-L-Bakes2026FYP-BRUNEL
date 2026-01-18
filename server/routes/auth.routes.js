import express from "express";
import { adminLogin, logout, me } from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * POST /api/auth/admin/login
 * Sets httpOnly cookie if credentials are valid.
 */
router.post("/admin/login", adminLogin);

/**
 * POST /api/auth/logout
 * Clears cookie.
 */
router.post("/logout", logout);

/**
 * GET /api/auth/me
 * Lets frontend check if admin cookie is present + valid.
 */
router.get("/me", me);

export default router;
