-- Migration: Add supervisors table
-- Date: 2025-06-16
-- Description: Add supervisors table to store chapter supervisors information (one per center)

-- Create supervisors table
CREATE TABLE IF NOT EXISTS supervisors (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id),
    center_id INTEGER NOT NULL REFERENCES centers(id),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supervisors_chapter_id ON supervisors(chapter_id);
CREATE INDEX IF NOT EXISTS idx_supervisors_center_id ON supervisors(center_id);
CREATE INDEX IF NOT EXISTS idx_supervisors_is_active ON supervisors(is_active);

-- Create unique constraint to ensure only one supervisor per center
CREATE UNIQUE INDEX IF NOT EXISTS idx_supervisors_center_unique 
ON supervisors(center_id) 
WHERE is_active = true;

-- Add comments for documentation
COMMENT ON TABLE supervisors IS 'Stores supervisors information for each center (one per center)';
COMMENT ON COLUMN supervisors.chapter_id IS 'Foreign key reference to chapters table';
COMMENT ON COLUMN supervisors.center_id IS 'Foreign key reference to centers table';
COMMENT ON COLUMN supervisors.name IS 'Full name of the supervisor';
COMMENT ON COLUMN supervisors.phone_number IS 'Phone number of the supervisor';
COMMENT ON COLUMN supervisors.is_active IS 'Whether the supervisor is currently active';
COMMENT ON COLUMN supervisors.created_at IS 'Timestamp when the supervisor was added';
COMMENT ON COLUMN supervisors.updated_at IS 'Timestamp when the supervisor was last updated';

-- Add new slot packages (10 and 200 slots)
-- Only insert if they don't already exist
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
SELECT DISTINCT
    c.id as chapter_id,
    sp.id as slot_package_id,
    CONCAT('SPL_', LOWER(LEFT(COALESCE(c.name, 'chp'), 3)), '_', sp.slot_count, '_2025') as split_code,
    true as is_active
FROM chapters c
CROSS JOIN slot_packages sp 
WHERE sp.slot_count IN (10, 200)
AND NOT EXISTS (
    -- Avoid duplicates if this migration is run multiple times
    SELECT 1 FROM chapter_split_codes csc 
    WHERE csc.chapter_id = c.id 
    AND csc.slot_package_id = sp.id
);
