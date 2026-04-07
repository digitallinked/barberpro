-- Public customer reviews for shops (web-customer facing)
create table public.shop_reviews (
  id           uuid        primary key default gen_random_uuid(),
  tenant_id    uuid        not null references public.tenants(id) on delete cascade,
  reviewer_name text       not null check (char_length(reviewer_name) between 1 and 100),
  rating       smallint    not null check (rating between 1 and 5),
  comment      text        check (comment is null or char_length(comment) <= 1000),
  created_at   timestamptz not null default now()
);

alter table public.shop_reviews enable row level security;

-- Anyone can read published reviews
create policy "shop_reviews_public_read"
  on public.shop_reviews for select
  using (true);

-- No direct client insert — all inserts go through the API route with admin client
-- (prevents tenant_id spoofing)

create index idx_shop_reviews_tenant_created
  on public.shop_reviews(tenant_id, created_at desc);
