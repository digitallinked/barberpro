-- Add setup_wizard_completed column to track post-registration wizard state
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS setup_wizard_completed boolean NOT NULL DEFAULT false;

-- Existing tenants that have already completed onboarding are considered
-- wizard-complete so they are not redirected to the new wizard on next login
UPDATE public.tenants
SET setup_wizard_completed = true
WHERE onboarding_completed = true;
