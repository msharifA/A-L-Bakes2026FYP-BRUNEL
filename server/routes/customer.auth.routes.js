import { Router } from "express";
import {
  customerRegister,
  customerLogin,
  customerLogout,
  customerMe,
  forgotPassword,
  resetPassword,
} from "../controllers/customer.auth.controller.js";

const router = Router();

router.post("/register", customerRegister);
router.post("/login", customerLogin);
router.post("/logout", customerLogout);
router.get("/me", customerMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
