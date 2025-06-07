-- Quick fix: Update existing placeholder split codes with valid format or disable them

-- Option 1: Update split codes to be valid format (replace with real Paystack split codes)
UPDATE chapter_split_codes 
SET split_code = CASE 
    WHEN chapter_id = 1 AND slot_package_id = 1 THEN 'SPL_TEST_1_1'  -- Replace with real split code
    WHEN chapter_id = 1 AND slot_package_id = 2 THEN 'SPL_TEST_1_2'  -- Replace with real split code
    -- Add more as needed
    ELSE split_code
END,
updated_at = NOW()
WHERE is_active = true;

-- Option 2: Temporarily disable split codes for testing (no splitting, all money goes to main account)
-- UPDATE chapter_split_codes SET is_active = false WHERE is_active = true;

-- Option 3: Delete placeholder split codes (this will make payments work without splitting)
-- DELETE FROM chapter_split_codes WHERE split_code LIKE 'SPLT_%';

-- Check the results
SELECT 
    csc.id,
    c.name as chapter_name,
    sp.name as package_name,
    csc.split_code,
    csc.is_active
FROM chapter_split_codes csc
JOIN chapters c ON csc.chapter_id = c.id
JOIN slot_packages sp ON csc.slot_package_id = sp.id
ORDER BY c.name, sp.slot_count;
