-- New CEO perks are requested by students and approved by the instructor.
UPDATE perks SET auto_approve = false
WHERE key IN ('afterburner', 'danger_zone', 'spotlight', 'star_power', 'prophecy',
  'crystal_ball', 'blueprint', 'masterpiece', 'rebirth', 'fan_the_flames',
  'insider_trading', 'extortion');

-- Old reactive instances were system-approved, not instructor-approved.
UPDATE student_perks sp SET is_approved = false, perk_status = NULL
FROM perks p WHERE sp.perk_id = p.id AND p.key IN
  ('spotlight', 'star_power', 'prophecy', 'crystal_ball', 'masterpiece',
   'rebirth', 'insider_trading', 'extortion');

-- Reactive perks now participate in normal level unlock and request flows.
INSERT INTO student_perks (enrollment_id, perk_id, is_unlocked, is_used, is_approved)
SELECT e.id, p.id,
  COALESCE(e.level, 1) >= CASE WHEN LOWER(pt.type) = 'ultra' THEN 5 ELSE 3 END,
  false, false
FROM enrolled_students e JOIN perks p ON p.archtype_id = e.archtype_id
JOIN perk_types pt ON pt.id = p.perk_type
WHERE e.is_cancelled IS DISTINCT FROM true AND p.key IN
  ('afterburner', 'danger_zone', 'spotlight', 'star_power', 'prophecy',
   'crystal_ball', 'blueprint', 'masterpiece', 'rebirth', 'fan_the_flames',
   'insider_trading', 'extortion')
ON CONFLICT (enrollment_id, perk_id) DO NOTHING;

UPDATE student_perks sp SET is_unlocked =
  COALESCE(e.level, 1) >= CASE WHEN LOWER(pt.type) = 'ultra' THEN 5 ELSE 3 END
FROM enrolled_students e, perks p, perk_types pt
WHERE sp.enrollment_id = e.id AND sp.perk_id = p.id AND p.perk_type = pt.id
AND p.key IN ('afterburner', 'danger_zone', 'spotlight', 'star_power', 'prophecy',
  'crystal_ball', 'blueprint', 'masterpiece', 'rebirth', 'fan_the_flames',
  'insider_trading', 'extortion');
