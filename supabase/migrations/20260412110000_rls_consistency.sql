-- RLS Consistency Migration
-- Replaces slow subquery patterns in tenant_images and shop-media/expense-receipts
-- storage policies with the cached get_my_tenant_id() function.
-- get_my_tenant_id() reads from app_users via auth_user_id — consistent with all
-- other RLS policies in the codebase.

-- ─── tenant_images table ─────────────────────────────────────────────────────
-- Drop all four old policies that use staff_profiles subquery

drop policy if exists "tenant_images_select" on public.tenant_images;
drop policy if exists "tenant_images_insert" on public.tenant_images;
drop policy if exists "tenant_images_update" on public.tenant_images;
drop policy if exists "tenant_images_delete" on public.tenant_images;

-- Recreate using get_my_tenant_id()

create policy "tenant_images_select"
  on public.tenant_images
  for select
  using (tenant_id = get_my_tenant_id());

create policy "tenant_images_insert"
  on public.tenant_images
  for insert
  with check (tenant_id = get_my_tenant_id());

create policy "tenant_images_update"
  on public.tenant_images
  for update
  using (tenant_id = get_my_tenant_id());

create policy "tenant_images_delete"
  on public.tenant_images
  for delete
  using (tenant_id = get_my_tenant_id());

-- Note: "tenant_images_public_select" (for select using (true)) remains unchanged.


-- ─── shop-media storage bucket ───────────────────────────────────────────────
-- Drop old policies that use staff_profiles.user_id subquery

drop policy if exists "shop_media_insert" on storage.objects;
drop policy if exists "shop_media_update" on storage.objects;
drop policy if exists "shop_media_delete" on storage.objects;

-- Recreate using get_my_tenant_id()

create policy "shop_media_insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'shop-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = get_my_tenant_id()::text
  );

create policy "shop_media_update"
  on storage.objects
  for update
  using (
    bucket_id = 'shop-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = get_my_tenant_id()::text
  );

create policy "shop_media_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'shop-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = get_my_tenant_id()::text
  );


-- ─── expense-receipts storage bucket ─────────────────────────────────────────
-- Previous fix (20260410130000) already switched to app_users.auth_user_id.
-- Now elevate to get_my_tenant_id() for consistency and caching benefit.

drop policy if exists expense_receipts_insert on storage.objects;
drop policy if exists expense_receipts_select on storage.objects;
drop policy if exists expense_receipts_update on storage.objects;
drop policy if exists expense_receipts_delete on storage.objects;

create policy expense_receipts_insert
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'expense-receipts'
    and (storage.foldername(name))[1] = get_my_tenant_id()::text
  );

create policy expense_receipts_select
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'expense-receipts'
    and (storage.foldername(name))[1] = get_my_tenant_id()::text
  );

create policy expense_receipts_update
  on storage.objects
  for update to authenticated
  using (
    bucket_id = 'expense-receipts'
    and (storage.foldername(name))[1] = get_my_tenant_id()::text
  );

create policy expense_receipts_delete
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'expense-receipts'
    and (storage.foldername(name))[1] = get_my_tenant_id()::text
  );
