-- Test query to see current slot packages structure
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'slot_packages' 
ORDER BY ordinal_position;

-- Check current slot packages data
SELECT * FROM slot_packages WHERE is_active = true;

-- Check chapters and their amounts
SELECT id, name, amount FROM chapters;

-- Test calculation: Get packages with calculated prices for a specific chapter
-- Replace 1 with actual chapter ID
SELECT 
  sp.id,
  sp.name,
  sp.slot_count,
  sp.description,
  c.amount as chapter_amount,
  (sp.slot_count * c.amount) as calculated_price
FROM slot_packages sp
CROSS JOIN chapters c
WHERE sp.is_active = true 
  AND c.id = 1  -- Replace with actual chapter ID
ORDER BY sp.slot_count;
