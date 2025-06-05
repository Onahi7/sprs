-- Master import script for all NAPPS Nasarawa State data
-- Auto-generated on: June 4, 2025
-- Run this script to import all data in the correct order

-- Start timing the import
\timing on

-- Display start message
\echo '============================================'
\echo 'NAPPS Nasarawa State Data Import Starting'
\echo '============================================'
\echo ''

-- Import in dependency order (chapters first, then dependent tables)

\echo 'Step 1/5: Importing chapters data...'
\i chapters.sql

\echo ''
\echo 'Step 2/5: Importing schools data...'
\i schools.sql

\echo ''
\echo 'Step 3/5: Importing centers data...'
\i centers.sql

\echo ''
\echo 'Step 4/5: Importing coordinators data...'
\i coordinators.sql

\echo ''
\echo 'Step 5/5: Importing registrations data...'
\i registrations.sql

\echo ''
\echo '============================================'
\echo 'NAPPS Nasarawa State Data Import Complete!'
\echo '============================================'

-- Display final statistics
SELECT 
  'chapters' as table_name, 
  COUNT(*) as record_count 
FROM chapters
UNION ALL
SELECT 
  'schools' as table_name, 
  COUNT(*) as record_count 
FROM schools
UNION ALL
SELECT 
  'centers' as table_name, 
  COUNT(*) as record_count 
FROM centers
UNION ALL
SELECT 
  'chapter_coordinators' as table_name, 
  COUNT(*) as record_count 
FROM chapter_coordinators
UNION ALL
SELECT 
  'registrations' as table_name, 
  COUNT(*) as record_count 
FROM registrations
ORDER BY table_name;

\echo ''
\echo 'Import completed successfully!'
