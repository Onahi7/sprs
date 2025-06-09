-- Quick fix to set registrations sequence to start from 143
-- This ensures new registrations start from ID 143 onwards

-- Set the registrations sequence to 143
SELECT setval('registrations_id_seq', 143, false);

-- Verify the change
SELECT 
    'Registrations sequence updated' as status,
    currval('registrations_id_seq') as next_id_will_be;

-- Show some context about existing registrations
SELECT 
    'Current registrations info' as info,
    COUNT(*) as total_count,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM registrations;

SELECT '✅ Ready for new coordinator registrations starting from ID 143' as result;
