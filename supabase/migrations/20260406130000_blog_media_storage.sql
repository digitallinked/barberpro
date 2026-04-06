-- Create blog-media storage bucket for admin blog images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-media',
  'blog-media',
  true,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Public read
create policy "blog_media_public_read" on storage.objects
  for select using (bucket_id = 'blog-media');

-- Service role / admin can insert
create policy "blog_media_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'blog-media');

-- Service role / admin can delete
create policy "blog_media_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'blog-media');

-- Service role / admin can update
create policy "blog_media_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'blog-media');
