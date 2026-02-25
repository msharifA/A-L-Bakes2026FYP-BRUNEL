-- Base Schema for A&L Bakes
-- Run this first: psql $DATABASE_URL -f server/migrations/000_base_schema.sql

-- Products table
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
);

-- Orders table
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
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_pence INTEGER NOT NULL,
  customisation JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order Events (timeline)
CREATE TABLE IF NOT EXISTS order_events (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- Insert sample products if table is empty
INSERT INTO products (name, description, price_pence, image_url, category, is_featured, is_active)
SELECT 'Chocolate Fudge Cake', 'Rich and decadent chocolate cake with fudge frosting', 2500, '/images/chocolate-cake.jpg', 'Cakes', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

INSERT INTO products (name, description, price_pence, image_url, category, is_featured, is_active)
SELECT 'Victoria Sponge', 'Classic British sponge with jam and cream', 2000, '/images/victoria-sponge.jpg', 'Cakes', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Victoria Sponge');

INSERT INTO products (name, description, price_pence, image_url, category, is_featured, is_active)
SELECT 'Lemon Drizzle Cake', 'Zesty lemon cake with tangy glaze', 1800, '/images/lemon-drizzle.jpg', 'Cakes', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Lemon Drizzle Cake');

INSERT INTO products (name, description, price_pence, image_url, category, is_featured, is_active)
SELECT 'Chocolate Chip Cookies (6)', 'Freshly baked cookies with chocolate chips', 800, '/images/cookies.jpg', 'Cookies', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Chocolate Chip Cookies (6)');

INSERT INTO products (name, description, price_pence, image_url, category, is_featured, is_active)
SELECT 'Cupcakes (Box of 6)', 'Assorted cupcakes with buttercream frosting', 1500, '/images/cupcakes.jpg', 'Cupcakes', TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Cupcakes (Box of 6)');

INSERT INTO products (name, description, price_pence, image_url, category, is_featured, is_active)
SELECT 'Brownies (4 pack)', 'Fudgy chocolate brownies', 1000, '/images/brownies.jpg', 'Brownies', FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Brownies (4 pack)');

SELECT 'Base schema created successfully!' as status;
SELECT COUNT(*) as product_count FROM products;
