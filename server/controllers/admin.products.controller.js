import { pool } from "../db.js";

// GET /api/admin/products - List all products (including inactive)
export async function getProducts(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, description, price_pence, image_url, category,
              is_featured, is_active, created_at, updated_at
       FROM products
       ORDER BY created_at DESC`
    );

    return res.json({ products: result.rows });
  } catch (e) {
    console.error("getProducts error:", e);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
}

// GET /api/admin/products/:id - Get single product
export async function getProduct(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, description, price_pence, image_url, category,
              is_featured, is_active, created_at, updated_at
       FROM products WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({ product: result.rows[0] });
  } catch (e) {
    console.error("getProduct error:", e);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
}

// POST /api/admin/products - Create new product
export async function createProduct(req, res) {
  try {
    const { name, description, pricePence, imageUrl, category, isFeatured } = req.body || {};

    if (!name || !pricePence) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const price = parseInt(pricePence);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, price_pence, image_url, category, is_featured, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id, name, description, price_pence, image_url, category, is_featured, is_active, created_at`,
      [
        name.trim(),
        description?.trim() || null,
        price,
        imageUrl?.trim() || null,
        category?.trim() || null,
        isFeatured === true,
      ]
    );

    return res.status(201).json({ ok: true, product: result.rows[0] });
  } catch (e) {
    console.error("createProduct error:", e);
    return res.status(500).json({ error: "Failed to create product" });
  }
}

// PUT /api/admin/products/:id - Update product
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, description, pricePence, imageUrl, category, isFeatured, isActive } =
      req.body || {};

    if (!name || pricePence === undefined) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const price = parseInt(pricePence);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    const result = await pool.query(
      `UPDATE products
       SET name = $1, description = $2, price_pence = $3, image_url = $4,
           category = $5, is_featured = $6, is_active = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING id, name, description, price_pence, image_url, category, is_featured, is_active, updated_at`,
      [
        name.trim(),
        description?.trim() || null,
        price,
        imageUrl?.trim() || null,
        category?.trim() || null,
        isFeatured === true,
        isActive !== false,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({ ok: true, product: result.rows[0] });
  } catch (e) {
    console.error("updateProduct error:", e);
    return res.status(500).json({ error: "Failed to update product" });
  }
}

// DELETE /api/admin/products/:id - Delete product (soft delete by setting inactive)
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE products SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("deleteProduct error:", e);
    return res.status(500).json({ error: "Failed to delete product" });
  }
}

// PATCH /api/admin/products/:id/toggle-featured
export async function toggleFeatured(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE products SET is_featured = NOT is_featured, updated_at = NOW()
       WHERE id = $1
       RETURNING id, is_featured`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({ ok: true, product: result.rows[0] });
  } catch (e) {
    console.error("toggleFeatured error:", e);
    return res.status(500).json({ error: "Failed to update product" });
  }
}

// PATCH /api/admin/products/:id/toggle-active
export async function toggleActive(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE products SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1
       RETURNING id, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({ ok: true, product: result.rows[0] });
  } catch (e) {
    console.error("toggleActive error:", e);
    return res.status(500).json({ error: "Failed to update product" });
  }
}
