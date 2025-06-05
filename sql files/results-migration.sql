-- Migration script to add result entry functionality
-- Run this after the basic tables (chapters, registrations, etc.) are created

-- 1. Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    max_score INTEGER NOT NULL DEFAULT 100,
    min_score INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create result_entry_users table
CREATE TABLE IF NOT EXISTS result_entry_users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    chapter_id INTEGER REFERENCES chapters(id),
    name TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create student_results table
CREATE TABLE IF NOT EXISTS student_results (
    id SERIAL PRIMARY KEY,
    registration_id INTEGER REFERENCES registrations(id),
    subject_id INTEGER REFERENCES subjects(id),
    score INTEGER NOT NULL,
    grade TEXT,
    entered_by INTEGER REFERENCES result_entry_users(id),
    entered_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Insert default subjects
INSERT INTO subjects (name, code, max_score, min_score) VALUES
('Mathematics', 'MATH', 100, 0),
('English Language', 'ENG', 100, 0),
('General Studies', 'GS', 100, 0)
ON CONFLICT (code) DO NOTHING;

-- 5. Create indexes for better performance

-- Subjects indexes
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);

-- Result entry users indexes
CREATE INDEX IF NOT EXISTS idx_result_entry_users_username ON result_entry_users(username);
CREATE INDEX IF NOT EXISTS idx_result_entry_users_chapter ON result_entry_users(chapter_id);
CREATE INDEX IF NOT EXISTS idx_result_entry_users_active ON result_entry_users(is_active);

-- Student results indexes
CREATE INDEX IF NOT EXISTS idx_student_results_registration ON student_results(registration_id);
CREATE INDEX IF NOT EXISTS idx_student_results_subject ON student_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_results_entered_by ON student_results(entered_by);
CREATE INDEX IF NOT EXISTS idx_student_results_score ON student_results(score);
CREATE INDEX IF NOT EXISTS idx_student_results_grade ON student_results(grade);

-- 6. Create unique constraint to prevent duplicate results
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_results_unique 
ON student_results(registration_id, subject_id);

-- 7. Create trigger function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger for student_results table
DROP TRIGGER IF EXISTS update_student_results_updated_at ON student_results;
CREATE TRIGGER update_student_results_updated_at 
    BEFORE UPDATE ON student_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON subjects TO your_app_user;
-- GRANT ALL PRIVILEGES ON result_entry_users TO your_app_user;
-- GRANT ALL PRIVILEGES ON student_results TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- 10. Add some sample result entry users (optional - remove passwords in production)
-- Note: These passwords should be hashed in a real application
-- INSERT INTO result_entry_users (username, password, chapter_id, name, email) VALUES
-- ('lagos_results', '$2b$10$samplehashedpassword1', 1, 'Lagos Results Officer', 'lagos@napps.org'),
-- ('abuja_results', '$2b$10$samplehashedpassword2', 2, 'Abuja Results Officer', 'abuja@napps.org')
-- ON CONFLICT (username) DO NOTHING;

-- Verification queries to check if tables were created successfully
SELECT 'subjects' as table_name, count(*) as record_count FROM subjects
UNION ALL
SELECT 'result_entry_users' as table_name, count(*) as record_count FROM result_entry_users  
UNION ALL
SELECT 'student_results' as table_name, count(*) as record_count FROM student_results;
