-- Migration: Add supervisors portal tables and PIN authentication
-- Date: 2025-06-26
-- Description: Add tables for supervisors portal with PIN login and attendance tracking

-- Add PIN column to existing supervisors table
ALTER TABLE supervisors 
ADD COLUMN pin TEXT,
ADD COLUMN last_login TIMESTAMP;

-- Create exam_sessions table
CREATE TABLE exam_sessions (
  id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(id),
  session_date TIMESTAMP NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  session_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create student_attendance table
CREATE TABLE student_attendance (
  id SERIAL PRIMARY KEY,
  registration_id INTEGER REFERENCES registrations(id),
  exam_session_id INTEGER REFERENCES exam_sessions(id),
  supervisor_id INTEGER REFERENCES supervisors(id),
  center_id INTEGER REFERENCES centers(id),
  attendance_status TEXT DEFAULT 'absent' CHECK (attendance_status IN ('present', 'absent', 'late', 'left_early')),
  arrival_time TIMESTAMP,
  departure_time TIMESTAMP,
  notes TEXT,
  marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create supervisor_sessions table
CREATE TABLE supervisor_sessions (
  id SERIAL PRIMARY KEY,
  supervisor_id INTEGER REFERENCES supervisors(id),
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_exam_sessions_subject_id ON exam_sessions(subject_id);
CREATE INDEX idx_exam_sessions_date ON exam_sessions(session_date);
CREATE INDEX idx_student_attendance_registration_id ON student_attendance(registration_id);
CREATE INDEX idx_student_attendance_exam_session_id ON student_attendance(exam_session_id);
CREATE INDEX idx_student_attendance_supervisor_id ON student_attendance(supervisor_id);
CREATE INDEX idx_student_attendance_center_id ON student_attendance(center_id);
CREATE INDEX idx_supervisor_sessions_supervisor_id ON supervisor_sessions(supervisor_id);
CREATE INDEX idx_supervisor_sessions_token ON supervisor_sessions(session_token);
CREATE INDEX idx_supervisors_phone_number ON supervisors(phone_number);

-- Add comments to document the new tables
COMMENT ON TABLE exam_sessions IS 'Scheduled exam sessions for different subjects';
COMMENT ON TABLE student_attendance IS 'Student attendance records per exam session';
COMMENT ON TABLE supervisor_sessions IS 'Supervisor login session management';
COMMENT ON COLUMN supervisors.pin IS '4-6 digit PIN for supervisor login';

-- Insert sample exam sessions (optional - for testing)
-- INSERT INTO exam_sessions (subject_id, session_date, start_time, end_time, session_name) VALUES 
-- (1, '2025-06-15 09:00:00', '09:00', '11:00', 'Mathematics - Morning Session'),
-- (2, '2025-06-15 13:00:00', '13:00', '15:00', 'English - Afternoon Session'),
-- (3, '2025-06-16 09:00:00', '09:00', '11:00', 'Science - Morning Session');
