CREATE OR REPLACE FUNCTION public.system_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net', 'cron', 'pg_temp'
AS $function$
declare
  la_now    timestamptz := now();
  la_today  date        := (now() at time zone 'America/Los_Angeles')::date;
  la_dow    int         := extract(isodow from (now() at time zone 'America/Los_Angeles'));
  la_hour   int         := extract(hour from (now() at time zone 'America/Los_Angeles'));
  day_start timestamptz := (la_today::timestamp at time zone 'America/Los_Angeles');
  checks    jsonb := '[]'::jsonb;
  v_num numeric; v_ts timestamptz; v_int int; v_pending int;
  v_list text; v_ok boolean; v_err text;
  n_fail int := 0; n_warn int := 0;
begin
  -- 1. Gmail sync
  select max(d.last_gmail_sync_at) into v_ts from deals d;
  checks := checks || jsonb_build_object('key','gmail_sync','label','Gmail sync running',
    'status', case when v_ts is null or v_ts < la_now - interval '2 hours' then 'fail' else 'ok' end,
    'detail', coalesce('last sync ' || to_char(v_ts at time zone 'America/Los_Angeles','Mon DD HH24:MI'),'never synced'));

  -- 2. Calendar sync
  select max(d.last_calendar_sync_at) into v_ts from deals d;
  checks := checks || jsonb_build_object('key','calendar_sync','label','Calendar sync running',
    'status', case when v_ts is null or v_ts < la_now - interval '26 hours' then 'warn' else 'ok' end,
    'detail', coalesce('last matched event ' || to_char(v_ts at time zone 'America/Los_Angeles','Mon DD HH24:MI'),'never synced'));

  -- 3. Inbound email reaching the CRM
  select max(sent_at) into v_ts from deal_email_messages where direction = 'inbound';
  checks := checks || jsonb_build_object('key','inbound_flowing','label','Inbound email reaching CRM',
    'status', case when v_ts is null or v_ts < la_now - interval '7 days' then 'warn' else 'ok' end,
    'detail', coalesce('newest reply ' || to_char(v_ts at time zone 'America/Los_Angeles','Mon DD'),'none recorded'));

  -- 4. Cold drip
  select count(*) into v_int from cold_email_campaigns where last_email_sent_at >= day_start;
  checks := checks || jsonb_build_object('key','cold_drip','label','Cold drip sending',
    'status', case when la_dow not in (2,3,4) then 'ok'
                   when la_hour < 10 then 'ok'
                   when v_int = 0 then 'fail' else 'ok' end,
    'detail', case when la_dow not in (2,3,4) then 'not a send day'
                   when la_hour < 10 then 'runs at 9am, too early to judge'
                   else v_int || ' sent today' end);

  -- 5. Newsletter
  select count(*) into v_int from newsletter_send_log where sent_at >= day_start;
  select count(*) into v_pending from newsletter_campaigns c
   where c.status = 'draft'
     and exists (select 1 from newsletter_contacts nc
                 where nc.subscribed and nc.drip_campaign = 'planner-pulse'
                   and nc.id not in (select contact_id from newsletter_send_log l where l.campaign_id = c.id::text));
  checks := checks || jsonb_build_object('key','newsletter','label','Newsletter batch sending',
    'status', case when la_dow > 5 or v_pending = 0 then 'ok'
                   when la_hour < 11 then 'ok'
                   when v_int = 0 then 'fail' else 'ok' end,
    'detail', case when la_hour < 11 and la_dow <= 5 then 'runs at 10am, too early to judge'
                   else v_int || ' sent today, ' || v_pending || ' campaign(s) with recipients left' end);

  -- 6. Auth failures
  select count(*) into v_int from net._http_response
   where status_code = 401 and created >= la_now - interval '12 hours';
  checks := checks || jsonb_build_object('key','auth_failures','label','No scheduled job auth failures',
    'status', case when v_int > 0 then 'fail' else 'ok' end,
    'detail', v_int || ' unauthorized responses in last 12h');

  -- 7. Bounce rate
  select case when sends = 0 then 0 else round(100.0*bounces/sends,2) end into v_num from (
    select (select count(*) from cold_email_campaigns where last_email_sent_at >= la_now - interval '7 days')
         + (select count(*) from newsletter_send_log where sent_at >= la_now - interval '7 days') as sends,
           (select count(*) from email_bounces where created_at >= la_now - interval '7 days'
              and bounce_type in ('hard_bounce','soft_bounce','bounced','complained')) as bounces) t;
  checks := checks || jsonb_build_object('key','bounce_rate','label','Bounce rate under 5%',
    'status', case when v_num >= 5 then 'fail' when v_num >= 3 then 'warn' else 'ok' end,
    'detail', coalesce(v_num,0) || '% over trailing 7 days');

  -- 8. Hard bounces
  select count(*) into v_int from email_bounces
   where created_at >= la_now - interval '7 days' and bounce_type = 'hard_bounce';
  checks := checks || jsonb_build_object('key','hard_bounces','label','Hard bounces low',
    'status', case when v_int > 20 then 'fail' when v_int > 10 then 'warn' else 'ok' end,
    'detail', v_int || ' in 7 days');

  -- 9a. Required jobs missing (driven by scheduled_job_manifest)
  select string_agg(m.jobname, ', ' order by m.jobname) into v_list
    from scheduled_job_manifest m
   where m.required
     and not exists (select 1 from cron.job j where j.jobname = m.jobname and j.active);
  select count(*) into v_int from scheduled_job_manifest where required;
  checks := checks || jsonb_build_object('key','jobs_missing','label','Every required job is active',
    'status', case when v_list is not null then 'fail' else 'ok' end,
    'detail', coalesce('missing: ' || v_list, 'all ' || v_int || ' required jobs active'));

  -- 9b. Undeclared jobs
  select string_agg(j.jobname, ', ' order by j.jobname) into v_list
    from cron.job j
   where j.active and not exists (select 1 from scheduled_job_manifest m where m.jobname = j.jobname);
  checks := checks || jsonb_build_object('key','jobs_undeclared','label','No undeclared jobs running',
    'status', case when v_list is not null then 'warn' else 'ok' end,
    'detail', coalesce(v_list, 'none'));

  -- 9c. Schedule drift
  select string_agg(j.jobname || ' (expected ' || m.expected_schedule || ', running ' || j.schedule || ')', ', ' order by j.jobname) into v_list
    from cron.job j join scheduled_job_manifest m on m.jobname = j.jobname
   where j.active and j.schedule is distinct from m.expected_schedule;
  checks := checks || jsonb_build_object('key','jobs_schedule_drift','label','Schedules match the manifest',
    'status', case when v_list is not null then 'warn' else 'ok' end,
    'detail', coalesce(v_list, 'all match'));

  -- 9d. Required jobs actually firing
  begin
    with m as (
      select jobname, expected_schedule, added_at,
             regexp_split_to_array(btrim(expected_schedule), '\s+') as f
        from scheduled_job_manifest where required
    ), w as (
      select jobname, added_at,
        case
          when f[1] like '*/%' then interval '2 hours'
          when f[1] ~ '^[0-9]+$' and f[2] = '*' then interval '3 hours'
          when coalesce(f[5],'*') <> '*' then interval '9 days'
          else interval '36 hours'
        end as win
      from m
    ), last_ok as (
      select w.jobname, w.win, w.added_at,
        (select max(d.end_time) from cron.job_run_details d
           join cron.job j on j.jobid = d.jobid
          where j.jobname = w.jobname and d.status = 'succeeded') as last_success
        from w
    )
    select string_agg(jobname, ', ' order by jobname), count(*) into v_list, v_int
      from last_ok
     where la_now - added_at >= win
       and (last_success is null or last_success < la_now - win);
    select count(*) into v_pending from scheduled_job_manifest where required;
    checks := checks || jsonb_build_object('key','jobs_running','label','Required jobs actually firing',
      'status', case when v_list is not null then 'fail' else 'ok' end,
      'detail', coalesce('stale: ' || v_list, 'all ' || v_pending || ' firing'));
  exception when others then
    checks := checks || jsonb_build_object('key','jobs_running','label','Required jobs actually firing',
      'status','warn','detail','run history unavailable');
  end;

  -- 10. Castle invites
  select count(*) into v_pending from cold_email_campaigns
   where campaign_track = 'castle_invite_la' and castle_invite_status is null;
  select max(created_at) into v_ts from castle_invite_log;
  checks := checks || jsonb_build_object('key','castle_invites','label','Magic Castle invites',
    'status', case when v_pending = 0 then 'warn'
                   when v_ts is null or v_ts < la_now - interval '3 days' then 'fail' else 'ok' end,
    'detail', case when v_pending = 0 then 'queue empty, nobody left to invite'
                   else v_pending || ' queued, last sent ' || coalesce(to_char(v_ts at time zone 'America/Los_Angeles','Mon DD'),'never') end);

  -- 11. Apollo intake, Mondays
  select coalesce(sum(inserted),0) into v_int from apollo_batch_log where run_date = la_today;
  checks := checks || jsonb_build_object('key','apollo','label','Apollo bringing in new leads',
    'status', case when la_dow <> 1 then 'ok' when v_int = 0 then 'warn' else 'ok' end,
    'detail', case when la_dow <> 1 then 'checked Mondays only' else v_int || ' new leads today' end);

  -- 13. Email canary
  v_ts := null; v_ok := null; v_err := null;
  select ran_at, ok, error into v_ts, v_ok, v_err from system_canary_log order by ran_at desc limit 1;
  checks := checks || jsonb_build_object('key','email_canary','label','Outbound Gmail proven working',
    'status', case when v_ts is null or not v_ok or v_ts < la_now - interval '8 days' then 'fail' else 'ok' end,
    'detail', case when v_ts is null then 'never run'
                   when not v_ok then left(coalesce(v_err,'failed, no error text'), 80)
                   else 'last proven ' || to_char(v_ts at time zone 'America/Los_Angeles','Mon DD HH24:MI') end);

  select count(*) filter (where c->>'status'='fail'), count(*) filter (where c->>'status'='warn')
    into n_fail, n_warn from jsonb_array_elements(checks) c;

  return jsonb_build_object('generated_at', la_now, 'local_date', la_today,
    'failures', n_fail, 'warnings', n_warn,
    'overall', case when n_fail>0 then 'fail' when n_warn>0 then 'warn' else 'ok' end,
    'checks', checks);
end;
$function$;