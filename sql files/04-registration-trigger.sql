-- ======================================================================
-- REGISTRATION TRIGGER
-- Run these SQL statements one by one in your Neon console
-- ======================================================================

-- 4. Create trigger for slot deduction on registration
CREATE TRIGGER trigger_deduct_coordinator_slots_after_registration
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION deduct_coordinator_slots_after_registration();
