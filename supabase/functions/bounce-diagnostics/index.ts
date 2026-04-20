import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-diagnostics-token",
};

const DIAGNOSTICS_TOKEN = "wrm-bdx-9fK2pQ7nT4xL6vR8sJ3yH5mZ";

// Hard bounce reason patterns (Resend / SES style)
const HARD_PATTERNS = [
  /invalid/i,
  /does ?not ?exist/i,
  /no such user/i,
  /unknown user/i,
  /user unknown/i,
  /mailbox not found/i,
  /no mailbox/i,
  /address rejected/i,
  /recipient rejected/i,
  /permanent/i,
  /5\.1\.[01]/,
  /550/,
  /551/,
  /553/,
];

function classifyBounce(b: { bounce_type: string; reason: string | null }): "hard" | "soft" | "complaint" | "delayed" {
  const t = (b.bounce_type || "").toLowerCase();
  if (t === "complained" || t === "complaint") return "complaint";
  if (t === "delivery_delayed" || t === "delayed") return "delayed";
  const r = b.reason || "";
  if (HARD_PATTERNS.some((p) => p.test(r))) return "hard";
  return "soft";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ---- Kill switch ----
  if ((Deno.env.get("EDGE_FUNCTIONS_DISABLED") || "").toLowerCase() === "true") {
    return new Response(JSON.stringify({ error: "temporarily_disabled" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ---- Auth: token-only (BULK_IMPORT_TOKEN) ----
  const importToken = req.headers.get("x-bulk-import-token") || "";
  const expectedImport = Deno.env.get("BULK_IMPORT_TOKEN") || "";
  if (!importToken || !expectedImport || importToken !== expectedImport) {
    return new Response(JSON.stringify({ error: "auth_failed" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ---------------- Pull all bounces (paged) ----------------
    const allBounces: { email: string; bounce_type: string; reason: string | null; created_at: string; contact_id: string | null }[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("email_bounces")
        .select("email, bounce_type, reason, created_at, contact_id")
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      allBounces.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    // ---------------- Total sends lifetime ----------------
    // Sends = newsletter_send_log rows (status='sent' or any) + cold campaign sends estimate
    const { count: newsletterSends } = await supabase
      .from("newsletter_send_log")
      .select("*", { count: "exact", head: true });

    // Cold campaign sends ≈ sum of current_step across rows that progressed past step 0
    const coldSendsRows: { current_step: number; campaign_category: string }[] = [];
    let cFrom = 0;
    while (true) {
      const { data, error } = await supabase
        .from("cold_email_campaigns")
        .select("current_step, campaign_category, email, status")
        .range(cFrom, cFrom + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      coldSendsRows.push(...(data as any));
      if (data.length < pageSize) break;
      cFrom += pageSize;
    }
    const coldSendsTotal = coldSendsRows.reduce((s, r) => s + (r.current_step || 0), 0);

    const totalSendsLifetime = (newsletterSends || 0) + coldSendsTotal;

    // ---------------- Bounce classification ----------------
    let hard = 0;
    let soft = 0;
    let complaint = 0;
    let delayed = 0;
    for (const b of allBounces) {
      const c = classifyBounce(b);
      if (c === "hard") hard++;
      else if (c === "soft") soft++;
      else if (c === "complaint") complaint++;
      else delayed++;
    }
    const totalBouncesLifetime = hard + soft; // exclude delayed + complaints from "bounce" total
    const currentBounceRatePercent =
      totalSendsLifetime > 0
        ? Number(((totalBouncesLifetime / totalSendsLifetime) * 100).toFixed(2))
        : 0;

    // ---------------- Bounces by campaign category ----------------
    // Map bounce email -> campaign_category (cold_email_campaigns wins; fallback newsletter_contacts.drip_campaign)
    const bounceEmails = Array.from(new Set(allBounces.map((b) => b.email.toLowerCase())));
    const emailToCategory = new Map<string, string>();

    for (let i = 0; i < bounceEmails.length; i += 200) {
      const batch = bounceEmails.slice(i, i + 200);
      const { data } = await supabase
        .from("cold_email_campaigns")
        .select("email, campaign_category")
        .in("email", batch);
      (data || []).forEach((r: any) => emailToCategory.set(r.email.toLowerCase(), r.campaign_category));
    }
    // Fallback to newsletter_contacts drip_campaign
    const stillUnknown = bounceEmails.filter((e) => !emailToCategory.has(e));
    for (let i = 0; i < stillUnknown.length; i += 200) {
      const batch = stillUnknown.slice(i, i + 200);
      const { data } = await supabase
        .from("newsletter_contacts")
        .select("email, drip_campaign, source")
        .in("email", batch);
      (data || []).forEach((r: any) => {
        if (!emailToCategory.has(r.email.toLowerCase())) {
          emailToCategory.set(r.email.toLowerCase(), `newsletter:${r.drip_campaign || "unknown"}`);
        }
      });
    }

    // Sends by category (from cold_email_campaigns)
    const sendsByCat: Record<string, number> = {};
    for (const r of coldSendsRows) {
      const cat = r.campaign_category || "unknown";
      sendsByCat[cat] = (sendsByCat[cat] || 0) + (r.current_step || 0);
    }
    // Add newsletter sends bucket (best-effort, lumped)
    if (newsletterSends && newsletterSends > 0) sendsByCat["newsletter:all"] = newsletterSends;

    const bouncesByCat: Record<string, number> = {};
    for (const b of allBounces) {
      const cls = classifyBounce(b);
      if (cls !== "hard" && cls !== "soft") continue;
      const cat = emailToCategory.get(b.email.toLowerCase()) || "unknown";
      bouncesByCat[cat] = (bouncesByCat[cat] || 0) + 1;
    }

    const bouncesByCampaignCategory = Object.keys({ ...sendsByCat, ...bouncesByCat })
      .map((cat) => {
        const sends = sendsByCat[cat] || 0;
        const bounces = bouncesByCat[cat] || 0;
        const rate = sends > 0 ? Number(((bounces / sends) * 100).toFixed(2)) : null;
        return { campaign_category: cat, sends, bounces, rate_percent: rate };
      })
      .sort((a, b) => b.bounces - a.bounces);

    // ---------------- Bounces by contact source ----------------
    // Source comes from newsletter_contacts.source; cold_email_campaigns has no source col → label 'cold_import'
    const emailToSource = new Map<string, string>();
    for (let i = 0; i < bounceEmails.length; i += 200) {
      const batch = bounceEmails.slice(i, i + 200);
      const { data } = await supabase
        .from("newsletter_contacts")
        .select("email, source")
        .in("email", batch);
      (data || []).forEach((r: any) => emailToSource.set(r.email.toLowerCase(), r.source || "unknown"));
    }
    // Anything still unknown but in cold_email_campaigns -> 'cold_import'
    for (const e of bounceEmails) {
      if (!emailToSource.has(e) && emailToCategory.has(e) && !emailToCategory.get(e)!.startsWith("newsletter:")) {
        emailToSource.set(e, "cold_import");
      }
    }

    // Sends by source: pull all newsletter_contacts source distribution + cold count
    const sourceSends: Record<string, number> = {};
    let scFrom = 0;
    while (true) {
      const { data, error } = await supabase
        .from("newsletter_contacts")
        .select("source")
        .range(scFrom, scFrom + pageSize - 1);
      if (error) break;
      if (!data || data.length === 0) break;
      // each contact ≈ 1 send minimum; use as proxy
      for (const r of data as any[]) {
        const s = r.source || "unknown";
        sourceSends[s] = (sourceSends[s] || 0) + 1;
      }
      if (data.length < pageSize) break;
      scFrom += pageSize;
    }
    sourceSends["cold_import"] = coldSendsRows.length;

    const sourceBounces: Record<string, number> = {};
    for (const b of allBounces) {
      const cls = classifyBounce(b);
      if (cls !== "hard" && cls !== "soft") continue;
      const s = emailToSource.get(b.email.toLowerCase()) || "unknown";
      sourceBounces[s] = (sourceBounces[s] || 0) + 1;
    }

    const bouncesByContactSource = Object.keys({ ...sourceSends, ...sourceBounces })
      .map((source) => {
        const sends = sourceSends[source] || 0;
        const bounces = sourceBounces[source] || 0;
        const rate = sends > 0 ? Number(((bounces / sends) * 100).toFixed(2)) : null;
        return { source, sends, bounces, rate_percent: rate };
      })
      .sort((a, b) => b.bounces - a.bounces);

    // ---------------- Top 10 bouncing domains ----------------
    const domainCounts: Record<string, number> = {};
    for (const b of allBounces) {
      const cls = classifyBounce(b);
      if (cls !== "hard" && cls !== "soft") continue;
      const domain = (b.email.split("@")[1] || "unknown").toLowerCase();
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    }
    const topBouncingDomains = Object.entries(domainCounts)
      .map(([domain, bounce_count]) => ({ domain, bounce_count }))
      .sort((a, b) => b.bounce_count - a.bounce_count)
      .slice(0, 10);

    // ---------------- 30-day trend ----------------
    const now = Date.now();
    const d30 = new Date(now - 30 * 86400000);
    const d60 = new Date(now - 60 * 86400000);

    let last30 = 0;
    let prior30 = 0;
    for (const b of allBounces) {
      const cls = classifyBounce(b);
      if (cls !== "hard" && cls !== "soft") continue;
      const t = new Date(b.created_at).getTime();
      if (t >= d30.getTime()) last30++;
      else if (t >= d60.getTime()) prior30++;
    }
    const trendPctChange =
      prior30 > 0 ? Number((((last30 - prior30) / prior30) * 100).toFixed(2)) : null;

    return new Response(
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          notes: {
            sends_methodology:
              "newsletter_send_log row count + sum(current_step) across cold_email_campaigns",
            bounce_classification:
              "Hard/soft inferred from reason text patterns; 'delivery_delayed' tracked separately",
            data_sources: ["email_bounces", "newsletter_send_log", "cold_email_campaigns", "newsletter_contacts"],
          },
          total_sends_lifetime: totalSendsLifetime,
          total_bounces_lifetime: {
            total: totalBouncesLifetime,
            hard,
            soft,
            complaints: complaint,
            delivery_delayed: delayed,
          },
          current_bounce_rate_percent: currentBounceRatePercent,
          bounces_by_campaign_category: bouncesByCampaignCategory,
          bounces_by_contact_source: bouncesByContactSource,
          top_10_bouncing_domains: topBouncingDomains,
          trend_30d: {
            bounces_last_30_days: last30,
            bounces_prior_30_days: prior30,
            change_percent: trendPctChange,
            direction:
              trendPctChange === null
                ? "n/a"
                : trendPctChange > 0
                ? "worsening"
                : trendPctChange < 0
                ? "improving"
                : "flat",
          },
        },
        null,
        2
      ),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("bounce-diagnostics error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
