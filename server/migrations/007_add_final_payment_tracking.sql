-- Migration: 007_add_final_payment_tracking.sql
-- Add final payment tracking to cake_enquiries

ALTER TABLE cake_enquiries
  ADD COLUMN IF NOT EXISTS final_payment_pence INTEGER,
  ADD COLUMN IF NOT EXISTS final_payment_status VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS final_payment_stripe_session_id VARCHAR(500),
  ADD COLUMN IF NOT EXISTS final_payment_link VARCHAR(1000);

-- Add index for quick lookup of pending final payments
CREATE INDEX IF NOT EXISTS idx_cake_enquiries_final_payment_status
  ON cake_enquiries(final_payment_status);

SELECT 'Final payment tracking fields added successfully!' as status;
