-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    max_score INTEGER NOT NULL DEFAULT 100,
    min_score INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default subjects (Mathematics, English, General Studies)
INSERT INTO subjects (name, code, max_score, min_score) VALUES
('Mathematics', 'MATH', 100, 0),
('English Language', 'ENG', 100, 0),
('General Studies', 'GS', 100, 0)
ON CONFLICT (code) DO NOTHING;

-- Create index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);
