-- Migration: 004_add_customisation_column.sql
-- Adds customisation JSONB column to order_items table

-- Add customisation column if it doesn't exist
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS customisation JSONB;

-- Add index for JSONB queries (optional but good for performance)
CREATE INDEX IF NOT EXISTS idx_order_items_customisation ON order_items USING GIN (customisation);

-- Verify
SELECT 'Customisation column added successfully!' as status;
