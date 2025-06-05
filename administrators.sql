-- SQL file for administrator accounts
-- This file creates and populates the administrators table
-- The password field contains bcrypt hashed passwords

-- Drop table if it exists (optional)
DROP TABLE IF EXISTS administrators;

-- Create the administrators table
CREATE TABLE administrators (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,  -- Bcrypt hashed password
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default administrator
-- Default credentials:
--   username: admin
--   password: AdminPassword123!  (pre-hashed below)
INSERT INTO administrators (username, password, email) 
VALUES ('admin', '$2b$10$dQkuYZ.MZK9D1jYw0a2f5uku8Gbx5VgEBGm1.MS7X1qLEW9gjbSBu', 'admin@sprs.example.com');

-- Insert additional admin accounts as needed
INSERT INTO administrators (username, password, email)
VALUES ('supervisor', '$2b$10$MwEoFkRdbJHdFoUwZ2rD1.xYnvmUnNJGEXbSYc8uHFgGolYpu0y4S', 'supervisor@sprs.example.com');

-- Note: To use this table in the application:
-- 1. Update the auth.ts file to check against this table instead of env variables
-- 2. Update the admin login route to validate against this table
-- 3. Use a proper password hashing library like bcrypt to verify passwords
