-- Fix schools sequence to start from 937
-- This script sets the schools ID sequence to start from 937

-- ========================================
-- STEP 1: ANALYZE CURRENT STATE
-- ========================================

SELECT '=== SCHOOLS SEQUENCE ANALYSIS ===' as analysis;

-- Check schools table current state
SELECT 
    'SCHOOLS ANALYSIS' as table_name,
    COUNT(*) as total_records,
    COALESCE(MIN(id), 0) as min_id,
    COALESCE(MAX(id), 0) as max_id
FROM schools;

-- Check current sequence value
SELECT 
    'CURRENT SEQUENCE' as info,
    last_value as current_sequence_value,
    is_called
FROM schools_id_seq;

-- ========================================
-- STEP 2: SET SEQUENCE TO START FROM 937
-- ========================================

SELECT '=== SETTING SCHOOLS SEQUENCE TO 937 ===' as action;

DO $$
DECLARE
    max_id integer;
    target_sequence integer := 937;
    current_seq integer;
BEGIN
    -- Get current max ID
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM schools;
    SELECT last_value INTO current_seq FROM schools_id_seq;
    
    RAISE NOTICE 'Current max school ID: %', max_id;
    RAISE NOTICE 'Current sequence value: %', current_seq;
    RAISE NOTICE 'Target sequence value: %', target_sequence;
    
    -- Ensure we don't conflict with existing records
    IF max_id >= target_sequence THEN
        target_sequence := max_id + 1;
        RAISE NOTICE 'Adjusting target to % to avoid conflicts', target_sequence;
    END IF;
    
    -- Set sequence to target value
    PERFORM setval('schools_id_seq', target_sequence, false);
    
    RAISE NOTICE '✅ Set schools sequence to %', target_sequence;
    
    -- Verify the change
    SELECT last_value INTO current_seq FROM schools_id_seq;
    RAISE NOTICE '✅ Verification: New sequence value is %', current_seq;
END $$;

-- ========================================
-- STEP 3: FINAL VERIFICATION
-- ========================================

SELECT '=== FINAL VERIFICATION ===' as analysis;

-- Show final state
SELECT 
    'FINAL STATE' as status,
    COUNT(*) as total_schools,
    COALESCE(MAX(id), 0) as max_school_id,
    (SELECT last_value FROM schools_id_seq) as next_sequence_value,
    ((SELECT last_value FROM schools_id_seq) - COALESCE(MAX(id), 0)) as safety_gap
FROM schools;

-- Test that the next insert will use the correct ID
SELECT 
    'NEXT INSERT PREVIEW' as info,
    nextval('schools_id_seq') as next_id;

-- Reset sequence position (since we just consumed one value for testing)
SELECT setval('schools_id_seq', (SELECT last_value FROM schools_id_seq) - 1, true);

SELECT '=== SCHOOLS SEQUENCE READY - NEXT INSERT WILL USE ID >= 937 ===' as result;
