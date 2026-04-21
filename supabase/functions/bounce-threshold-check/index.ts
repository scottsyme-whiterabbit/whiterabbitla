import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

/**
 * bounce-threshold-check
 *
 * Daily job. Per cold-outreach campaign category, evaluates:
 *   - Lifetime bounce rate ≥ 10% over ≥ 100 sends            → auto-pause
 *   - Trailing 7-day bounce rate ≥ 8% over ≥ 75 sends        → auto-pause
 *   - Hard-bounce rate ≥ 3% over ≥ 100 sends (lifetime)      → auto-pause
 *   - Lifetime bounce rate ≥ 6% (warning, no pause)
 *   - 7-day bounce rate ≥ 5% (warning, no pause)
 *
 * Auto-pause flips status='active' rows in that category to 'paused' AND
 * writes a row to unpause_audit_log with a cooldown_until = now + 48h.
 * The watchdog/admin UI must respect that cooldown before resuming.
 *
 * "Sends" are estimated from cold_email_campaigns.last_email_sent_at +
 * current_step (the step is 1-indexed once the first email goes out, so
 * the count of touches per contact is current_step itself).
 *
 * Auth: x-cron-secret header OR Authorization: Bearer <CRON_SECRET>.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided =
    req.headers.get("x-cron-secret") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!cronSecret || provided !== cronSecret) {
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

    // Thresholds — keep all numbers in one place so they're easy to tune.
    const T = {
      lifetimeBouncePct: 10,
      lifetimeBounceMinSends: 100,
      sevenDayBouncePct: 8,
      sevenDayBounceMinSends: 75,
      hardBouncePct: 3,
      hardBounceMinSends: 100,
      warnLifetimePct: 6,
      warn7dPct: 5,
      cooldownHours: 48,
    };

    // 1. Pull all cold contacts, paged. We need email + category + status + current_step.
    type Contact = {
      email: string;
      campaign_category: string;
      status: string;
      current_step: number | null;
      last_email_sent_at: string | null;
    };
    const contacts: Contact[] = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("cold_email_campaigns")
        .select("email, campaign_category, status, current_step, last_email_sent_at")
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      contacts.push(...(data as Contact[]));
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // 2. Build per-category send estimates.
    //    Lifetime sends per category = sum(current_step) across all rows.
    //    7-day sends per category = sum(current_step) across rows whose
    //      last_email_sent_at is within the past 7 days. (Approximation: assumes
    //      the most recent step is the one that lands in the window. In practice
    //      drips fire 1 email per cycle so this matches actual sends within ±1.)
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const lifetimeSendsByCat = new Map<string, number>();
    const sevenDaySendsByCat = new Map<string, number>();
    const emailsByCat = new Map<string, Set<string>>();
    for (const c of contacts) {
      const cat = c.campaign_category;
      const step = Math.max(0, c.current_step ?? 0);
      lifetimeSendsByCat.set(cat, (lifetimeSendsByCat.get(cat) || 0) + step);
      if (c.last_email_sent_at && new Date(c.last_email_sent_at).getTime() >= sevenDaysAgo) {
        // count 1 send in the 7-day window per active contact that was emailed recently
        sevenDaySendsByCat.set(cat, (sevenDaySendsByCat.get(cat) || 0) + 1);
      }
      if (!emailsByCat.has(cat)) emailsByCat.set(cat, new Set());
      emailsByCat.get(cat)!.add((c.email || "").toLowerCase());
    }

    // 3. Pull bounces (lifetime + 7-day) and tally per category by joining email→category.
    type Bounce = { email: string; bounce_type: string; created_at: string };
    const bounces: Bounce[] = [];
    let bfrom = 0;
    while (true) {
      const { data, error } = await supabase
        .from("email_bounces")
        .select("email, bounce_type, created_at")
        .range(bfrom, bfrom + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      bounces.push(...(data as Bounce[]));
      if (data.length < pageSize) break;
      bfrom += pageSize;
    }

    // Build email→category lookup. If an email exists in multiple categories
    // (rare but possible), attribute the bounce to all of them — that's the
    // conservative read for deliverability.
    const emailToCats = new Map<string, Set<string>>();
    for (const c of contacts) {
      const e = (c.email || "").toLowerCase();
      if (!emailToCats.has(e)) emailToCats.set(e, new Set());
      emailToCats.get(e)!.add(c.campaign_category);
    }

    type CatTally = { lifetime: number; sevenDay: number; hard: number };
    const tallyByCat = new Map<string, CatTally>();
    for (const b of bounces) {
      const e = (b.email || "").toLowerCase();
      const cats = emailToCats.get(e);
      if (!cats) continue;
      const isRecent = new Date(b.created_at).getTime() >= sevenDaysAgo;
      const isHard = b.bounce_type === "hard_bounce";
      // Bounce-rate denominators include hard, soft, and the legacy 'bounced'
      // value but exclude pure delivery_delayed (those are still in flight).
      const isCountable =
        b.bounce_type === "hard_bounce" ||
        b.bounce_type === "soft_bounce" ||
        b.bounce_type === "bounced" ||
        b.bounce_type === "complained";
      if (!isCountable) continue;
      for (const cat of cats) {
        if (!tallyByCat.has(cat)) tallyByCat.set(cat, { lifetime: 0, sevenDay: 0, hard: 0 });
        const t = tallyByCat.get(cat)!;
        t.lifetime += 1;
        if (isRecent) t.sevenDay += 1;
        if (isHard) t.hard += 1;
      }
    }

    // 4. Evaluate thresholds per category.
    type Decision = {
      category: string;
      action: "pause" | "warn" | "ok";
      threshold_fired: string | null;
      lifetime_rate_pct: number;
      seven_day_rate_pct: number;
      hard_rate_pct: number;
      lifetime_sends: number;
      seven_day_sends: number;
      lifetime_bounces: number;
      seven_day_bounces: number;
      hard_bounces: number;
      active_contacts: number;
    };
    const decisions: Decision[] = [];
    for (const [cat, lifetimeSends] of lifetimeSendsByCat.entries()) {
      const sevenDaySends = sevenDaySendsByCat.get(cat) || 0;
      const t = tallyByCat.get(cat) || { lifetime: 0, sevenDay: 0, hard: 0 };
      const lifetimeRate = lifetimeSends > 0 ? (t.lifetime / lifetimeSends) * 100 : 0;
      const sevenDayRate = sevenDaySends > 0 ? (t.sevenDay / sevenDaySends) * 100 : 0;
      const hardRate = lifetimeSends > 0 ? (t.hard / lifetimeSends) * 100 : 0;

      const activeContacts = contacts.filter(
        (c) => c.campaign_category === cat && c.status === "active"
      ).length;

      let action: "pause" | "warn" | "ok" = "ok";
      let fired: string | null = null;

      if (lifetimeSends >= T.lifetimeBounceMinSends && lifetimeRate >= T.lifetimeBouncePct) {
        action = "pause"; fired = "lifetime_bounce_rate";
      } else if (sevenDaySends >= T.sevenDayBounceMinSends && sevenDayRate >= T.sevenDayBouncePct) {
        action = "pause"; fired = "seven_day_bounce_rate";
      } else if (lifetimeSends >= T.hardBounceMinSends && hardRate >= T.hardBouncePct) {
        action = "pause"; fired = "hard_bounce_rate";
      } else if (lifetimeSends >= T.lifetimeBounceMinSends && lifetimeRate >= T.warnLifetimePct) {
        action = "warn"; fired = "warn_lifetime";
      } else if (sevenDaySends >= T.sevenDayBounceMinSends && sevenDayRate >= T.warn7dPct) {
        action = "warn"; fired = "warn_seven_day";
      }

      decisions.push({
        category: cat,
        action,
        threshold_fired: fired,
        lifetime_rate_pct: Math.round(lifetimeRate * 100) / 100,
        seven_day_rate_pct: Math.round(sevenDayRate * 100) / 100,
        hard_rate_pct: Math.round(hardRate * 100) / 100,
        lifetime_sends: lifetimeSends,
        seven_day_sends: sevenDaySends,
        lifetime_bounces: t.lifetime,
        seven_day_bounces: t.sevenDay,
        hard_bounces: t.hard,
        active_contacts: activeContacts,
      });
    }

    // 5. Apply pauses + audit. Warnings get an audit row but no status change.
    let pausedCount = 0;
    let warnedCount = 0;
    const cooldownUntil = new Date(Date.now() + T.cooldownHours * 3600 * 1000).toISOString();

    for (const d of decisions) {
      if (d.action === "pause") {
        // Flip active → paused for this category only.
        const { error: updErr } = await supabase
          .from("cold_email_campaigns")
          .update({ status: "paused" })
          .eq("campaign_category", d.category)
          .eq("status", "active");
        if (updErr) throw updErr;
        pausedCount += 1;

        await supabase.from("unpause_audit_log").insert({
          campaign_category: d.category,
          action: "auto_paused",
          threshold_fired: d.threshold_fired,
          bounce_rate: d.threshold_fired === "seven_day_bounce_rate" ? d.seven_day_rate_pct : d.lifetime_rate_pct,
          hard_bounce_rate: d.hard_rate_pct,
          send_volume: d.threshold_fired === "seven_day_bounce_rate" ? d.seven_day_sends : d.lifetime_sends,
          contacts_affected: d.active_contacts,
          details: {
            ...d,
            cooldown_until: cooldownUntil,
            cooldown_hours: T.cooldownHours,
            thresholds: T,
          },
        });
      } else if (d.action === "warn") {
        warnedCount += 1;
        await supabase.from("unpause_audit_log").insert({
          campaign_category: d.category,
          action: "warning",
          threshold_fired: d.threshold_fired,
          bounce_rate: d.threshold_fired === "warn_seven_day" ? d.seven_day_rate_pct : d.lifetime_rate_pct,
          hard_bounce_rate: d.hard_rate_pct,
          send_volume: d.threshold_fired === "warn_seven_day" ? d.seven_day_sends : d.lifetime_sends,
          contacts_affected: d.active_contacts,
          details: { ...d, thresholds: T },
        });
      }
    }

    return new Response(
      JSON.stringify(
        {
          ran_at: new Date().toISOString(),
          thresholds: T,
          categories_evaluated: decisions.length,
          paused: pausedCount,
          warned: warnedCount,
          decisions,
        },
        null,
        2
      ),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("bounce-threshold-check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
