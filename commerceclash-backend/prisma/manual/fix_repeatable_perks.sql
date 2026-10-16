-- Fix: set is_repeatable = true for double_down and compounding_gains
-- These perks are designed to be used every round, not just once.

UPDATE perks SET is_repeatable = true WHERE key = 'double_down';
UPDATE perks SET is_repeatable = true WHERE key = 'compounding_gains';
