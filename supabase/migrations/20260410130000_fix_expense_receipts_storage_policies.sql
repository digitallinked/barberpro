-- Fix expense-receipts storage policies
-- Previous policies used staff_profiles.user_id which excluded owners (app_users only).
-- Now uses app_users.auth_user_id to cover owners, managers, and staff alike.

DROP POLICY IF EXISTS expense_receipts_insert ON storage.objects;
DROP POLICY IF EXISTS expense_receipts_select ON storage.objects;
DROP POLICY IF EXISTS expense_receipts_update ON storage.objects;
DROP POLICY IF EXISTS expense_receipts_delete ON storage.objects;

CREATE POLICY expense_receipts_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.app_users
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY expense_receipts_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.app_users
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY expense_receipts_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.app_users
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY expense_receipts_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT tenant_id::text FROM public.app_users
      WHERE auth_user_id = auth.uid() AND is_active = true
    )
  );
