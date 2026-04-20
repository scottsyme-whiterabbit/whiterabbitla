-- Logging table for edge function observability (metadata only, no PII)
create table if not exists public.edge_function_requests (
  id uuid primary key default gen_random_uuid(),
  function_name text not null,
  ip_hash text,
  auth_result text not null,
  status_code integer not null,
  path text,
  query_summary text,
  duration_ms integer,
  created_at timestamp with time zone default now()
);

create index if not exists idx_edge_fn_req_created on public.edge_function_requests(created_at desc);
create index if not exists idx_edge_fn_req_fn on public.edge_function_requests(function_name, created_at desc);

-- Enable RLS — service role bypass means only the functions (and admin) can read/write
alter table public.edge_function_requests enable row level security;

create policy "Service role only edge_function_requests"
  on public.edge_function_requests
  for all
  to service_role
  using (true)
  with check (true);

-- Daily cleanup: delete rows older than 60 days
-- Requires pg_cron + pg_net (already enabled in this project)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('edge-function-requests-cleanup')
      where exists (select 1 from cron.job where jobname = 'edge-function-requests-cleanup');

    perform cron.schedule(
      'edge-function-requests-cleanup',
      '0 4 * * *',
      $cron$
        delete from public.edge_function_requests
        where created_at < now() - interval '60 days';
      $cron$
    );
  end if;
end$$;