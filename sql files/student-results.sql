-- Create student_results table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_results_registration ON student_results(registration_id);
CREATE INDEX IF NOT EXISTS idx_student_results_subject ON student_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_results_entered_by ON student_results(entered_by);
CREATE INDEX IF NOT EXISTS idx_student_results_score ON student_results(score);
CREATE INDEX IF NOT EXISTS idx_student_results_grade ON student_results(grade);

-- Create unique constraint to prevent duplicate results for same student and subject
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_results_unique 
ON student_results(registration_id, subject_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_results_updated_at 
    BEFORE UPDATE ON student_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
