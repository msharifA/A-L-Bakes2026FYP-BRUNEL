import express from "express";
import {
  adminListEnquiries,
  adminUpdateEnquiry,
} from "../controllers/enquiries.controller.js";

const router = express.Router();

router.get("/enquiries", adminListEnquiries);
router.patch("/enquiries/:id", adminUpdateEnquiry);

export default router;
