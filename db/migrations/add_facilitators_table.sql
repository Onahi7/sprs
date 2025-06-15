-- Migration: Add facilitators table
-- Date: 2025-06-15
-- Description: Add facilitators table to store chapter facilitators information

-- Create facilitators table
CREATE TABLE IF NOT EXISTS facilitators (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id),
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position IN (1, 2)),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facilitators_chapter_id ON facilitators(chapter_id);
CREATE INDEX IF NOT EXISTS idx_facilitators_position ON facilitators(position);
CREATE INDEX IF NOT EXISTS idx_facilitators_is_active ON facilitators(is_active);

-- Create unique constraint to ensure only one facilitator per position per chapter
CREATE UNIQUE INDEX IF NOT EXISTS idx_facilitators_chapter_position_unique 
ON facilitators(chapter_id, position) 
WHERE is_active = true;

-- Add comments for documentation
COMMENT ON TABLE facilitators IS 'Stores facilitators information for each chapter (max 2 per chapter)';
COMMENT ON COLUMN facilitators.chapter_id IS 'Foreign key reference to chapters table';
COMMENT ON COLUMN facilitators.name IS 'Full name of the facilitator';
COMMENT ON COLUMN facilitators.phone_number IS 'Phone number of the facilitator';
COMMENT ON COLUMN facilitators.position IS 'Position number (1 or 2) within the chapter';
COMMENT ON COLUMN facilitators.is_active IS 'Whether the facilitator is currently active';
COMMENT ON COLUMN facilitators.created_at IS 'Timestamp when the facilitator was added';
COMMENT ON COLUMN facilitators.updated_at IS 'Timestamp when the facilitator was last updated';
