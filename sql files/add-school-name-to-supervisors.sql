-- Migration: Add school_name column to supervisors table
-- Date: 2025-06-26
-- Description: Add school_name field to allow supervisors to specify their school

-- Add the school_name column to the supervisors table
ALTER TABLE supervisors 
ADD COLUMN school_name TEXT;

-- Add a comment to document the new column
COMMENT ON COLUMN supervisors.school_name IS 'Name of the school the supervisor represents';

-- Optional: Create an index on school_name for performance if needed
-- CREATE INDEX idx_supervisors_school_name ON supervisors(school_name);
