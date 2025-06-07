-- Fix slot_packages table by adding missing columns
-- This script adds the missing columns to the slot_packages table

-- First, check if the table exists and what columns it currently has
-- \d slot_packages;

-- Add missing columns to slot_packages table
ALTER TABLE slot_packages 
ADD COLUMN IF NOT EXISTS slot_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE slot_packages 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE slot_packages 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE slot_packages 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE slot_packages 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

ALTER TABLE slot_packages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update any existing records if needed
-- UPDATE slot_packages SET updated_at = NOW() WHERE updated_at IS NULL;

-- Verify the table structure after changes
-- \d slot_packages;

-- Insert some sample data if the table is empty
-- INSERT INTO slot_packages (name, slot_count, price, description, is_active) 
-- VALUES 
--   ('Basic Package', 5, 50.00, 'Basic slot package with 5 slots', true),
--   ('Standard Package', 10, 90.00, 'Standard slot package with 10 slots', true),
--   ('Premium Package', 20, 160.00, 'Premium slot package with 20 slots', true)
-- ON CONFLICT DO NOTHING;
