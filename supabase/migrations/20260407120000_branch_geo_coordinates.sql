-- Add geographic coordinates to branches for distance-based search
ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS latitude  FLOAT8,
  ADD COLUMN IF NOT EXISTS longitude FLOAT8;
