-- Raise shop-media bucket limit to match app validation (20 MB).
-- Enables larger phone photos while staying under Supabase image transform source limits (~25 MB).

update storage.buckets
set file_size_limit = 20971520
where id = 'shop-media';
