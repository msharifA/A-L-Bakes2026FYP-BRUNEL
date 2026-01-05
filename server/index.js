import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { pool } from "./db.js";

console.log("ENV PORT =", process.env.PORT);
console.log("CWD =", process.cwd());
console.log("Loaded ENV from CWD:", process.cwd());
console.log("Stripe key prefix:", process.env.STRIPE_SECRET_KEY?.slice(0, 12));


const app = express();

// Parse JSON (you’ll need this for checkout/orders)
app.use(express.json());

// Allowed origins (local + prod)
const ALLOWED_ORIGINS = [
  process.env.CORS_ORIGIN, // e.g. CloudFront in production
  "http://localhost:3000", // React (CRA)
  "http://localhost:5173", // Vite
].filter(Boolean);

// CORS config
app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser tools (curl, postman) with no origin
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- handlers ---
const health = (_req, res) => res.status(200).send("OK");

const version = (_req, res) => {
  // npm automatically exposes this when run via `npm run ...`
  const v = process.env.npm_package_version || "dev";
  res.json({ version: v });
};

const dbPing = async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    res.json({ db: "up", ok: r.rows[0].ok });
  } catch (e) {
    res.status(500).json({ db: "down", error: e.message });
  }
};

const getProducts = async (_req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, name, description, price_pence, image_url, category, is_featured FROM products WHERE is_active = true ORDER BY id ASC"
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch products", details: e.message });
  }
};

const getFeaturedProducts = async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, name, description, price_pence, image_url, category, is_featured
       FROM products
       WHERE is_featured = true AND is_active = true
       ORDER BY id DESC
       LIMIT 6`
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch featured products", details: e.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid id" });

    const r = await pool.query(
      `SELECT id, name, description, price_pence, image_url, category, is_featured
       FROM products
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (!r.rows.length) return res.status(404).json({ error: "Not found" });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch product", details: e.message });
  }
};

// --- routes ---
const api = express.Router();
api.get("/health", health);
api.get("/version", version);
api.get("/db-ping", dbPing);

api.get("/products", getProducts);
api.get("/products/featured", getFeaturedProducts);
api.get("/products/:id", getProductById);

// Stripe: create checkout session
api.post("/checkout/create-session", async (req, res) => {
  try {
    const { cartItems, checkout } = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    if (!checkout?.email || !checkout?.name) {
      return res.status(400).json({ error: "Missing customer details" });
    }

    // 1) Recalculate prices from DB (security)
    const productIds = [...new Set(cartItems.map((it) => Number(it.productId)))].filter(
      (n) => Number.isInteger(n) && n > 0
    );

    if (productIds.length === 0) {
      return res.status(400).json({ error: "Invalid cart items" });
    }

    const db = await pool.query(
      `SELECT id, name, price_pence
       FROM products
       WHERE id = ANY($1::int[]) AND is_active = true`,
      [productIds]
    );

    const priceMap = new Map(db.rows.map((p) => [p.id, p]));

    // 2) Build Stripe line items from trusted DB prices
    const line_items = cartItems.map((it) => {
      const pid = Number(it.productId);
      const qty = Math.max(1, Math.min(99, Number(it.qty || 1)));

      const p = priceMap.get(pid);
      if (!p) throw new Error(`Invalid product in cart: ${pid}`);

      const custom = it.customisation || {};
      const customLabel = [
        custom.size ? `Size: ${custom.size}` : null,
        custom.flavour ? `Flavour: ${custom.flavour}` : null,
        custom.message ? `Msg: ${custom.message}` : null,
      ]
        .filter(Boolean)
        .join(" | ");

      return {
        price_data: {
          currency: "gbp",
          product_data: {
            name: p.name + (customLabel ? ` (${customLabel})` : ""),
          },
          unit_amount: p.price_pence,
        },
        quantity: qty,
      };
    });

    // 3) Delivery fee (simple fixed fee for now)
    const deliveryFeePence = checkout.deliveryMethod === "delivery" ? 499 : 0;
    if (deliveryFeePence > 0) {
      line_items.push({
        price_data: {
          currency: "gbp",
          product_data: { name: "Delivery fee" },
          unit_amount: deliveryFeePence,
        },
        quantity: 1,
      });
    }

    // 4) Create Stripe session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: checkout.email,
      line_items,
      success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout`,
      metadata: {
        customer_name: checkout.name,
        delivery_method: checkout.deliveryMethod || "pickup",
        delivery_date: checkout.deliveryDate || "",
      },
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error("create-session error:", e);
    res.status(500).json({ error: e.message || "Stripe session failed" });
  }
});



app.use("/api", api);

// Keep legacy routes for now (optional)
app.get("/health", health);
app.get("/version", version);
app.get("/db-ping", dbPing);

// --- port ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API listening on ${PORT}`);
});