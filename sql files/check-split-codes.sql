-- Check current split codes in the database
SELECT 
  csc.id,
  c.name as chapter_name,
  sp.name as package_name,
  sp.slot_count,
  csc.split_code,
  csc.is_active
FROM chapter_split_codes csc
JOIN chapters c ON csc.chapter_id = c.id
JOIN slot_packages sp ON csc.slot_package_id = sp.id
WHERE csc.is_active = true
ORDER BY c.name, sp.slot_count;

-- Update split codes with valid Paystack split codes
-- Replace 'SPL_xxxxxxxxxx' with actual split codes from your Paystack dashboard

-- Example update (replace with your actual split codes):
-- UPDATE chapter_split_codes 
-- SET split_code = 'SPL_YOUR_ACTUAL_SPLIT_CODE_HERE'
-- WHERE chapter_id = 1 AND slot_package_id = 1;

-- Or temporarily disable split codes for testing:
-- UPDATE chapter_split_codes SET is_active = false;
