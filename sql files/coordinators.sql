-- PostgreSQL compatible import for coordinators
-- Converted from MySQL dump (structure based on schema)
-- Auto-generated on: June 4, 2025

-- Begin transaction for data integrity
BEGIN;

-- Insert coordinator data with conflict resolution
-- Note: Coordinator data provided in the attachments
INSERT INTO chapter_coordinators (id, chapter_id, name, email, unique_code) VALUES
(4, 58, 'Oga Oludu Joy', 'nappsakwanga@gmail.com', 'IUSTFYWJ'),
(5, 71, 'Chukwurah Ifeanyi', 'nappsshabu@gmail.com', '076SJVE2'),
(6, 76, 'Mrs. Ima-Abasi Ekanem Brown', 'lafianappsb@gmail.com', 'NFAZ0LNB'),
(7, 132, 'PST. Peter Benjamin', 'nappsawechapter@gmail.com', 'P4TSH9U9'),
(10, 17, 'hardy', 'hardytechabuja@gmail.com', 'W4JP8XIP'),
(1, 1, 'Sample Coordinator', 'coordinator@example.com', 'COORD001')
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  unique_code = EXCLUDED.unique_code;

-- Update the sequence to the correct next value
SELECT setval('chapter_coordinators_id_seq', 10, false);

-- Commit the transaction
COMMIT;

-- Display import summary
\echo 'Coordinators data import completed successfully!'
\echo 'Total records processed: 6'
\echo 'Sequence updated to: 10'
