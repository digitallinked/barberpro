-- Admin platform tables: audit logs, platform settings, blog posts, announcements

-- ============================================================
-- 1. Admin Audit Logs
-- ============================================================
create table if not exists public.admin_audit_logs (
  id           uuid primary key default gen_random_uuid(),
  action       text not null,
  actor_email  text not null,
  actor_role   text not null,
  target_type  text,
  target_id    text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

alter table public.admin_audit_logs enable row level security;

-- Only service-role (admin client) can read/write
create policy "admin_audit_logs_service_only" on public.admin_audit_logs
  as restrictive
  to authenticated
  using (false);

create index if not exists idx_admin_audit_logs_created_at on public.admin_audit_logs (created_at desc);
create index if not exists idx_admin_audit_logs_actor on public.admin_audit_logs (actor_email);
create index if not exists idx_admin_audit_logs_action on public.admin_audit_logs (action);

-- ============================================================
-- 2. Platform Settings
-- ============================================================
create table if not exists public.platform_settings (
  key           text primary key,
  value         text not null,
  description   text,
  updated_by    text,
  updated_at    timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

create policy "platform_settings_service_only" on public.platform_settings
  as restrictive
  to authenticated
  using (false);

-- Seed default settings
insert into public.platform_settings (key, value, description) values
  ('platform_name', 'BarberPro', 'Display name of the platform'),
  ('support_email', 'support@barberpro.my', 'Primary support contact email'),
  ('maintenance_mode', 'false', 'When true, shows maintenance page to non-admin users'),
  ('new_registrations_enabled', 'true', 'Allow new barber shops to register'),
  ('trial_days', '14', 'Number of trial days for new tenants')
on conflict (key) do nothing;

-- ============================================================
-- 3. Blog Posts
-- ============================================================
create table if not exists public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  excerpt          text,
  content          text not null default '',
  cover_image_url  text,
  status           text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  author_email     text,
  author_name      text,
  tags             text[] not null default '{}',
  reading_time_minutes integer,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Public can read published posts
create policy "blog_posts_public_read" on public.blog_posts
  for select
  using (status = 'published');

-- Service role manages all
create policy "blog_posts_service_write" on public.blog_posts
  as restrictive
  to authenticated
  using (false)
  with check (false);

create index if not exists idx_blog_posts_status on public.blog_posts (status);
create index if not exists idx_blog_posts_published_at on public.blog_posts (published_at desc);
create index if not exists idx_blog_posts_tags on public.blog_posts using gin (tags);

-- Full-text search
alter table public.blog_posts add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored;

create index if not exists idx_blog_posts_search on public.blog_posts using gin (search_vector);

-- ============================================================
-- 4. Announcements
-- ============================================================
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  message     text not null,
  type        text not null default 'info' check (type in ('info', 'warning', 'critical')),
  target      text not null default 'all',
  sent_by     text,
  sent_at     timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

alter table public.announcements enable row level security;

create policy "announcements_service_only" on public.announcements
  as restrictive
  to authenticated
  using (false);

create index if not exists idx_announcements_sent_at on public.announcements (sent_at desc);
