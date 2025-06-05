-- Data validation script for NAPPS Nasarawa State database
-- Auto-generated on: June 4, 2025
-- Run this after importing data to verify integrity

\echo '============================================'
\echo 'NAPPS Data Validation Starting'
\echo '============================================'
\echo ''

-- Check for referential integrity issues
\echo 'Checking referential integrity...'

-- Schools without valid chapters
\echo '1. Schools with invalid chapter references:'
SELECT s.id, s.name, s.chapter_id 
FROM schools s 
LEFT JOIN chapters c ON s.chapter_id = c.id 
WHERE c.id IS NULL;

-- Centers without valid chapters
\echo ''
\echo '2. Centers with invalid chapter references:'
SELECT c.id, c.name, c.chapter_id 
FROM centers c 
LEFT JOIN chapters ch ON c.chapter_id = ch.id 
WHERE ch.id IS NULL;

-- Coordinators without valid chapters
\echo ''
\echo '3. Coordinators with invalid chapter references:'
SELECT cc.id, cc.name, cc.chapter_id 
FROM chapter_coordinators cc 
LEFT JOIN chapters c ON cc.chapter_id = c.id 
WHERE c.id IS NULL;

-- Registrations with invalid references
\echo ''
\echo '4. Registrations with invalid chapter references:'
SELECT r.id, r.registration_number, r.chapter_id 
FROM registrations r 
LEFT JOIN chapters c ON r.chapter_id = c.id 
WHERE c.id IS NULL
LIMIT 5;

\echo ''
\echo '5. Registrations with invalid school references:'
SELECT r.id, r.registration_number, r.school_id 
FROM registrations r 
LEFT JOIN schools s ON r.school_id = s.id 
WHERE s.id IS NULL
LIMIT 5;

\echo ''
\echo '6. Registrations with invalid center references:'
SELECT r.id, r.registration_number, r.center_id 
FROM registrations r 
LEFT JOIN centers c ON r.center_id = c.id 
WHERE c.id IS NULL
LIMIT 5;

-- Check for data quality issues
\echo ''
\echo 'Checking data quality...'

\echo ''
\echo '7. Empty or null school names:'
SELECT id, chapter_id, name 
FROM schools 
WHERE name IS NULL OR trim(name) = '';

\echo ''
\echo '8. Empty or null center names:'
SELECT id, chapter_id, name 
FROM centers 
WHERE name IS NULL OR trim(name) = '';

\echo ''
\echo '9. Duplicate registration numbers:'
SELECT registration_number, COUNT(*) as count 
FROM registrations 
GROUP BY registration_number 
HAVING COUNT(*) > 1;

\echo ''
\echo '10. Invalid email formats in coordinators:'
SELECT id, name, email 
FROM chapter_coordinators 
WHERE email NOT LIKE '%@%.%';

-- Summary statistics
\echo ''
\echo 'Summary Statistics:'
\echo '==================='

SELECT 
    'Total Chapters' as metric, 
    COUNT(*)::text as value 
FROM chapters
UNION ALL
SELECT 
    'Total Schools' as metric, 
    COUNT(*)::text as value 
FROM schools
UNION ALL
SELECT 
    'Total Centers' as metric, 
    COUNT(*)::text as value 
FROM centers
UNION ALL
SELECT 
    'Total Coordinators' as metric, 
    COUNT(*)::text as value 
FROM chapter_coordinators
UNION ALL
SELECT 
    'Total Registrations' as metric, 
    COUNT(*)::text as value 
FROM registrations
UNION ALL
SELECT 
    'Completed Payments' as metric, 
    COUNT(*)::text as value 
FROM registrations 
WHERE payment_status = 'completed'
UNION ALL
SELECT 
    'Pending Payments' as metric, 
    COUNT(*)::text as value 
FROM registrations 
WHERE payment_status = 'pending';

\echo ''
\echo '============================================'
\echo 'Data Validation Complete!'
\echo '============================================'
