-- Fix branch_images and shop-media storage RLS policies.
-- Previously all policies used staff_profiles for tenant lookup, which excludes
-- tenant owners (who are in app_users but not staff_profiles). Replace with
-- current_tenant_id() — the same function used by the branches table itself.

-- ── branch_images table ──────────────────────────────────────────────────────

DROP POLICY IF EXISTS "branch_images_insert" ON public.branch_images;
DROP POLICY IF EXISTS "branch_images_update" ON public.branch_images;
DROP POLICY IF EXISTS "branch_images_delete" ON public.branch_images;
DROP POLICY IF EXISTS "branch_images_select"  ON public.branch_images;

CREATE POLICY "branch_images_select" ON public.branch_images
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "branch_images_insert" ON public.branch_images
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "branch_images_update" ON public.branch_images
  FOR UPDATE USING (tenant_id = current_tenant_id());

CREATE POLICY "branch_images_delete" ON public.branch_images
  FOR DELETE USING (tenant_id = current_tenant_id());

-- ── shop-media storage bucket ────────────────────────────────────────────────

DROP POLICY IF EXISTS "shop_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "shop_media_update" ON storage.objects;
DROP POLICY IF EXISTS "shop_media_delete" ON storage.objects;

CREATE POLICY "shop_media_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'shop-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (current_tenant_id())::text
  );

CREATE POLICY "shop_media_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'shop-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (current_tenant_id())::text
  );

CREATE POLICY "shop_media_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'shop-media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (current_tenant_id())::text
  );
