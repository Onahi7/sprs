-- Database schema for NAPPS Nasarawa State Unified Exams 2025
-- Generated on May 8, 2025

-- Drop tables if they exist (use with caution in production!)
DROP TABLE IF EXISTS chapter_coordinators CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS centers CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Create chapters table
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  split_code TEXT,
  amount DECIMAL(10, 2) DEFAULT 3000.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create schools table
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create centers table
CREATE TABLE centers (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create registrations table
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  registration_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  chapter_id INTEGER REFERENCES chapters(id),
  school_id INTEGER REFERENCES schools(id),
  school_name TEXT,
  center_id INTEGER REFERENCES centers(id),
  parent_first_name TEXT NOT NULL,
  parent_last_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_consent BOOLEAN DEFAULT FALSE,
  passport_url TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed')),
  payment_reference TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chapter_coordinators table
CREATE TABLE chapter_coordinators (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  unique_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Create indexes for performance
CREATE INDEX idx_registrations_chapter_id ON registrations(chapter_id);
CREATE INDEX idx_registrations_school_id ON registrations(school_id);
CREATE INDEX idx_registrations_center_id ON registrations(center_id);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX idx_schools_chapter_id ON schools(chapter_id);
CREATE INDEX idx_centers_chapter_id ON centers(chapter_id);
CREATE INDEX idx_chapter_coordinators_chapter_id ON chapter_coordinators(chapter_id);

-- Insert default settings
INSERT INTO settings (key, value) VALUES ('registration_open', 'true');
INSERT INTO settings (key, value) VALUES ('exam_date', '2025-06-15');
INSERT INTO settings (key, value) VALUES ('registration_deadline', '2025-05-31');

-- Insert sample chapters
INSERT INTO chapters (name, split_code) VALUES 
('Keffi', 'KEF'),
('Lafia', 'LAF'),
('Akwanga', 'AKW'),
('Nasarawa', 'NAS'),
('Doma', 'DOM');

-- Insert sample centers for each chapter
INSERT INTO centers (chapter_id, name) VALUES 
-- Keffi centers
(1, 'Keffi Central School'),
(1, 'Keffi Secondary School Hall'),
(1, 'Keffi Township Stadium'),
-- Lafia centers
(2, 'Lafia Model Primary School'),
(2, 'Lafia Central Primary School'),
(2, 'Government College Lafia'),
-- Akwanga centers
(3, 'Akwanga Community Center'),
(3, 'GSS Akwanga'),
(3, 'Akwanga Local Government Hall'),
-- Nasarawa centers
(4, 'Nasarawa Township Stadium'),
(4, 'GSS Nasarawa'),
(4, 'Nasarawa Central Primary School'),
-- Doma centers
(5, 'Doma Local Government Secretariat'),
(5, 'Central Primary School Doma'),
(5, 'Community Secondary School Doma');

-- Insert sample schools for each chapter
INSERT INTO schools (chapter_id, name) VALUES
-- Keffi schools
(1, 'Godswill International School, Keffi'),
(1, 'Success Academy, Keffi'),
(1, 'Premier International School, Keffi'),
(1, 'Divine Light School, Keffi'),
(1, 'Bright Future College, Keffi'),
-- Lafia schools
(2, 'Gateway International School, Lafia'),
(2, 'Royal Academy, Lafia'),
(2, 'Excel Montessori School, Lafia'),
(2, 'Graceland College, Lafia'),
(2, 'Standard Bearers School, Lafia'),
-- Akwanga schools
(3, 'Cornerstone Academy, Akwanga'),
(3, 'Noble Heights School, Akwanga'),
(3, 'Destiny International School, Akwanga'),
(3, 'Good Shepherd School, Akwanga'),
(3, 'Emmanuel College, Akwanga'),
-- Nasarawa schools
(4, 'Peace International School, Nasarawa'),
(4, 'Victory College, Nasarawa'),
(4, 'Wisdom Gate Academy, Nasarawa'),
(4, 'Promise Land School, Nasarawa'),
(4, 'Great Minds International School, Nasarawa'),
-- Doma schools
(5, 'Hope Academy, Doma'),
(5, 'Kings and Queens School, Doma'),
(5, 'Faith International School, Doma'),
(5, 'Crown Heights College, Doma'),
(5, 'Liberty International School, Doma');

-- Insert sample chapter coordinators
INSERT INTO chapter_coordinators (chapter_id, name, email, unique_code) VALUES
(1, 'Mohammed Ibrahim', 'mohammed.ibrahim@napps.org', 'KEFCORD2025'),
(2, 'Rebecca Ojo', 'rebecca.ojo@napps.org', 'LAFCORD2025'),
(3, 'Daniel Akpan', 'daniel.akpan@napps.org', 'AKWCORD2025'),
(4, 'Fatima Suleiman', 'fatima.suleiman@napps.org', 'NASCORD2025'),
(5, 'Joseph Okonkwo', 'joseph.okonkwo@napps.org', 'DOMCORD2025');
