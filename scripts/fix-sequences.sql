-- SAFE PostgreSQL sequence analysis and fix
-- This script first analyzes the current state before making any changes

-- ========================================
-- STEP 1: ANALYZE CURRENT STATE
-- ========================================

SELECT '=== CURRENT STATE ANALYSIS ===' as analysis;

-- Check registrations table specifically (since that's where the error occurred)
SELECT 
    'REGISTRATIONS ANALYSIS' as table_name,
    COUNT(*) as total_records,
    MIN(id) as min_id,
    MAX(id) as max_id,
    currval('registrations_id_seq') as current_seq_value
FROM registrations;

-- Check if there are any records with coordinator registration
SELECT 
    'COORDINATOR REGISTRATIONS' as info,
    COUNT(*) as count,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM registrations 
WHERE registration_type = 'coordinator';

-- Check slot usage history that might reference these registrations
SELECT 
    'SLOT USAGE REFERENCES' as info,
    COUNT(*) as count,
    MIN(registration_id) as min_reg_id,
    MAX(registration_id) as max_reg_id
FROM slot_usage_history 
WHERE registration_id IS NOT NULL;

-- ========================================
-- STEP 2: CHECK ALL SEQUENCES VS MAX IDs
-- ========================================

SELECT '=== SEQUENCE VS MAX ID COMPARISON ===' as analysis;

-- Function to safely check sequences (handles cases where sequence might not exist)
DO $$
DECLARE
    seq_exists boolean;
    table_max_id integer;
    seq_current_val integer;
BEGIN
    -- Check registrations
    SELECT EXISTS (
        SELECT 1 FROM information_schema.sequences 
        WHERE sequence_name = 'registrations_id_seq'
    ) INTO seq_exists;
    
    IF seq_exists THEN
        SELECT COALESCE(MAX(id), 0) INTO table_max_id FROM registrations;
        SELECT last_value INTO seq_current_val FROM registrations_id_seq;
        
        RAISE NOTICE 'REGISTRATIONS: Max ID = %, Current Sequence = %, Gap = %', 
            table_max_id, seq_current_val, (table_max_id - seq_current_val);
            
        IF table_max_id >= seq_current_val THEN
            RAISE NOTICE '⚠️  REGISTRATIONS SEQUENCE NEEDS FIXING!';
        ELSE
            RAISE NOTICE '✅ REGISTRATIONS SEQUENCE IS OK';
        END IF;
    END IF;
END $$;

-- ========================================
-- STEP 3: SAFE SEQUENCE FIX (ONLY IF NEEDED)
-- ========================================

SELECT '=== APPLYING SAFE FIXES ===' as analysis;

-- Only fix registrations sequence (the problematic one)
-- This preserves all existing data and relationships
DO $$
DECLARE
    max_id integer;
    current_seq integer;
    new_seq_value integer;
BEGIN
    -- Get current state
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM registrations;
    SELECT last_value INTO current_seq FROM registrations_id_seq;
    
    IF max_id >= current_seq THEN
        new_seq_value := max_id + 1;
        
        -- Set sequence to next safe value
        PERFORM setval('registrations_id_seq', new_seq_value, false);
        
        RAISE NOTICE '✅ Fixed registrations sequence: Set to % (was %)', new_seq_value, current_seq;
        
        -- Verify the fix
        SELECT last_value INTO current_seq FROM registrations_id_seq;
        RAISE NOTICE '✅ Verification: New sequence value is %', current_seq;
    ELSE
        RAISE NOTICE '✅ Registrations sequence already correct (Max ID: %, Seq: %)', max_id, current_seq;
    END IF;
END $$;

-- ========================================
-- STEP 4: FINAL VERIFICATION
-- ========================================

SELECT '=== FINAL VERIFICATION ===' as analysis;

-- Show final state
SELECT 
    'FINAL STATE' as status,
    COUNT(*) as total_registrations,
    MAX(id) as max_registration_id,
    currval('registrations_id_seq') as next_sequence_value,
    (currval('registrations_id_seq') - MAX(id)) as safety_gap
FROM registrations;

SELECT '=== READY FOR NEW COORDINATOR REGISTRATIONS ===' as result;
