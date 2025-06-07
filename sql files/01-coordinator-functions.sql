-- ======================================================================
-- COORDINATOR SLOTS FUNCTIONS AND TRIGGERS
-- Run these SQL statements one by one in your Neon console
-- ======================================================================

-- 1. Create function to update coordinator slots after purchase
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
