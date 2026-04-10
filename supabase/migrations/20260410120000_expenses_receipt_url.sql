-- Add receipt_url to expenses for storing uploaded receipt photos.
-- Storage path convention:
--   <tenant_id>/expenses/<expense_id>/<filename>

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS receipt_url text;

-- Create expense-receipts storage bucket (private, accessed via signed URL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-receipts',
  'expense-receipts',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for expense-receipts bucket
-- Authenticated staff of the tenant can upload
CREATE POLICY "expense_receipts_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.staff_profiles WHERE user_id = auth.uid()
    )
  );

-- Authenticated staff of the tenant can read
CREATE POLICY "expense_receipts_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.staff_profiles WHERE user_id = auth.uid()
    )
  );

-- Authenticated staff of the tenant can update (replace)
CREATE POLICY "expense_receipts_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.staff_profiles WHERE user_id = auth.uid()
    )
  );

-- Authenticated staff of the tenant can delete
CREATE POLICY "expense_receipts_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.staff_profiles WHERE user_id = auth.uid()
    )
  );
