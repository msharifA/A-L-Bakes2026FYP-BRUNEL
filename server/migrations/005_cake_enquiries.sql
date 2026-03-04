-- Migration: 005_cake_enquiries.sql
-- Custom cake enquiry system with deposit tracking

CREATE TABLE IF NOT EXISTS cake_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(300) NOT NULL,
  customer_phone VARCHAR(30),

  -- Cake configuration
  cake_size VARCHAR(50) NOT NULL,
  cake_flavour VARCHAR(100) NOT NULL,
  filling VARCHAR(100),
  frosting VARCHAR(100),
  tiers INTEGER DEFAULT 1,
  servings INTEGER,
  message_on_cake VARCHAR(200),
  special_requests TEXT,

  -- Event details
  event_type VARCHAR(100),
  event_date DATE,

  -- Pricing & deposit
  estimated_price_pence INTEGER,
  deposit_pence INTEGER,
  deposit_status VARCHAR(30) DEFAULT 'none',
  stripe_session_id VARCHAR(500),

  -- Workflow
  status VARCHAR(30) DEFAULT 'new',
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cake_enquiries_status ON cake_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_cake_enquiries_email ON cake_enquiries(customer_email);
CREATE INDEX IF NOT EXISTS idx_cake_enquiries_created ON cake_enquiries(created_at DESC);

SELECT 'Cake enquiries table created successfully!' as status;
