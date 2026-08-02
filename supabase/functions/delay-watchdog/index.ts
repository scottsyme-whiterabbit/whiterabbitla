import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

/**
 * delay-watchdog
 *
 * Weekly job. Auto-suppresses any cold_email_campaigns row whose email has
 * accumulated 4+ delivery_delayed bounce events in the last 14 days.
 *
 * Auth: requires CRON_SECRET in `x-cron-secret` header (or Bearer).
 *
 * Returns a summary of what was flipped, so cron logs are useful.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth — accept x-cron-secret OR Authorization: Bearer <secret>
  const accepted = [Deno.env.get("CRON_SECRET"), Deno.env.get("CRON_SECRET_V2")].filter(Boolean);
  const provided =
    req.headers.get("x-cron-secret") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (accepted.length === 0 || !accepted.includes(provided)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const since = new Date(Date.now() - 14 * 86400000).toISOString();

    // 1. Pull all delivery_delayed events from the last 14 days (paged).
    type Row = { email: string };
    const events: Row[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("email_bounces")
        .select("email")
        .in("bounce_type", ["delivery_delayed", "delayed"])
        .gte("created_at", since)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      events.push(...(data as Row[]));
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // 2. Tally per email; pick offenders with >=4 events.
    const tally = new Map<string, number>();
    for (const e of events) {
      const key = (e.email || "").toLowerCase().trim();
      if (!key) continue;
      tally.set(key, (tally.get(key) || 0) + 1);
    }
    const offenders = Array.from(tally.entries())
      .filter(([, n]) => n >= 4)
      .map(([email, n]) => ({ email, delay_count: n }));

    if (offenders.length === 0) {
      return new Response(
        JSON.stringify({
          ran_at: new Date().toISOString(),
          window_days: 14,
          threshold: 4,
          offenders_found: 0,
          flipped_to_bounced: 0,
          already_bounced: 0,
          not_in_campaigns: 0,
          details: [],
        }, null, 2),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Look up current status for each offender (batched IN query).
    const offenderEmails = offenders.map((o) => o.email);
    const statusMap = new Map<string, string>();
    for (let i = 0; i < offenderEmails.length; i += 200) {
      const batch = offenderEmails.slice(i, i + 200);
      const { data, error } = await supabase
        .from("cold_email_campaigns")
        .select("email, status")
        .in("email", batch);
      if (error) throw error;
      (data || []).forEach((r: any) =>
        statusMap.set((r.email || "").toLowerCase(), r.status)
      );
    }

    // 4. Flip active|paused → bounced.
    const toFlip = offenders.filter((o) => {
      const s = statusMap.get(o.email);
      return s === "active" || s === "paused";
    });
    const alreadyBounced = offenders.filter(
      (o) => statusMap.get(o.email) === "bounced"
    ).length;
    const notInCampaigns = offenders.filter(
      (o) => !statusMap.has(o.email)
    ).length;

    let flipped = 0;
    if (toFlip.length > 0) {
      const { error } = await supabase
        .from("cold_email_campaigns")
        .update({ status: "bounced" })
        .in("email", toFlip.map((o) => o.email))
        .in("status", ["active", "paused"]);
      if (error) throw error;
      flipped = toFlip.length;
    }

    // 5. Optionally also add to suppression list so they don't get re-imported.
    if (toFlip.length > 0) {
      const rows = toFlip.map((o) => ({
        email: o.email,
        reason: "soft_bounce",
        notes: `delay-watchdog: ${o.delay_count} delays in 14d`,
      }));
      // Best-effort upsert; ignore conflicts on existing suppressions.
      await supabase
        .from("email_suppression_list")
        .upsert(rows, { onConflict: "email", ignoreDuplicates: true });
    }

    return new Response(
      JSON.stringify({
        ran_at: new Date().toISOString(),
        window_days: 14,
        threshold: 4,
        offenders_found: offenders.length,
        flipped_to_bounced: flipped,
        already_bounced: alreadyBounced,
        not_in_campaigns: notInCampaigns,
        details: toFlip,
      }, null, 2),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("delay-watchdog error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
