import { Router } from "express";
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleFeatured,
  toggleActive,
} from "../controllers/admin.products.controller.js";

const router = Router();

router.get("/products", getProducts);
router.get("/products/:id", getProduct);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.patch("/products/:id/toggle-featured", toggleFeatured);
router.patch("/products/:id/toggle-active", toggleActive);

export default router;
