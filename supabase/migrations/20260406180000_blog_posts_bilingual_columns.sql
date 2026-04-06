-- Bilingual blog: Malay fields (nullable; fallback to English when empty)
-- Rebuild search_vector to index EN + MS text together

drop index if exists public.idx_blog_posts_search;

alter table public.blog_posts drop column if exists search_vector;

alter table public.blog_posts
  add column if not exists title_ms text,
  add column if not exists excerpt_ms text,
  add column if not exists content_ms text;

alter table public.blog_posts add column search_vector tsvector generated always as (
  setweight(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(title_ms, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(excerpt, '') || ' ' || coalesce(excerpt_ms, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(content, '') || ' ' || coalesce(content_ms, '')), 'C')
) stored;

create index if not exists idx_blog_posts_search on public.blog_posts using gin (search_vector);
