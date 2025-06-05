-- PostgreSQL compatible import for chapters
-- Converted from MySQL wp_sprs_chapters dump
-- Auto-generated on: June 4, 2025

-- Begin transaction for data integrity
BEGIN;

-- Insert data into chapters table (matching your schema.ts structure)
INSERT INTO chapters (id, name, split_code, amount) VALUES
(1, 'asakioo', 'SPL_212fDk8bJI', 1750.00),
(13, 'Karu 1', 'SPL_212fDk8bJI', 1750.00),
(17, 'Doma', 'SPL_212fDk8bJI', 1750.00),
(21, 'Karu 2', 'SPL_212fDk8bJI', 1750.00),
(39, 'Mararaba Udege', 'SPL_212fDk8bJI', 1750.00),
(40, 'Masaka Ado', 'SPL_212fDk8bJI', 1750.00),
(54, 'Panda', 'SPL_212fDk8bJI', 1750.00),
(58, 'Akwanga', 'SPL_Ut4NsET6nR', 3000.00),
(65, 'Lafia A', 'SPL_212fDk8bJI', 1750.00),
(71, 'Shabu', 'SPL_yZnbNP17wZ', 3000.00),
(76, 'Lafia B', 'SPL_JHW1Efy9m5', 3000.00),
(91, 'Keffi', 'SPL_212fDk8bJI', 1750.00),
(96, 'Kokona', 'SPL_212fDk8bJI', 1750.00),
(113, 'Mararaba guruku', 'SPL_212fDk8bJI', 1750.00),
(115, 'Jenkwe', 'SPL_212fDk8bJI', 1750.00),
(127, 'Uke chapter', 'SPL_212fDk8bJI', 1750.00),
(128, 'Nasarawa Eggon', 'SPL_212fDk8bJI', 1750.00),
(132, 'awe', 'SPL_212fDk8bJI', 1750.00),
(133, 'Nas Poly', 'SPL_212fDk8bJI', 1750.00)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  split_code = EXCLUDED.split_code,
  amount = EXCLUDED.amount;

-- Update the sequence to the correct next value
SELECT setval('chapters_id_seq', 133, false);

-- Commit the transaction
COMMIT;

-- Display import summary
\echo 'Chapters data import completed successfully!'
\echo 'Total records processed: 19'
\echo 'Sequence updated to: 133'
