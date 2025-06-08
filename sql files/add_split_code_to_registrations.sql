-- Add split_code_used column to registrations table
-- This column will track which split code was used for each registration payment

ALTER TABLE registrations 
ADD COLUMN split_code_used TEXT;

-- Add a comment to the column for documentation
COMMENT ON COLUMN registrations.split_code_used IS 'Tracks which split code was used for this registration payment';

-- Optional: Create an index for better query performance when filtering by split code usage
CREATE INDEX idx_registrations_split_code_used ON registrations(split_code_used);

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'registrations' AND column_name = 'split_code_used';
