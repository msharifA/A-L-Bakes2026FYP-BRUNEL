-- Migration: 006_add_delivery_addresses.sql
-- Add delivery address fields to orders and cake_enquiries

-- Add delivery address to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_address_line1 VARCHAR(300),
  ADD COLUMN IF NOT EXISTS delivery_address_line2 VARCHAR(300),
  ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS delivery_postcode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Add delivery address to cake_enquiries table
ALTER TABLE cake_enquiries
  ADD COLUMN IF NOT EXISTS delivery_address_line1 VARCHAR(300),
  ADD COLUMN IF NOT EXISTS delivery_address_line2 VARCHAR(300),
  ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS delivery_postcode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

SELECT 'Delivery address fields added successfully!' as status;
