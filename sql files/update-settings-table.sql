-- Update settings table to include timestamps and additional metadata
-- This script adds created_at and updated_at columns to the settings table if they don't exist

-- Add created_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE settings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE settings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add description column if it doesn't exist (for better settings management)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'description'
    ) THEN
        ALTER TABLE settings ADD COLUMN description TEXT;
    END IF;
END $$;

-- Add category column if it doesn't exist (to group settings)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'category'
    ) THEN
        ALTER TABLE settings ADD COLUMN category VARCHAR(50) DEFAULT 'general';
    END IF;
END $$;

-- Create trigger to update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings if they don't exist
INSERT INTO settings (key, value, category, description) VALUES
('app_name', 'NAPPS Nasarawa State Unified Exams', 'general', 'Application name displayed throughout the system'),
('app_short_name', 'NAPPS Nasarawa', 'general', 'Short application name'),
('maintenance_mode', 'false', 'general', 'Enable/disable maintenance mode'),
('registration_enabled', 'true', 'registration', 'Allow new registrations'),
('max_registrations_per_center', '100', 'registration', 'Maximum registrations allowed per center'),
('default_registration_fee', '3000', 'payment', 'Default registration fee in Naira'),
('paystack_test_mode', 'true', 'payment', 'Use Paystack test environment'),
('email_notifications_enabled', 'true', 'email', 'Enable automated email notifications'),
('coordinator_notifications', 'true', 'email', 'Send notifications to coordinators'),
('admin_email', 'admin@sprs.org', 'email', 'Primary admin email address'),
('support_email', 'support@sprs.org', 'email', 'Support contact email'),
('session_timeout', '86400', 'security', 'Session timeout in seconds (24 hours)'),
('password_min_length', '8', 'security', 'Minimum password length'),
('max_login_attempts', '5', 'security', 'Maximum failed login attempts before lockout'),
('backup_retention_days', '30', 'system', 'Days to retain database backups'),
('log_level', 'info', 'system', 'Application log level (error, warn, info, debug)')
ON CONFLICT (key) DO NOTHING;

-- Update existing settings to have categories if they don't
UPDATE settings SET category = 'general' WHERE category IS NULL;

-- Create index on category for better performance
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Create index on key for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Display current settings count
SELECT 
    category,
    COUNT(*) as setting_count
FROM settings 
GROUP BY category
ORDER BY category;

COMMIT;
