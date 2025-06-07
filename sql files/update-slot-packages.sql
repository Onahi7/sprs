-- Update slot_packages table to remove price column and update data
-- The price will now be calculated dynamically as slot_count * chapter_amount

-- Remove the price column from slot_packages table (optional, since we calculate it dynamically)
-- ALTER TABLE slot_packages DROP COLUMN IF EXISTS price;

-- Insert sample slot packages if they don't exist
INSERT INTO slot_packages (name, slot_count, description, is_active) 
VALUES 
  ('Basic Package', 5, 'Basic slot package with 5 slots', true),
  ('Standard Package', 10, 'Standard slot package with 10 slots', true),
  ('Premium Package', 20, 'Premium slot package with 20 slots', true),
  ('Bulk Package', 50, 'Bulk slot package with 50 slots', true),
  ('Super Bulk Package', 100, 'Super bulk slot package with 100 slots', true)
ON CONFLICT (name) DO NOTHING;

-- Verify the data
SELECT 
  id, 
  name, 
  slot_count, 
  description, 
  is_active 
FROM slot_packages 
ORDER BY slot_count;
