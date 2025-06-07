-- ======================================================================
-- COORDINATOR SLOTS TRIGGERS
-- Run these SQL statements one by one in your Neon console
-- ======================================================================

-- 2. Create trigger for slot purchase updates
CREATE TRIGGER trigger_update_coordinator_slots_after_purchase
  AFTER UPDATE ON slot_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_coordinator_slots_after_purchase();
