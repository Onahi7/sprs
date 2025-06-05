-- Create result_entry_users table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_result_entry_users_username ON result_entry_users(username);
CREATE INDEX IF NOT EXISTS idx_result_entry_users_chapter ON result_entry_users(chapter_id);
CREATE INDEX IF NOT EXISTS idx_result_entry_users_active ON result_entry_users(is_active);
