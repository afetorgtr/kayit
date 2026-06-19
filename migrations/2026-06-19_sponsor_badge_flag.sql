-- Migration: add the "lanyard sponsor" flag to sponsors.
-- Run once in the Supabase SQL editor for this project.
--
-- A single sponsor (chosen from the existing "Destekleyenler" list) is marked as the
-- badge / lanyard sponsor and rendered bottom-left on the printed participant badge.
-- The application enforces the "single badge sponsor" rule (it unsets any previous one
-- before setting a new one), so no unique constraint is required here.

ALTER TABLE sponsors
  ADD COLUMN IF NOT EXISTS is_badge_sponsor BOOLEAN NOT NULL DEFAULT false;

-- Fast lookup of the active badge sponsor.
CREATE INDEX IF NOT EXISTS sponsors_is_badge_sponsor_idx
  ON sponsors (is_badge_sponsor)
  WHERE is_badge_sponsor = true;
