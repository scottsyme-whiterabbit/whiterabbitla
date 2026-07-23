// Reusable seasonal campaign processor.
// One-off, per-category emails to cold_email_campaigns contacts. Copy comes
// from public.seasonal_campaign_copy keyed by campaign_key + category, so
// future seasonal blasts (Halloween, Valentine's, etc.) are copy-only.
//
// Contract:
//   POST { campaign_key, dry_run?: boolean, limit?: number }
//   Auth: x-import-token: EXTERNAL_IMPORT_TOKEN  (same pattern as cold-drip)
//   Send window: Tue/Wed/Thu Pacific only (dry_run bypasses)
//   Daily cap: 75 sends / campaign / day

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-import-token",
};

const LOGO_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-email-logo.png";
const SITE_URL = "https://whiterabbitla.com";
const TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-click";
const OPEN_TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-open";
const CALENDAR_URL = "https://calendar.app.google/58WjggPt3RFAcJjq8";
const DAILY_CAP = 75;

function extractFirstName(name: string | null | undefined): string {
  if (!name) return "there";
  if (name.includes(" and ") || name.includes(" & ")) return name;
  if (name.trim().toLowerCase().endsWith("team")) return name;
  return name.split(" ")[0];
}

function renderMerge(text: string, first: string, company: string | null): string {
  return text
    .replaceAll("{{first}}", first)
    .replaceAll("{{company}}", (company || "").trim());
}

function trackedCTA(contactId: string, campaignKey: string, category: string): string {
  const sep = CALENDAR_URL.includes("?") ? "&" : "?";
  const tagged = `${CALENDAR_URL}${sep}utm_source=email&utm_medium=seasonal&utm_campaign=${encodeURIComponent(campaignKey)}&utm_content=${encodeURIComponent(category)}`;
  const tracking = `${TRACK_URL}?cid=${contactId}&step=0&r=${encodeURIComponent(tagged)}`;
  return `<p style="margin:24px 0 0; text-align:center;">
<a href="${tracking}" target="_blank" style="display:inline-block; padding:12px 32px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C9A3A8; text-decoration:none; font-weight:bold; border:1px solid #C9A3A8; border-radius:2px;">Book a Call</a>
</p>`;
}

function signoff(): string {
  return `<p style="margin:24px 0 0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott Syme<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">Magician</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);"><a href="tel:+14243941850" style="color:rgba(245,240,232,0.35); text-decoration:none;">(424) 394-1850</a></span><br/>
<span style="font-size:12px;"><a href="https://whiterabbitla.com" style="color:rgba(245,240,232,0.35); text-decoration:none;">whiterabbitla.com</a></span>
</p>`;
}

function wrapEmail(preheader: string, innerHtml: string, email: string, contactId: string): string {
  const openPixel = `<img src="${OPEN_TRACK_URL}?cid=${contactId}&step=0" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{margin:0;padding:0;width:100% !important;background-color:#335747}
@media screen and (max-width:600px){.email-container{width:100% !important}.padding-mobile{padding-left:20px !important;padding-right:20px !important}}
</style></head>
<body style="margin:0;padding:0;background-color:#335747">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#335747">${preheader}</div>
<center style="width:100%;background-color:#335747">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#335747">
<tr><td style="padding:30px 0">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" align="center" class="email-container" style="max-width:560px;margin:auto;background-color:#223D34;border-radius:4px">
<tr><td style="padding:40px 40px 24px;text-align:center" class="padding-mobile">
<img src="${LOGO_URL}" alt="White Rabbit" width="90" style="width:90px;height:auto;display:block;margin:0 auto" />
</td></tr>
<tr><td style="padding:0 40px 28px;font-family:Georgia,serif;font-size:15px;line-height:1.8;color:rgba(245,240,232,0.75)" class="padding-mobile">
${innerHtml}
</td></tr>
<tr><td style="padding:0 40px" class="padding-mobile">
<hr style="border:none;border-top:1px solid rgba(201,163,168,0.15);margin:0 0 24px" />
</td></tr>
<tr><td style="padding:0 40px 12px;text-align:center" class="padding-mobile">
<p style="margin:0;font-family:Georgia,serif;font-size:12px;color:rgba(245,240,232,0.4)">
White Rabbit · Los Angeles<br/>7393 W. Manchester Ave #209, Los Angeles, CA 90045<br/>
<a href="mailto:scott.syme@whiterabbitla.com" style="color:#C9A3A8;text-decoration:none">scott.syme@whiterabbitla.com</a> · <a href="tel:+14243941850" style="color:rgba(248,245,240,0.4);text-decoration:none">(424) 394-1850</a>
</p>
</td></tr>
<tr><td style="padding:0 40px 32px;text-align:center" class="padding-mobile">
<p style="margin:0;font-family:Georgia,serif;font-size:11px;color:rgba(245,240,232,0.25)">
<a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color:rgba(245,240,232,0.3);text-decoration:underline">Unsubscribe</a>
</p>
</td></tr>
</table></td></tr></table></center>
${openPixel}
</body></html>`;
}

interface CopyRow {
  category: string;
  subject: string;
  paragraphs: string[];
}

interface Contact {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  campaign_category: string;
  status: string;
  hot_tag: boolean | null;
  engagement_opens: number | null;
  current_step: number;
  last_email_sent_at: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const importToken = Deno.env.get("EXTERNAL_IMPORT_TOKEN") ?? "";
    const provided = req.headers.get("x-import-token") ?? "";
    if (!importToken || provided !== importToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const campaignKey: string = body.campaign_key;
    const dryRun: boolean = body.dry_run === true;
    const limit: number = Math.min(Math.max(parseInt(body.limit ?? String(DAILY_CAP), 10) || DAILY_CAP, 1), DAILY_CAP);

    if (!campaignKey) {
      return new Response(JSON.stringify({ error: "campaign_key required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Weekday guard (dry_run bypasses so counts can be inspected any day)
    const pacificDay = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(new Date());
    const inWindow = ["Tue", "Wed", "Thu"].includes(pacificDay);
    if (!dryRun && !inWindow) {
      return new Response(JSON.stringify({ sent: 0, skipped: 0, message: `Outside send window: ${pacificDay}` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load copy for this campaign
    const { data: copyRows, error: copyErr } = await supabase
      .from("seasonal_campaign_copy")
      .select("category, subject, paragraphs")
      .eq("campaign_key", campaignKey)
      .eq("active", true);
    if (copyErr) throw copyErr;
    const copyByCategory = new Map<string, CopyRow>();
    (copyRows || []).forEach((r: any) => copyByCategory.set(r.category, r as CopyRow));

    if (copyByCategory.size === 0) {
      return new Response(JSON.stringify({ error: `No active copy rows for campaign_key=${campaignKey}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check daily cap (sends already made today for this campaign)
    const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
    const { count: sentToday } = await supabase
      .from("seasonal_campaign_sends")
      .select("*", { count: "exact", head: true })
      .eq("campaign_key", campaignKey)
      .gte("sent_at", startOfDay.toISOString());
    const remaining = Math.max(0, DAILY_CAP - (sentToday || 0));
    const effectiveLimit = Math.min(limit, dryRun ? DAILY_CAP : remaining);

    // Already-sent contact IDs for this campaign (exclude)
    const { data: sentRows } = await supabase
      .from("seasonal_campaign_sends")
      .select("contact_id")
      .eq("campaign_key", campaignKey);
    const sentIds = new Set<string>((sentRows || []).map((r: any) => r.contact_id));

    // Suppression list
    const { data: suppRows } = await supabase
      .from("email_suppression_list")
      .select("email");
    const suppressed = new Set<string>((suppRows || []).map((r: any) => (r.email || "").toLowerCase()));

    // Recent step-email cutoff (5 days)
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    // Pull candidates. We fetch in a wide pass then filter in-code so we can
    // apply the OR eligibility rule cleanly.
    // Order: hot_tag desc, then completed first, then engagement_opens desc.
    const { data: candidates, error: candErr } = await supabase
      .from("cold_email_campaigns")
      .select("id, email, name, company, campaign_category, status, hot_tag, engagement_opens, current_step, last_email_sent_at")
      .not("status", "in", "(bounced,suppressed,scrubbed_zerobounce,unsubscribed,replied)")
      .order("hot_tag", { ascending: false, nullsFirst: false })
      .order("status", { ascending: true }) // 'active' < 'completed' alphabetically — we re-sort below
      .order("engagement_opens", { ascending: false, nullsFirst: false })
      .limit(5000);
    if (candErr) throw candErr;

    const eligible: Contact[] = [];
    const skipReasons: Record<string, number> = {};
    const bump = (k: string) => { skipReasons[k] = (skipReasons[k] || 0) + 1; };

    for (const c of (candidates || []) as Contact[]) {
      const email = (c.email || "").toLowerCase();
      if (!email) { bump("no_email"); continue; }
      if (suppressed.has(email)) { bump("suppressed"); continue; }
      if (sentIds.has(c.id)) { bump("already_sent"); continue; }
      if (c.last_email_sent_at && c.last_email_sent_at > fiveDaysAgo) { bump("recent_step_email"); continue; }
      if (!copyByCategory.has(c.campaign_category)) { bump("no_copy_for_category"); continue; }

      const isCompleted = c.status === "completed";
      const isHot = c.hot_tag === true;
      const isActiveMature =
        c.status === "active" &&
        (c.current_step ?? 0) >= 2 &&
        (!c.last_email_sent_at || c.last_email_sent_at < sevenDaysAgo);

      if (!(isCompleted || isHot || isActiveMature)) { bump("not_eligible"); continue; }

      eligible.push(c);
    }

    // Re-sort: hot_tag desc, completed first, engagement_opens desc
    eligible.sort((a, b) => {
      const ah = a.hot_tag ? 1 : 0, bh = b.hot_tag ? 1 : 0;
      if (ah !== bh) return bh - ah;
      const ac = a.status === "completed" ? 1 : 0, bc = b.status === "completed" ? 1 : 0;
      if (ac !== bc) return bc - ac;
      return (b.engagement_opens || 0) - (a.engagement_opens || 0);
    });

    // Breakdown by category (of eligible pool)
    const byCategory: Record<string, number> = {};
    for (const c of eligible) byCategory[c.campaign_category] = (byCategory[c.campaign_category] || 0) + 1;

    if (dryRun) {
      const projectedDays = Math.ceil(eligible.length / DAILY_CAP);
      return new Response(JSON.stringify({
        dry_run: true,
        campaign_key: campaignKey,
        total_eligible: eligible.length,
        by_category: byCategory,
        daily_cap: DAILY_CAP,
        sent_today: sentToday || 0,
        remaining_today: remaining,
        projected_send_days_at_cap: projectedDays,
        projected_calendar_weeks_tue_thu: Math.ceil(projectedDays / 3),
        skip_reasons: skipReasons,
        copy_categories: Array.from(copyByCategory.keys()),
      }, null, 2), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Real send
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toSend = eligible.slice(0, effectiveLimit);
    let sent = 0, failed = 0;
    const errors: string[] = [];

    for (const c of toSend) {
      const copy = copyByCategory.get(c.campaign_category)!;
      const first = extractFirstName(c.name);
      const subject = renderMerge(copy.subject, first, c.company);
      const paragraphsHtml = copy.paragraphs
        .map((p) => `<p style="margin:0 0 18px">${renderMerge(p, first, c.company)}</p>`)
        .join("\n");
      const inner = paragraphsHtml + trackedCTA(c.id, campaignKey, c.campaign_category) + signoff();
      const html = wrapEmail(subject, inner, c.email, c.id);
      const oneClickUrl = `https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/unsubscribe-oneclick?email=${encodeURIComponent(c.email)}`;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
        body: JSON.stringify({
          from: "Scott Syme <scott.syme@whiterabbitla.com>",
          reply_to: "scott.syme@whiterabbitla.com",
          to: c.email,
          subject,
          html,
          headers: {
            "List-Unsubscribe": `<mailto:unsubscribe@whiterabbitla.com?subject=unsubscribe>, <${oneClickUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });

      if (res.ok) {
        await supabase.from("seasonal_campaign_sends").insert({
          campaign_key: campaignKey, contact_id: c.id, status: "sent",
        });
        await supabase.from("newsletter_send_log").insert({
          campaign_id: `${campaignKey.replace(/_/g, "")}-${c.campaign_category}`,
          contact_id: c.id,
          ab_variant: "A",
        });
        sent++;
      } else {
        failed++;
        const t = await res.text();
        errors.push(`${c.email}: ${res.status} ${t.slice(0, 200)}`);
        // small delay before continuing to avoid burst issues
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    return new Response(JSON.stringify({
      campaign_key: campaignKey, sent, failed,
      candidates: eligible.length, attempted: toSend.length,
      remaining_after: Math.max(0, remaining - sent),
      by_category: byCategory,
      errors: errors.slice(0, 10),
    }, null, 2), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seasonal-campaign-process error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
