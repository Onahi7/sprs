-- ======================================================================
-- SLOT DEDUCTION FUNCTION
-- Run these SQL statements one by one in your Neon console
-- ======================================================================

-- 3. Create function to deduct slots after registration
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
