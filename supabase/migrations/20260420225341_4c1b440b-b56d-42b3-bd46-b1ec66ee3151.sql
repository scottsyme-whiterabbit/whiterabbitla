create table if not exists public.stats_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  payload jsonb not null,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null
);

create index if not exists idx_stats_cache_key on public.stats_cache(cache_key);
create index if not exists idx_stats_cache_expires on public.stats_cache(expires_at);

alter table public.stats_cache enable row level security;

create policy "Service role only stats_cache"
  on public.stats_cache
  for all
  to service_role
  using (true)
  with check (true);