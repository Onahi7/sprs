-- PostgreSQL compatible import for centers
-- Converted from MySQL wp_sprs_centers dump
-- Auto-generated on: June 4, 2025

-- Begin transaction for data integrity
BEGIN;

-- Insert center data with conflict resolution
INSERT INTO centers (id, chapter_id, name) VALUES
(1, 1, 'akwanga'),
(3, 58, 'ST. PETER''S NURSERY/PRIMARY SCHOOL AKW.'),
(132, 13, 'Zanang Victory Centre'),
(133, 13, 'Wisdom College Centre'),
(134, 13, 'Hope givers Academy Centre'),
(135, 13, 'Rhema Centre'),
(136, 13, 'Most High Academy Centre'),
(137, 13, 'Innovative Centre'),
(138, 13, 'Goodness Academy Centre'),
(139, 13, 'Gold divine Centre'),
(140, 13, 'Child worth International School Centre'),
(141, 13, 'Channel of blessings Centre'),
(142, 13, 'Brooklyn Center'),
(143, 13, 'Babcecil Centre'),
(144, 58, 'Mc Pherson Centre'),
(145, 58, 'Alpha Omega Centre'),
(146, 58, 'Solid Foundation Centre'),
(147, 58, 'St Peter School Centre'),
(148, 58, 'Summit Children School Centre'),
(149, 58, 'Good Way School Centre'),
(150, 58, 'De-Ultimate Glory Academy Centre'),
(152, 17, 'Super International Centre'),
(153, 17, 'Olokpa Centre'),
(154, 17, 'Bethany Center'),
(155, 17, 'Al-isan Centre'),
(156, 17, 'Al-hikma College Centre'),
(157, 115, 'Centre A'),
(158, 115, 'Centre B'),
(159, 21, 'Victory kids Centre'),
(160, 21, 'Vanarealgrace land Centre'),
(161, 21, 'Uwansankay Centre'),
(162, 21, 'St. Augustine Centre'),
(163, 21, 'La-Union International School Centre'),
(164, 21, 'Krispat International Centre'),
(165, 21, 'Intimacy Centre'),
(166, 21, 'Gifted and Talented Centre'),
(167, 21, 'Francol Royal Academy Centre'),
(168, 21, 'First kingdom kids Centre'),
(169, 21, 'Fanabel School Centre'),
(170, 21, 'Busy Brain Center'),
(171, 91, 'Azuba Model International School Centre'),
(172, 91, 'Victory Baptist Centre'),
(173, 91, 'Ecwa High School Centre'),
(174, 91, 'Al-mutaz Centre'),
(175, 91, 'Delight International School Centre'),
(176, 91, 'Danset Centre'),
(177, 91, 'Royal Star Model School Center'),
(178, 91, 'Lofty Height Center'),
(179, 91, 'Evergreen School Centre'),
(180, 96, 'Moroa School Centre'),
(181, 96, 'Kokona Centre'),
(182, 96, 'Basa International School Centre'),
(183, 96, 'Kofan gwari Centre'),
(184, 96, 'Old Barack Centre'),
(185, 65, 'Bethany School Centre'),
(186, 65, 'Destiny Best Centre'),
(187, 65, 'Lafia kapital Centre'),
(188, 65, 'Solutions Academy Centre'),
(189, 65, 'New Millennium Center'),
(190, 65, 'Oak Hills Center'),
(191, 76, 'Younik Academy Centre'),
(192, 76, 'Fulcrum International school Centre'),
(193, 76, 'Delight comprehensive city Centre'),
(194, 76, 'PTA - NADP Centre'),
(195, 76, 'Brain Field International School Centre'),
(196, 76, 'Hallmark kiddies School Centre'),
(197, 76, 'Evergreen Academy Centre'),
(198, 113, 'Miranda International School Centre'),
(199, 113, 'Lumen Christ Basic Science School Centre'),
(200, 113, 'Emmahecey Private school Centre'),
(201, 113, 'Great Grace Divine Centre'),
(202, 113, 'Victory Kids International School Centre'),
(203, 113, 'Destined Great kings Queens Centre'),
(204, 113, 'Skyrose International School Center'),
(205, 113, 'Young Professors School Centre'),
(206, 113, 'Havillah International Schools Centre'),
(207, 113, 'Haveli School Centre'),
(208, 113, 'Skylimit School Centre'),
(209, 113, 'Peace International schools Centre'),
(210, 113, 'Kabayi School Centre'),
(211, 113, 'Great Martins Model School Centre'),
(212, 113, 'Skycrest School Centre'),
(213, 113, 'Shining All Stars Academy Centre'),
(214, 113, 'Innovative Heritage Academy Centre'),
(215, 39, 'Kalid School Centre'),
(216, 39, 'Summit School Centre'),
(217, 40, 'Vimusa School Centre'),
(218, 40, 'Vawal International School Centre'),
(219, 40, 'Royal Envy Stars Center'),
(220, 40, 'Leadway Academy Centre'),
(221, 40, 'Jemrich golden Academy Centre'),
(222, 40, 'Gradams Faith Academy Centre'),
(223, 40, 'Gracious Academy Centre'),
(224, 40, 'Eagles Peak Global Centre'),
(225, 40, 'Bright Way Intl School Centre'),
(226, 40, 'Born to Reign Center'),
(227, 40, 'Bill Clinton Methesorin College Center'),
(228, 40, 'Achievers School Centre'),
(229, 40, 'D Mayors Citadel Intl Schools'),
(230, 40, 'Trust Academy Centre'),
(231, 128, 'Nasarawa Eggon Centre'),
(232, 128, 'Kephas Int''l Academy Centre'),
(233, 54, 'Sacred Heart School Centre'),
(234, 54, 'Panda Centre'),
(235, 54, 'Leading Foundation Centre'),
(236, 54, 'Bed Rock School Centre'),
(237, 71, 'Hope Academy Centre'),
(238, 71, 'Azuba Center'),
(239, 71, 'Deeper Life Center'),
(240, 71, 'Olive Heights Centre'),
(241, 71, 'Shabu Doka Sankikilo Centre'),
(242, 127, 'Lookotiye ward Centre'),
(243, 127, 'Shamaki ward Centre'),
(244, 127, 'Papaladna Ward Centre'),
(245, 127, 'Karshi Ward Centre'),
(246, 127, 'Lower Uke Ward Centre'),
(247, 127, 'Jeje Ward Centre'),
(248, 127, 'Gora Ward Centre'),
(249, 127, 'Barracks Ward Centre'),
(250, 127, 'Upper Uke Centre'),
(251, 127, 'Bus Stop Centre'),
(252, 127, 'Gidan Zakara Centre')
ON CONFLICT (id) DO UPDATE SET
  chapter_id = EXCLUDED.chapter_id,
  name = EXCLUDED.name;

-- Update the sequence to the correct next value
SELECT setval('centers_id_seq', 252, false);

-- Commit the transaction
COMMIT;

-- Display import summary
\echo 'Centers data import completed successfully!'
\echo 'Total records processed: 93'
\echo 'Sequence updated to: 252'
