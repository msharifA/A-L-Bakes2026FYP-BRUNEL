import { Router } from "express";
import {
  getOverview,
  getSalesByPeriod,
  getTopProducts,
  getRecentOrders,
} from "../controllers/sales.reports.controller.js";

const router = Router();

router.get("/reports/overview", getOverview);
router.get("/reports/sales-by-period", getSalesByPeriod);
router.get("/reports/top-products", getTopProducts);
router.get("/reports/recent-orders", getRecentOrders);

export default router;
