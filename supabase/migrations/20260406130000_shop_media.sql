-- Shop media: logo_url on tenants + tenant_images table for carousel images.
-- Images are stored in the public 'shop-media' Supabase Storage bucket.
-- Path convention: <tenant_id>/logo/<filename>  and  <tenant_id>/images/<filename>

-- 1. Add logo_url to tenants
alter table public.tenants
  add column if not exists logo_url text;

-- 2. Create tenant_images table
create table if not exists public.tenant_images (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  storage_path  text not null,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists tenant_images_tenant_id_idx on public.tenant_images(tenant_id, sort_order);

-- 3. RLS for tenant_images
alter table public.tenant_images enable row level security;

-- Tenant staff can read their own images
create policy "tenant_images_select" on public.tenant_images
  for select using (
    tenant_id in (
      select tenant_id from public.staff_profiles where user_id = auth.uid()
    )
  );

-- Tenant staff can insert images for their tenant
create policy "tenant_images_insert" on public.tenant_images
  for insert with check (
    tenant_id in (
      select tenant_id from public.staff_profiles where user_id = auth.uid()
    )
  );

-- Tenant staff can update sort_order for their tenant
create policy "tenant_images_update" on public.tenant_images
  for update using (
    tenant_id in (
      select tenant_id from public.staff_profiles where user_id = auth.uid()
    )
  );

-- Tenant staff can delete their own images
create policy "tenant_images_delete" on public.tenant_images
  for delete using (
    tenant_id in (
      select tenant_id from public.staff_profiles where user_id = auth.uid()
    )
  );

-- 4. Public read for tenant_images (customers browsing shops need to see images)
create policy "tenant_images_public_select" on public.tenant_images
  for select using (true);

-- 5. Storage bucket for shop media (public read)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-media',
  'shop-media',
  true,
  5242880, -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- 6. Storage RLS: only authenticated tenant owners/staff can upload under their tenant_id prefix
create policy "shop_media_insert" on storage.objects
  for insert with check (
    bucket_id = 'shop-media'
    and auth.role() = 'authenticated'
    -- path starts with the user's tenant_id
    and (storage.foldername(name))[1] in (
      select tenant_id::text from public.staff_profiles where user_id = auth.uid()
    )
  );

create policy "shop_media_update" on storage.objects
  for update using (
    bucket_id = 'shop-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select tenant_id::text from public.staff_profiles where user_id = auth.uid()
    )
  );

create policy "shop_media_delete" on storage.objects
  for delete using (
    bucket_id = 'shop-media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] in (
      select tenant_id::text from public.staff_profiles where user_id = auth.uid()
    )
  );

-- Public read for shop-media (customers can view shop images)
create policy "shop_media_public_read" on storage.objects
  for select using (bucket_id = 'shop-media');
