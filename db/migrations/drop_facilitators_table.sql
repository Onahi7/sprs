-- Migration: Drop facilitators table and migrate to supervisors
-- Date: 2025-06-16
-- Description: Remove the old facilitators table since we've migrated to supervisors system

-- Drop facilitators table and all related indexes/constraints
DROP TABLE IF EXISTS facilitators CASCADE;

-- Drop any remaining indexes that might exist
DROP INDEX IF EXISTS idx_facilitators_chapter_id;
DROP INDEX IF EXISTS idx_facilitators_position;
DROP INDEX IF EXISTS idx_facilitators_is_active;
DROP INDEX IF EXISTS idx_facilitators_chapter_position_unique;

-- Note: The supervisors table should already exist from the add_supervisors_table.sql migration
-- If not, run that migration first before running this one.
