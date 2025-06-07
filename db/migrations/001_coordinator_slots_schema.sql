-- Step 1: Coordinator Slot System Database Schema
-- Migration script to add slot management tables

-- 1. Add current_slots column to chapter_coordinators table
ALTER TABLE chapter_coordinators 
ADD COLUMN current_slots INTEGER DEFAULT 0,
ADD COLUMN total_slots_purchased INTEGER DEFAULT 0,
ADD COLUMN password_hash TEXT,
ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN last_login TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Create slot_packages table (defines available slot packages)
CREATE TABLE slot_packages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL, -- '50 Slots', '100 Slots'
  slot_count INTEGER NOT NULL, -- 50 or 100
  price DECIMAL(10, 2) NOT NULL, -- Price in Naira
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create chapter_split_codes table (Paystack split codes per chapter)
CREATE TABLE chapter_split_codes (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  slot_package_id INTEGER REFERENCES slot_packages(id) ON DELETE CASCADE,
  split_code TEXT NOT NULL, -- Paystack split code
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(chapter_id, slot_package_id)
);

-- 4. Create slot_purchases table (tracks all slot purchases)
CREATE TABLE slot_purchases (
  id SERIAL PRIMARY KEY,
  coordinator_id INTEGER REFERENCES chapter_coordinators(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  slot_package_id INTEGER REFERENCES slot_packages(id) ON DELETE CASCADE,
  slots_purchased INTEGER NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_reference TEXT UNIQUE NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  paystack_reference TEXT,
  split_code_used TEXT,
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create coordinator_slots table (tracks current slot balances)
CREATE TABLE coordinator_slots (
  id SERIAL PRIMARY KEY,
  coordinator_id INTEGER REFERENCES chapter_coordinators(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  available_slots INTEGER DEFAULT 0,
  used_slots INTEGER DEFAULT 0,
  total_purchased_slots INTEGER DEFAULT 0,
  last_purchase_date TIMESTAMP,
  last_usage_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(coordinator_id, chapter_id)
);

-- 6. Create slot_usage_history table (tracks slot usage for registrations)
CREATE TABLE slot_usage_history (
  id SERIAL PRIMARY KEY,
  coordinator_id INTEGER REFERENCES chapter_coordinators(id) ON DELETE CASCADE,
  registration_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
  slots_used INTEGER DEFAULT 1,
  usage_type TEXT DEFAULT 'registration' CHECK (usage_type IN ('registration', 'bulk_registration', 'adjustment')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Add coordinator_registered_by column to registrations table
ALTER TABLE registrations 
ADD COLUMN coordinator_registered_by INTEGER REFERENCES chapter_coordinators(id),
ADD COLUMN registration_type TEXT DEFAULT 'public' CHECK (registration_type IN ('public', 'coordinator')),
ADD COLUMN registration_slip_downloaded BOOLEAN DEFAULT FALSE,
ADD COLUMN registration_slip_download_count INTEGER DEFAULT 0;

-- Insert default slot packages
INSERT INTO slot_packages (name, slot_count, price, description) VALUES
('50 Student Slots', 50, 15000.00, 'Register up to 50 students directly from your coordinator portal'),
('100 Student Slots', 100, 28000.00, 'Register up to 100 students directly from your coordinator portal');

-- Insert sample split codes for each chapter and package combination
-- Note: These are sample codes - replace with actual Paystack split codes
INSERT INTO chapter_split_codes (chapter_id, slot_package_id, split_code) VALUES
-- Keffi chapter split codes
(1, 1, 'SPL_kef_50_2025'), -- 50 slots for Keffi
(1, 2, 'SPL_kef_100_2025'), -- 100 slots for Keffi
-- Lafia chapter split codes
(2, 1, 'SPL_laf_50_2025'), -- 50 slots for Lafia
(2, 2, 'SPL_laf_100_2025'), -- 100 slots for Lafia
-- Akwanga chapter split codes
(3, 1, 'SPL_akw_50_2025'), -- 50 slots for Akwanga
(3, 2, 'SPL_akw_100_2025'), -- 100 slots for Akwanga
-- Nasarawa chapter split codes
(4, 1, 'SPL_nas_50_2025'), -- 50 slots for Nasarawa
(4, 2, 'SPL_nas_100_2025'), -- 100 slots for Nasarawa
-- Doma chapter split codes
(5, 1, 'SPL_dom_50_2025'), -- 50 slots for Doma
(5, 2, 'SPL_dom_100_2025'); -- 100 slots for Doma

-- Initialize coordinator_slots for existing coordinators
INSERT INTO coordinator_slots (coordinator_id, chapter_id, available_slots, used_slots, total_purchased_slots)
SELECT 
  cc.id as coordinator_id,
  cc.chapter_id,
  0 as available_slots,
  0 as used_slots,
  0 as total_purchased_slots
FROM chapter_coordinators cc;

-- Create indexes for better performance
CREATE INDEX idx_slot_purchases_coordinator_id ON slot_purchases(coordinator_id);
CREATE INDEX idx_slot_purchases_payment_status ON slot_purchases(payment_status);
CREATE INDEX idx_slot_purchases_payment_reference ON slot_purchases(payment_reference);
CREATE INDEX idx_coordinator_slots_coordinator_id ON coordinator_slots(coordinator_id);
CREATE INDEX idx_slot_usage_history_coordinator_id ON slot_usage_history(coordinator_id);
CREATE INDEX idx_slot_usage_history_registration_id ON slot_usage_history(registration_id);
CREATE INDEX idx_chapter_split_codes_chapter_id ON chapter_split_codes(chapter_id);
CREATE INDEX idx_registrations_coordinator_registered_by ON registrations(coordinator_registered_by);
CREATE INDEX idx_registrations_registration_type ON registrations(registration_type);

-- Create function to update coordinator slots after purchase
CREATE OR REPLACE FUNCTION update_coordinator_slots_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if payment is completed
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    -- Update coordinator_slots table
    INSERT INTO coordinator_slots (coordinator_id, chapter_id, available_slots, total_purchased_slots, last_purchase_date)
    VALUES (NEW.coordinator_id, NEW.chapter_id, NEW.slots_purchased, NEW.slots_purchased, NEW.payment_verified_at)
    ON CONFLICT (coordinator_id, chapter_id)
    DO UPDATE SET
      available_slots = coordinator_slots.available_slots + NEW.slots_purchased,
      total_purchased_slots = coordinator_slots.total_purchased_slots + NEW.slots_purchased,
      last_purchase_date = NEW.payment_verified_at,
      updated_at = CURRENT_TIMESTAMP;
    
    -- Update chapter_coordinators table
    UPDATE chapter_coordinators 
    SET 
      current_slots = current_slots + NEW.slots_purchased,
      total_slots_purchased = total_slots_purchased + NEW.slots_purchased,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.coordinator_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for slot purchase updates
CREATE TRIGGER trigger_update_coordinator_slots_after_purchase
  AFTER UPDATE ON slot_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_coordinator_slots_after_purchase();

-- Create function to deduct slots after registration
CREATE OR REPLACE FUNCTION deduct_coordinator_slots_after_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if this is a coordinator registration
  IF NEW.coordinator_registered_by IS NOT NULL THEN
    -- Deduct slot from coordinator
    UPDATE coordinator_slots 
    SET 
      available_slots = available_slots - 1,
      used_slots = used_slots + 1,
      last_usage_date = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE coordinator_id = NEW.coordinator_registered_by 
      AND chapter_id = NEW.chapter_id;
    
    -- Update chapter_coordinators current_slots
    UPDATE chapter_coordinators 
    SET 
      current_slots = current_slots - 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.coordinator_registered_by;
    
    -- Record slot usage
    INSERT INTO slot_usage_history (coordinator_id, registration_id, slots_used, usage_type)
    VALUES (NEW.coordinator_registered_by, NEW.id, 1, 'registration');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for slot deduction on registration
CREATE TRIGGER trigger_deduct_coordinator_slots_after_registration
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION deduct_coordinator_slots_after_registration();

-- ======================================================================
-- HELPFUL VIEWS FOR COORDINATOR DASHBOARD
-- ======================================================================

-- Add helpful views for coordinator dashboard
CREATE VIEW coordinator_dashboard_stats AS
SELECT 
  cc.id as coordinator_id,
  cc.name as coordinator_name,
  cc.email,
  c.name as chapter_name,
  cs.available_slots,
  cs.used_slots,
  cs.total_purchased_slots,
  cs.last_purchase_date,
  cs.last_usage_date,
  COUNT(r.id) as total_registrations_made
FROM chapter_coordinators cc
JOIN chapters c ON cc.chapter_id = c.id
LEFT JOIN coordinator_slots cs ON cs.coordinator_id = cc.id
LEFT JOIN registrations r ON r.coordinator_registered_by = cc.id
WHERE cc.is_active = TRUE
GROUP BY cc.id, cc.name, cc.email, c.name, cs.available_slots, cs.used_slots, cs.total_purchased_slots, cs.last_purchase_date, cs.last_usage_date;

-- Add view for slot purchase history
CREATE VIEW coordinator_purchase_history AS
SELECT 
  sp.id,
  cc.name as coordinator_name,
  c.name as chapter_name,
  pkg.name as package_name,
  sp.slots_purchased,
  sp.amount_paid,
  sp.payment_status,
  sp.purchase_date,
  sp.payment_verified_at
FROM slot_purchases sp
JOIN chapter_coordinators cc ON sp.coordinator_id = cc.id
JOIN chapters c ON sp.chapter_id = c.id
JOIN slot_packages pkg ON sp.slot_package_id = pkg.id
ORDER BY sp.purchase_date DESC;
