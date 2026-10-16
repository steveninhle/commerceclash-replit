-- =============================================
-- SEED DATA: NEW CEOs (Maverick / Showman / Oracle / Architect / Phoenix / Shadow)
-- Run this in Supabase SQL Editor. Requires the existing perk_types rows (CORE / ULTRA)
-- referenced below to already exist in the database.
-- Safe to re-run: every insert uses ON CONFLICT (id) DO NOTHING.
-- =============================================
-- 1. NEW ARCHTYPES (CEO Characters)
-- NOTE: difficulty/playstyle/risk/influence/growth below are inferred from each
-- CEO's theme (dev notes only described perk mechanics, not these stats) — tune as needed.
INSERT INTO archtypes (id, title, sub_title, description, difficulty, playstyle, risk, influence, growth, created_at) VALUES
  ('48d8c328-3cd1-4ccc-a2e3-411edad5ce98', 'Maverick', 'Need for Speed', 'Fast, reckless plays that trade stability for a quick edge.', 3, 'aggressive', 5, 2, 3, NOW()),
  ('4d08d325-5b43-43f3-a2f8-b216fe145029', 'Showman', 'Born for the Stage', 'Rewards flair — landing an Elite performance pays off immediately.', 2, 'performance', 3, 4, 3, NOW()),
  ('ce3edf0b-5b53-419c-a000-c6d72f5fd052', 'Oracle', 'The Hand of Fate', 'Wins by reading the game ahead, betting on foresight over force.', 3, 'predictive', 2, 3, 3, NOW()),
  ('50346191-706e-48ab-a4a1-b085ebd7e593', 'Architect', 'Building Legacies', 'Methodical, compounding investment in a strong foundation.', 2, 'methodical', 2, 3, 5, NOW()),
  ('ea862952-ead4-409c-b36e-047569d505c9', 'Phoenix', 'Beautifully Resilient', 'Turns setbacks into comebacks by redistributing losses and points.', 3, 'resilient', 3, 3, 4, NOW()),
  ('5e452e17-489b-41d5-a8ab-492fa27f37e0', 'Shadow', 'The Eye of Control', 'Plays with hidden information and takes what it needs from rivals.', 4, 'stealthy', 4, 4, 2, NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. NEW PERKS (Skills for each new Archtype)
-- NOTE: perk_type/is_repeatable/auto_approve inferred from mechanics by analogy with
-- existing perks in seed.sql (e.g. perks that steal from/target another player ->
-- auto_approve=false; "Ultra"-style one-shot perks -> perk_type=ULTRA, is_repeatable=false).
-- perk_type ids: 25418f80-... = CORE, f97a15e4-... = ULTRA (existing perk_types rows).

-- Maverick Perks
INSERT INTO perks (id, key, title, description, is_coded, is_repeatable, auto_approve, archtype_id, perk_type, created_at) VALUES
  ('6be3c80b-87d5-4802-abed-dcc4a648dd8c', 'afterburner', 'Afterburner', 'Add +2 temporary skill points for 1 scenario. These disappear after class.', true, true, false, '48d8c328-3cd1-4ccc-a2e3-411edad5ce98', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW()),
  ('e7771f29-d99d-49c9-915f-d1a4b1367dfa', 'danger_zone', 'Danger Zone', 'Remove 2 of your own skill points permanently to steal 2 MS from a chosen rival. Can only be used once.', true, false, false, '48d8c328-3cd1-4ccc-a2e3-411edad5ce98', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW())
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_coded = EXCLUDED.is_coded,
  is_repeatable = EXCLUDED.is_repeatable,
  auto_approve = EXCLUDED.auto_approve,
  archtype_id = EXCLUDED.archtype_id,
  perk_type = EXCLUDED.perk_type;

-- Showman Perks
INSERT INTO perks (id, key, title, description, is_coded, is_repeatable, auto_approve, archtype_id, perk_type, created_at) VALUES
  ('cb261027-785c-460d-b7f7-a40fc62fa284', 'spotlight', 'Spotlight', 'When you score Elite on a task, gain +1 skill point (you choose where to assign it).', true, true, false, '4d08d325-5b43-43f3-a2f8-b216fe145029', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW()),
  ('2fb0b35d-b07c-4b10-81d3-03def7dc8e62', 'star_power', 'Star Power', 'When you score Elite on a task, steal 1 MS from a chosen rival.', true, true, false, '4d08d325-5b43-43f3-a2f8-b216fe145029', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW())
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_coded = EXCLUDED.is_coded,
  is_repeatable = EXCLUDED.is_repeatable,
  auto_approve = EXCLUDED.auto_approve,
  archtype_id = EXCLUDED.archtype_id,
  perk_type = EXCLUDED.perk_type;

-- Oracle Perks
INSERT INTO perks (id, key, title, description, is_coded, is_repeatable, auto_approve, archtype_id, perk_type, created_at) VALUES
  ('170a50eb-af0f-4c61-9203-62f6922494ff', 'prophecy', 'Prophecy', 'Predict the next scenario type at the start of the Scenario Phase. If correct, gain +1 skill point.', true, true, false, 'ce3edf0b-5b53-419c-a000-c6d72f5fd052', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW()),
  ('d6502ae9-7c9b-43d5-97a7-23dc05e60aaf', 'crystal_ball', 'Crystal Ball', 'Permanently view the upcoming scenario type during the Invest Phase.', true, true, false, 'ce3edf0b-5b53-419c-a000-c6d72f5fd052', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW())
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_coded = EXCLUDED.is_coded,
  is_repeatable = EXCLUDED.is_repeatable,
  auto_approve = EXCLUDED.auto_approve,
  archtype_id = EXCLUDED.archtype_id,
  perk_type = EXCLUDED.perk_type;

-- Architect Perks
INSERT INTO perks (id, key, title, description, is_coded, is_repeatable, auto_approve, archtype_id, perk_type, created_at) VALUES
  ('532aeb36-ac39-423a-9fc6-922dc3e955bc', 'blueprint', 'Blueprint', 'Add +1 skill point to your strongest pillar.', true, true, false, '50346191-706e-48ab-a4a1-b085ebd7e593', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW()),
  ('944a2466-fc9c-46cc-a035-4c74e0fbff58', 'masterpiece', 'Masterpiece', 'When you max out a pillar, automatically gain +1 skill point.', true, true, false, '50346191-706e-48ab-a4a1-b085ebd7e593', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW())
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_coded = EXCLUDED.is_coded,
  is_repeatable = EXCLUDED.is_repeatable,
  auto_approve = EXCLUDED.auto_approve,
  archtype_id = EXCLUDED.archtype_id,
  perk_type = EXCLUDED.perk_type;

-- Phoenix Perks
INSERT INTO perks (id, key, title, description, is_coded, is_repeatable, auto_approve, archtype_id, perk_type, created_at) VALUES
  ('896ee8fc-f6db-4dc4-bff5-b9be4f90002c', 'rebirth', 'Rebirth', 'Move 2 skill points after the scenario reveal.', true, true, false, 'ea862952-ead4-409c-b36e-047569d505c9', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW()),
  ('d4cfa90a-6e4c-4a03-bf84-887c4c77989f', 'fan_the_flames', 'Fan the Flames', 'Transfer an MS loss you would take onto another chosen player instead.', true, true, false, 'ea862952-ead4-409c-b36e-047569d505c9', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW())
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_coded = EXCLUDED.is_coded,
  is_repeatable = EXCLUDED.is_repeatable,
  auto_approve = EXCLUDED.auto_approve,
  archtype_id = EXCLUDED.archtype_id,
  perk_type = EXCLUDED.perk_type;

-- Shadow Perks
INSERT INTO perks (id, key, title, description, is_coded, is_repeatable, auto_approve, archtype_id, perk_type, created_at) VALUES
  ('30ab834e-05fa-4e38-8aa1-6c679312eef0', 'insider_trading', 'Insider Trading', 'Preview the next scenario type during the Invest Phase.', true, true, false, '5e452e17-489b-41d5-a8ab-492fa27f37e0', '25418f80-bc1c-468a-bfb5-de967bb66a11', NOW()),
  ('d52b7b3d-1fd8-4dba-8750-be6226c023c0', 'extortion', 'Extortion', 'Steal 2 skill points from a chosen rival for 1 scenario.', true, false, false, '5e452e17-489b-41d5-a8ab-492fa27f37e0', 'f97a15e4-dfc7-47d5-9847-fd40338c4747', NOW())
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_coded = EXCLUDED.is_coded,
  is_repeatable = EXCLUDED.is_repeatable,
  auto_approve = EXCLUDED.auto_approve,
  archtype_id = EXCLUDED.archtype_id,
  perk_type = EXCLUDED.perk_type;

-- =============================================
-- VERIFY DATA
-- =============================================
SELECT 'New Archtypes' as table_name, COUNT(*) as count FROM archtypes WHERE title IN ('Maverick', 'Showman', 'Oracle', 'Architect', 'Phoenix', 'Shadow')
UNION ALL
SELECT 'New Perks', COUNT(*) FROM perks WHERE key IN ('afterburner', 'danger_zone', 'spotlight', 'star_power', 'prophecy', 'crystal_ball', 'blueprint', 'masterpiece', 'rebirth', 'fan_the_flames', 'insider_trading', 'extortion');
