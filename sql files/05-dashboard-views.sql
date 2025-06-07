-- ======================================================================
-- COORDINATOR DASHBOARD VIEWS
-- Run these SQL statements one by one in your Neon console
-- ======================================================================

-- 5. Create view for coordinator dashboard stats
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
