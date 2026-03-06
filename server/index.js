import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { pool } from "./db.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import customerAuthRoutes from "./routes/customer.auth.routes.js";
import { requireAdmin } from "./middleware/requireAdmin.js";
import { requireCustomer } from "./middleware/requireCustomer.js";


// ✅ NEW: route modules
import ordersRoutes from "./routes/orders.routes.js";
import webhookRoutes from "./routes/webhooks.routes.js";
import adminOrdersRoutes from "./routes/admin.orders.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import adminReviewsRoutes from "./routes/admin.reviews.routes.js";
import adminUsersRoutes from "./routes/admin.users.routes.js";
import adminProductsRoutes from "./routes/admin.products.routes.js";
import reviewReportsRoutes from "./routes/review.reports.routes.js";
import salesReportsRoutes from "./routes/sales.reports.routes.js";
import customerProfileRoutes from "./routes/customer.profile.routes.js";
import enquiriesRoutes from "./routes/enquiries.routes.js";
import adminEnquiriesRoutes from "./routes/admin.enquiries.routes.js";

console.log("ENV PORT =", process.env.PORT);
console.log("CWD =", process.cwd());
console.log("Loaded ENV from CWD:", process.cwd());
console.log("Stripe key prefix:", process.env.STRIPE_SECRET_KEY?.slice(0, 12));

const app = express();
const api = express.Router();

/**
 * ✅ IMPORTANT: Stripe Webhooks need the *raw request body* to verify the signature.
 * Mount `/api/webhooks/*` BEFORE `express.json()`.
 */
app.use("/api/webhooks", webhookRoutes);

/**
 * Parse JSON for normal API routes (products/checkout/orders etc).
 * This must come AFTER webhook raw-body route above.
 */
app.use(cookieParser());

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
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Basic CSRF protection via Referer validation (production only)
const isProd = process.env.NODE_ENV === "production";
app.use((req, res, next) => {
  // Skip in development or for GET/HEAD/OPTIONS requests
  if (!isProd || ["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Check Referer or Origin header
  const referer = req.headers.referer || req.headers.origin;

  // Allow requests without referer (e.g., API clients, Postman)
  if (!referer) return next();

  // Validate referer starts with an allowed origin
  const isValidOrigin = ALLOWED_ORIGINS.some(origin => referer.startsWith(origin));

  if (!isValidOrigin) {
    console.warn(`CSRF: Blocked request from ${referer} to ${req.path}`);
    return res.status(403).json({ error: "Invalid request origin" });
  }

  next();
});

const raw = process.env.STRIPE_SECRET_KEY;
console.log("Stripe key typeof:", typeof raw);
console.log("Stripe key prefic:", (raw || "").slice(0, 12));
console.log("Stripe key length:", (raw || "").length);
console.log("Stripe key trimmed length:", (raw || "").trim().length);
console.log("Stripe key has spaces:", /\s/.test(raw || ""));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// --- handlers ---
const health = (_req, res) => res.status(200).send("OK");

const version = (_req, res) => {
  const v = process.env.npm_package_version || "dev";
  res.json({ version: v });
};

const dbPing = async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    res.json({ db: "up", ok: r.rows[0].ok });
  } catch (e) {
    console.error("dbPing error:", e);
    res.status(500).json({
      db: "down",
      error: e?.message || String(e),
      code: e?.code || null,
    });
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

// --- routes on /api router ---
api.use("/admin", requireAdmin, adminOrdersRoutes);
api.use("/admin", requireAdmin, adminReviewsRoutes);
api.use("/admin", requireAdmin, adminProductsRoutes);
api.use("/admin", requireAdmin, salesReportsRoutes);
api.use("/admin", requireAdmin, adminEnquiriesRoutes);
api.use("/enquiries", enquiriesRoutes);
api.use("/auth", authRoutes);
api.use("/auth/customer", customerAuthRoutes);
api.use("/auth/admin", adminUsersRoutes);
api.use("/customer", requireCustomer, customerProfileRoutes);

api.get("/health", health);
api.get("/version", version);
api.get("/db-ping", dbPing);

// Debug endpoint to verify deployment
api.get("/debug-routes", (_req, res) => {
  res.json({
    deployed: new Date().toISOString(),
    version: "2026-01-20-v3",
    routes: ["products", "products/featured", "products/:id"],
    nodeVersion: process.version,
  });
});

// TEMPORARY: Fix schema migration
api.post("/fix-schema", async (req, res) => {
  const secret = req.query.secret;
  if (secret !== "albakes2026migrate") {
    return res.status(403).json({ error: "Invalid secret" });
  }

  const results = [];
  try {
    // Add missing columns to orders table
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'gbp'`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_pence INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_pence INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255)`);
    results.push("orders columns added");

    // Add unique index on stripe_session_id (CREATE UNIQUE INDEX IF NOT EXISTS is valid PostgreSQL)
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session_unique ON orders(stripe_session_id)`);
    results.push("stripe_session_id unique index created");

    // Add missing columns to order_items table
    await pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS name VARCHAR(255)`);
    await pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price_pence INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS line_total_pence INTEGER DEFAULT 0`);
    // Drop NOT NULL constraints from old columns (controller uses different column names)
    await pool.query(`ALTER TABLE order_items ALTER COLUMN product_name DROP NOT NULL`);
    await pool.query(`ALTER TABLE order_items ALTER COLUMN price_pence DROP NOT NULL`);
    results.push("order_items table updated");

    // Add missing columns to order_events table
    await pool.query(`ALTER TABLE order_events ADD COLUMN IF NOT EXISTS type VARCHAR(50)`);
    results.push("order_events table updated");

    res.json({ success: true, results });
  } catch (e) {
    console.error("Fix schema error:", e);
    res.status(500).json({ error: e.message, results });
  }
});

// TEMPORARY: Run migrations via API (remove after first run)
api.post("/run-migrations", async (req, res) => {
  const secret = req.query.secret;
  if (secret !== "albakes2026migrate") {
    return res.status(403).json({ error: "Invalid secret" });
  }

  const results = [];
  try {
    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price_pence INTEGER NOT NULL,
        image_url VARCHAR(500),
        category VARCHAR(100),
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("products table created");

    // Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        total_pence INTEGER NOT NULL,
        delivery_method VARCHAR(50) DEFAULT 'pickup',
        delivery_date DATE,
        stripe_session_id VARCHAR(255),
        stripe_payment_intent VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("orders table created");

    // Order Items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price_pence INTEGER NOT NULL,
        customisation JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("order_items table created");

    // Order Events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_events (
        id SERIAL PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        status VARCHAR(50),
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("order_events table created");

    // Product Reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT NOT NULL,
        verified_purchase BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("product_reviews table created");

    // Review Helpful Votes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_helpful_votes (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(review_id, session_id)
      )
    `);
    results.push("review_helpful_votes table created");

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        is_active BOOLEAN DEFAULT TRUE,
        admin_approved BOOLEAN DEFAULT FALSE,
        approved_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("users table created");

    // Password Reset Tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("password_reset_tokens table created");

    // Saved Carts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS saved_carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        cart_data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("saved_carts table created");

    // Review Reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS review_reports (
        id SERIAL PRIMARY KEY,
        review_id INTEGER REFERENCES product_reviews(id) ON DELETE CASCADE,
        reporter_email VARCHAR(255) NOT NULL,
        reason VARCHAR(100) NOT NULL,
        details TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        reviewed_by INTEGER REFERENCES users(id),
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    results.push("review_reports table created");

    // Cake Enquiries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cake_enquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_name VARCHAR(200) NOT NULL,
        customer_email VARCHAR(300) NOT NULL,
        customer_phone VARCHAR(30),
        cake_size VARCHAR(50) NOT NULL,
        cake_flavour VARCHAR(100) NOT NULL,
        filling VARCHAR(100),
        frosting VARCHAR(100),
        tiers INTEGER DEFAULT 1,
        servings INTEGER,
        message_on_cake VARCHAR(200),
        special_requests TEXT,
        reference_images TEXT,
        event_type VARCHAR(100),
        event_date DATE,
        estimated_price_pence INTEGER,
        deposit_pence INTEGER,
        deposit_status VARCHAR(30) DEFAULT 'none',
        stripe_session_id VARCHAR(500),
        status VARCHAR(30) DEFAULT 'new',
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    results.push("cake_enquiries table created");

    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cake_enquiries_status ON cake_enquiries(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cake_enquiries_email ON cake_enquiries(customer_email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_cake_enquiries_created ON cake_enquiries(created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status)`);
    results.push("indexes created");

    // Insert sample products if table is empty
    const productCount = await pool.query("SELECT COUNT(*) FROM products");
    if (parseInt(productCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO products (name, description, price_pence, image_url, category, is_featured, is_active) VALUES
        ('Chocolate Fudge Cake', 'Rich and decadent chocolate cake with fudge frosting', 2500, '/images/chocolate-cake.jpg', 'Cakes', TRUE, TRUE),
        ('Victoria Sponge', 'Classic British sponge with jam and cream', 2000, '/images/victoria-sponge.jpg', 'Cakes', TRUE, TRUE),
        ('Lemon Drizzle Cake', 'Zesty lemon cake with tangy glaze', 1800, '/images/lemon-drizzle.jpg', 'Cakes', TRUE, TRUE),
        ('Chocolate Chip Cookies (6)', 'Freshly baked cookies with chocolate chips', 800, '/images/cookies.jpg', 'Cookies', FALSE, TRUE),
        ('Cupcakes (Box of 6)', 'Assorted cupcakes with buttercream frosting', 1500, '/images/cupcakes.jpg', 'Cupcakes', TRUE, TRUE),
        ('Brownies (4 pack)', 'Fudgy chocolate brownies', 1000, '/images/brownies.jpg', 'Brownies', FALSE, TRUE)
      `);
      results.push("sample products inserted");
    } else {
      results.push("products already exist, skipped sample data");
    }

    res.json({ success: true, results });
  } catch (e) {
    console.error("Migration error:", e);
    res.status(500).json({ error: e.message, results });
  }
});

api.get("/products", getProducts);
api.get("/products/featured", getFeaturedProducts);
api.get("/products/:id", getProductById);

api.use("/orders", ordersRoutes);
api.use(reviewsRoutes);
api.use(reviewReportsRoutes);

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