-- =============================================
-- SEED DATA FOR COMMERCE CLASH
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. ROLES
INSERT INTO roles (id, name, created_at) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'admin', NOW()),
  ('a2222222-2222-2222-2222-222222222222', 'teacher', NOW()),
  ('a3333333-3333-3333-3333-333333333333', 'student', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. ATTRIBUTES (Skills)
INSERT INTO attributes (id, name, value, created_at, updated_at) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'Marketing', 0, NOW(), NOW()),
  ('b2222222-2222-2222-2222-222222222222', 'Finance', 0, NOW(), NOW()),
  ('b3333333-3333-3333-3333-333333333333', 'Operations', 0, NOW(), NOW()),
  ('b4444444-4444-4444-4444-444444444444', 'Leadership', 0, NOW(), NOW()),
  ('b5555555-5555-5555-5555-555555555555', 'Innovation', 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. PERK TYPES
INSERT INTO perk_types (id, type, created_at, updated_at) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'passive', NOW(), NOW()),
  ('c2222222-2222-2222-2222-222222222222', 'active', NOW(), NOW()),
  ('c3333333-3333-3333-3333-333333333333', 'ultimate', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. ARCHTYPES (CEO Characters)
INSERT INTO archtypes (id, title, sub_title, description, difficulty, playstyle, risk, influence, growth, created_at) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Baron', 'The Risk Taker', 'High risk, high reward playstyle. Masters of aggressive market moves.', 3, 'aggressive', 5, 3, 4, NOW()),
  ('d2222222-2222-2222-2222-222222222222', 'Tycoon', 'The Empire Builder', 'Steady growth and compounding gains. Patient wealth accumulation.', 2, 'balanced', 3, 4, 5, NOW()),
  ('d3333333-3333-3333-3333-333333333333', 'Diplomat', 'The Negotiator', 'Focus on influence and strategic sabotage. Master of corporate politics.', 2, 'strategic', 2, 5, 3, NOW()),
  ('d4444444-4444-4444-4444-444444444444', 'Visionary', 'The Innovator', 'Trendsetter and trailblazer. Creates new market opportunities.', 3, 'creative', 4, 4, 4, NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. PERKS (Skills for each Archtype)

-- Baron Perks
INSERT INTO perks (id, key, title, description, is_coded, is_repeatable, auto_approve, archtype_id, perk_type, created_at) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'double_down', 'Double Down', 'Double your gains on the next skill increase. High risk, high reward.', true, true, true, 'd1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e1111111-1111-1111-1111-111111111112', 'wipeout', 'Wipeout', 'Reset all active rivals market advantages. Ultimate power move.', true, false, false, 'd1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', NOW()),
  ('e1111111-1111-1111-1111-111111111113', 'corporate_empire', 'Corporate Empire', 'Build your corporate empire for lasting benefits.', true, false, true, 'd1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e1111111-1111-1111-1111-111111111114', 'danger_zone', 'Danger Zone', 'Permanently give up 2 of your own skill points to steal 2 Market Share from a rival. One-time use only.', true, false, false, 'd1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e1111111-1111-1111-1111-111111111115', 'fan_the_flames', 'Fan the Flames', 'If you would lose Market Share to another perk, redirect that loss to a player of your choice within a short window.', true, true, false, 'd1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT (id) DO NOTHING;

-- Tycoon Perks
INSERT INTO perks (id, key, title, description, is_coded, is_repeatable, auto_approve, archtype_id, perk_type, created_at) VALUES
  ('e2222222-2222-2222-2222-222222222221', 'compounding_gains', 'Compounding Gains', 'Your gains multiply over time. Patience is rewarded.', true, true, true, 'd2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', NOW()),
  ('e2222222-2222-2222-2222-222222222222', 'strategic_rebirth', 'Strategic Rebirth', 'Reset and rebuild stronger. Transform setbacks into comebacks.', true, false, true, 'd2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e2222222-2222-2222-2222-222222222223', 'spotlight', 'Spotlight', 'When you score Elite on a task, gain +1 skill point to spend freely. Triggers automatically.', true, true, false, 'd2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', NOW()),
  ('e2222222-2222-2222-2222-222222222224', 'blueprint', 'Blueprint', 'Add +1 skill point directly to your strongest pillar.', true, false, false, 'd2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e2222222-2222-2222-2222-222222222225', 'masterpiece', 'Masterpiece', 'When you max out a pillar, automatically gain +1 skill point to your pool.', true, true, false, 'd2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', NOW()),
  ('e2222222-2222-2222-2222-222222222226', 'rebirth', 'Rebirth', 'Move 2 skill points after the scenario is revealed. Triggers automatically.', true, true, false, 'd2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT (id) DO NOTHING;

-- Diplomat Perks
INSERT INTO perks (id, key, title, description, is_coded, is_repeatable, auto_approve, archtype_id, perk_type, created_at) VALUES
  ('e3333333-3333-3333-3333-333333333331', 'sabotage', 'Sabotage', 'Sabotage a rival competitor. Reduce their skill points.', true, false, false, 'd3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e3333333-3333-3333-3333-333333333332', 'corporate_espionage', 'Corporate Espionage', 'Spy on rivals to gain strategic advantage.', true, false, false, 'd3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e3333333-3333-3333-3333-333333333333', 'rallying_cry', 'Rallying Cry', 'Boost team morale and performance.', true, false, false, 'd3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e3333333-3333-3333-3333-333333333334', 'star_power', 'Star Power', 'When you score Elite on a task, steal 1 MS from a rival you choose afterward. Triggers automatically.', true, true, false, 'd3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT (id) DO NOTHING;

-- Visionary Perks
INSERT INTO perks (id, key, title, description, is_coded, is_repeatable, auto_approve, archtype_id, perk_type, created_at) VALUES
  ('e4444444-4444-4444-4444-444444444441', 'moment_of_glory', 'Moment of Glory', 'Boost XP gains temporarily. Seize your moment.', true, false, false, 'd4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e4444444-4444-4444-4444-444444444442', 'trendsetter', 'Trendsetter', 'Set the market trend. Others must follow or fall behind.', true, false, false, 'd4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e4444444-4444-4444-4444-444444444443', 'trailblazer', 'Trailblazer', 'Lead the way into new territory. First mover advantage.', true, false, false, 'd4444444-4444-4444-4444-444444444444', 'c2222222-2222-2222-2222-222222222222', NOW()),
  ('e4444444-4444-4444-4444-444444444444', 'revered_icon', 'Revered Icon', 'Become an industry icon. Ultimate influence power.', true, false, false, 'd4444444-4444-4444-4444-444444444444', 'c3333333-3333-3333-3333-333333333333', NOW()),
  ('e4444444-4444-4444-4444-444444444445', 'prophecy', 'Prophecy', 'Predict the next scenario type. If correct, gain +1 skill point. Triggers automatically at the start of the scenario phase.', true, true, false, 'd4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', NOW()),
  ('e4444444-4444-4444-4444-444444444446', 'crystal_ball', 'Crystal Ball', 'Permanently view the upcoming scenario type. A popup reveals it at the start of the invest phase.', true, true, false, 'd4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- VERIFY DATA
-- =============================================
SELECT 'Roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'Attributes', COUNT(*) FROM attributes
UNION ALL
SELECT 'Perk Types', COUNT(*) FROM perk_types
UNION ALL
SELECT 'Archtypes', COUNT(*) FROM archtypes
UNION ALL
SELECT 'Perks', COUNT(*) FROM perks;
