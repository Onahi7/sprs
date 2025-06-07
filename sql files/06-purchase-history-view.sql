-- ======================================================================
-- PURCHASE HISTORY VIEW
-- Run these SQL statements one by one in your Neon console
-- ======================================================================

-- 6. Create view for coordinator purchase history
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
