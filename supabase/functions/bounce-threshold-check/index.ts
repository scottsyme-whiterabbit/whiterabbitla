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
 * Daily guardrail. Evaluates ONLY a trailing 7-day rolling bounce rate per
 * cold-outreach category. Lifetime history is intentionally ignored so that
 * old bounce baggage cannot permanently lock a category — once we scrub and
 * import fresh Apollo/MX-verified contacts, the window resets within a week.
 *
 * Rules per category:
 *   - 7-day bounce rate >= 5% over >= 50 sends in window  -> auto-pause
 *   - 7-day bounce rate >= 3% over >= 50 sends in window  -> warn only
 *
 * Auto-pause flips status='active' rows in that category to
 * 'paused_by_watchdog' (distinct from manual 'paused'), writes an audit row,
 * and emails scott.syme@whiterabbitla.com so pauses are never silent.
 *
 * Auth: x-cron-secret header OR Authorization: Bearer <CRON_SECRET>.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const T = {
      sevenDayBouncePct: 5,
      sevenDayBounceMinSends: 50,
      warn7dPct: 3,
      cooldownHours: 48,
    };

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

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const sevenDaySendsByCat = new Map<string, number>();
    const emailToCats = new Map<string, Set<string>>();
    const activeByCat = new Map<string, number>();

    for (const c of contacts) {
      const cat = c.campaign_category;
      if (
        c.last_email_sent_at &&
        new Date(c.last_email_sent_at).getTime() >= sevenDaysAgo
      ) {
        sevenDaySendsByCat.set(cat, (sevenDaySendsByCat.get(cat) || 0) + 1);
      }
      const e = (c.email || "").toLowerCase();
      if (!emailToCats.has(e)) emailToCats.set(e, new Set());
      emailToCats.get(e)!.add(cat);
      if (c.status === "active") {
        activeByCat.set(cat, (activeByCat.get(cat) || 0) + 1);
      }
    }

    type Bounce = { email: string; bounce_type: string; created_at: string };
    const bounces: Bounce[] = [];
    let bfrom = 0;
    while (true) {
      const { data, error } = await supabase
        .from("email_bounces")
        .select("email, bounce_type, created_at")
        .gte("created_at", new Date(sevenDaysAgo).toISOString())
        .range(bfrom, bfrom + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      bounces.push(...(data as Bounce[]));
      if (data.length < pageSize) break;
      bfrom += pageSize;
    }

    const sevenDayBouncesByCat = new Map<string, number>();
    for (const b of bounces) {
      const isCountable =
        b.bounce_type === "hard_bounce" ||
        b.bounce_type === "soft_bounce" ||
        b.bounce_type === "bounced" ||
        b.bounce_type === "complained";
      if (!isCountable) continue;
      const e = (b.email || "").toLowerCase();
      const cats = emailToCats.get(e);
      if (!cats) continue;
      for (const cat of cats) {
        sevenDayBouncesByCat.set(cat, (sevenDayBouncesByCat.get(cat) || 0) + 1);
      }
    }

    type Decision = {
      category: string;
      action: "pause" | "warn" | "ok";
      threshold_fired: string | null;
      seven_day_rate_pct: number;
      seven_day_sends: number;
      seven_day_bounces: number;
      active_contacts: number;
    };
    const decisions: Decision[] = [];
    const allCats = new Set<string>([
      ...sevenDaySendsByCat.keys(),
      ...activeByCat.keys(),
    ]);
    for (const cat of allCats) {
      const sends = sevenDaySendsByCat.get(cat) || 0;
      const b = sevenDayBouncesByCat.get(cat) || 0;
      const rate = sends > 0 ? (b / sends) * 100 : 0;
      const activeContacts = activeByCat.get(cat) || 0;

      let action: "pause" | "warn" | "ok" = "ok";
      let fired: string | null = null;
      if (sends >= T.sevenDayBounceMinSends && rate >= T.sevenDayBouncePct) {
        action = "pause"; fired = "seven_day_bounce_rate";
      } else if (sends >= T.sevenDayBounceMinSends && rate >= T.warn7dPct) {
        action = "warn"; fired = "warn_seven_day";
      }

      decisions.push({
        category: cat,
        action,
        threshold_fired: fired,
        seven_day_rate_pct: Math.round(rate * 100) / 100,
        seven_day_sends: sends,
        seven_day_bounces: b,
        active_contacts: activeContacts,
      });
    }

    let pausedCount = 0;
    let warnedCount = 0;
    const pausedDetails: Decision[] = [];
    const cooldownUntil = new Date(Date.now() + T.cooldownHours * 3600 * 1000).toISOString();

    for (const d of decisions) {
      if (d.action === "pause") {
        const { error: updErr } = await supabase
          .from("cold_email_campaigns")
          .update({ status: "paused_by_watchdog" })
          .eq("campaign_category", d.category)
          .eq("status", "active");
        if (updErr) throw updErr;
        pausedCount += 1;
        pausedDetails.push(d);

        await supabase.from("unpause_audit_log").insert({
          campaign_category: d.category,
          action: "auto_paused",
          threshold_fired: d.threshold_fired,
          bounce_rate: d.seven_day_rate_pct,
          send_volume: d.seven_day_sends,
          contacts_affected: d.active_contacts,
          details: { ...d, cooldown_until: cooldownUntil, thresholds: T, status_marker: "paused_by_watchdog" },
        });
      } else if (d.action === "warn") {
        warnedCount += 1;
        await supabase.from("unpause_audit_log").insert({
          campaign_category: d.category,
          action: "warning",
          threshold_fired: d.threshold_fired,
          bounce_rate: d.seven_day_rate_pct,
          send_volume: d.seven_day_sends,
          contacts_affected: d.active_contacts,
          details: { ...d, thresholds: T },
        });
      }
    }

    // Notify Scott on every pause — no more silent watchdog pauses.
    if (pausedDetails.length > 0) {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        const rows = pausedDetails
          .map(
            (d) =>
              `<tr><td style="padding:8px 12px;border:1px solid #ddd"><b>${d.category}</b></td>` +
              `<td style="padding:8px 12px;border:1px solid #ddd">${d.seven_day_rate_pct}%</td>` +
              `<td style="padding:8px 12px;border:1px solid #ddd">${d.seven_day_bounces} / ${d.seven_day_sends}</td>` +
              `<td style="padding:8px 12px;border:1px solid #ddd">${d.active_contacts}</td></tr>`
          )
          .join("");
        const html = `
          <p>The cold-outreach watchdog auto-paused ${pausedDetails.length} categor${pausedDetails.length === 1 ? "y" : "ies"} (7-day rolling bounce rate ≥ ${T.sevenDayBouncePct}% over ≥ ${T.sevenDayBounceMinSends} sends).</p>
          <p>Affected rows were flipped to <code>paused_by_watchdog</code> so they're distinct from manual pauses and easy to reverse.</p>
          <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
            <thead><tr>
              <th style="padding:8px 12px;border:1px solid #ddd;background:#f3f3f3;text-align:left">Category</th>
              <th style="padding:8px 12px;border:1px solid #ddd;background:#f3f3f3;text-align:left">7d rate</th>
              <th style="padding:8px 12px;border:1px solid #ddd;background:#f3f3f3;text-align:left">Bounces / sends</th>
              <th style="padding:8px 12px;border:1px solid #ddd;background:#f3f3f3;text-align:left">Active flipped</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color:#666;font-size:12px">Cooldown: ${T.cooldownHours}h. Review in /admin then flip back to <code>active</code> when ready.</p>
        `;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "White Rabbit LA <alerts@whiterabbitla.com>",
              to: ["scott.syme@whiterabbitla.com"],
              subject: `⚠️ Watchdog paused ${pausedDetails.length} cold category${pausedDetails.length === 1 ? "" : "ies"}`,
              html,
            }),
          });
        } catch (e) {
          console.error("watchdog notification email failed:", e);
        }
      } else {
        console.warn("RESEND_API_KEY missing — watchdog pause notification skipped");
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
