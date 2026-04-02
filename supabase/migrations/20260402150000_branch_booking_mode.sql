-- Add booking mode columns to branches
-- accepts_online_bookings: whether the branch accepts online appointment bookings
-- accepts_walkin_queue:    whether the branch accepts walk-in queue check-ins

ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS accepts_online_bookings boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS accepts_walkin_queue    boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.branches.accepts_online_bookings IS
  'When false, the branch does not accept new online appointment bookings from customers.';

COMMENT ON COLUMN public.branches.accepts_walkin_queue IS
  'When false, the branch does not accept new walk-in queue check-ins (QR scan or web).';
