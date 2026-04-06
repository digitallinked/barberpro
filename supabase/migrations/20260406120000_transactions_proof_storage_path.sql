-- Add proof_storage_path to transactions for QR/DuitNow payment receipt photos.
-- The column stores the Supabase Storage object key within the payment-proofs bucket.
alter table public.transactions
  add column if not exists proof_storage_path text;
