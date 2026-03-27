-- Add preferred_language to tenants for per-shop language selection
-- Supports 'ms' (Bahasa Malaysia, default) and 'en' (English)

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'ms'
    CHECK (preferred_language IN ('ms', 'en'));
