-- ======================================================================
-- TRIGGER CLEANUP TO PREVENT DOUBLE/TRIPLE SLOT OPERATIONS
-- Run these SQL statements in your Neon console to fix slot conflicts
-- ======================================================================

-- ANALYSIS OF PROBLEMATIC TRIGGERS:
-- 1. trigger_deduct_coordinator_slots_after_registration 
--    ❌ CONFLICTS: Causes double slot deduction with useCoordinatorSlots()
-- 2. trigger_update_coordinator_slots_after_purchase 
--    ❌ CONFLICTS: Causes triple slot addition with webhook + query API

-- SAFE TRIGGERS (keep these):
-- - update_settings_updated_at (only updates timestamps)
-- - update_student_results_updated_at (only updates timestamps)

-- STEP 1: Remove registration trigger (causes double slot deduction)
DROP TRIGGER IF EXISTS trigger_deduct_coordinator_slots_after_registration ON registrations;
DROP FUNCTION IF EXISTS deduct_coordinator_slots_after_registration();

-- STEP 2: Remove purchase trigger (causes triple slot addition)
-- This trigger was causing your 50 slots to become 100+ slots
DROP TRIGGER IF EXISTS trigger_update_coordinator_slots_after_purchase ON slot_purchases;
DROP FUNCTION IF EXISTS update_coordinator_slots_after_purchase();

-- RESULT AFTER CLEANUP:
-- ✅ Slot deduction: Handled only by useCoordinatorSlots() with duplicate prevention
-- ✅ Slot addition: Handled only by webhook + query API with idempotent logic
-- ✅ No more double/triple operations
-- ✅ Proper error handling and logging in application code

-- Note: Your application logic already has robust duplicate prevention
-- and proper error handling, making these database triggers redundant.
