-- Product Reviews System
-- Run this migration: psql $DATABASE_URL -f server/migrations/001_add_reviews.sql

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_status ON product_reviews(status);
CREATE INDEX idx_product_reviews_created_at ON product_reviews(created_at DESC);

-- Optional: Helpful votes table (for future enhancement)
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id SERIAL PRIMARY KEY,
  review_id INTEGER NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, session_id)
);

-- Create index for helpful votes
CREATE INDEX idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);

-- Verify tables created
SELECT 'Tables created successfully!' as status;
SELECT COUNT(*) as review_count FROM product_reviews;
