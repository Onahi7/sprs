-- Migration: Add 10 and 200 slot packages
-- Date: 2025-06-16
-- Description: Add new slot packages of 10 and 200 slots to existing system

-- Insert new slot packages (only if they don't exist)
INSERT INTO slot_packages (name, slot_count, price, description, is_active) 
SELECT * FROM (
    VALUES 
    ('10 Slots Package', 10, 12000.00, 'Perfect for small-scale registration - Register up to 10 students', true),
    ('200 Slots Package', 200, 180000.00, 'Bulk registration package - Register up to 200 students with maximum savings', true)
) AS new_packages(name, slot_count, price, description, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM slot_packages sp 
    WHERE sp.slot_count = new_packages.slot_count
);

-- Create split codes for all chapters for the new packages
INSERT INTO chapter_split_codes (chapter_id, slot_package_id, split_code, is_active)
SELECT 
    c.id as chapter_id,
    sp.id as slot_package_id,
    CONCAT('SPL_', LOWER(SUBSTRING(c.name, 1, 3)), '_', sp.slot_count, '_2025') as split_code,
    true as is_active
FROM chapters c
CROSS JOIN slot_packages sp 
WHERE sp.name IN ('10 Slots Package', '200 Slots Package')
ON CONFLICT DO NOTHING;
