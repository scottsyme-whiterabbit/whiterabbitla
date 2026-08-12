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

interface ScheduleRow {
  campaign_key: string;
  starts_on: string;
  ends_on: string;
  requires_prior_campaign_key: string | null;
  min_days_since_prior_send: number | null;
  min_days_since_any_seasonal_send: number | null;
  active: boolean;
}

const EXCLUDED_STATUSES =
  "(bounced,suppressed,scrubbed_zerobounce,unsubscribed,replied,reserved_personal)";

const daysAgoIso = (d: number) => new Date(Date.now() - d * 24 * 3600 * 1000).toISOString();

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
    const campaignKey: string | undefined = body.campaign_key || undefined;
    const dryRun: boolean = body.dry_run === true;
    const requestedLimit: number = Math.min(
      Math.max(parseInt(body.limit ?? String(DAILY_CAP), 10) || DAILY_CAP, 1),
      DAILY_CAP,
    );

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

    // ---- Resolve which campaigns to run ------------------------------------
    let schedule: ScheduleRow[] = [];
    if (campaignKey) {
      // Explicit single-campaign mode (testing). Use its schedule extras if a
      // row exists, otherwise run with no extra targeting.
      const { data: row } = await supabase
        .from("seasonal_campaign_schedule")
        .select("*")
        .eq("campaign_key", campaignKey)
        .maybeSingle();
      schedule = [
        (row as ScheduleRow) ?? {
          campaign_key: campaignKey,
          starts_on: "", ends_on: "",
          requires_prior_campaign_key: null,
          min_days_since_prior_send: null,
          min_days_since_any_seasonal_send: null,
          active: true,
        },
      ];
    } else {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
      const { data: rows, error: schedErr } = await supabase
        .from("seasonal_campaign_schedule")
        .select("*")
        .eq("active", true)
        .lte("starts_on", today)
        .gte("ends_on", today)
        .order("starts_on", { ascending: true });
      if (schedErr) throw schedErr;
      schedule = (rows || []) as ScheduleRow[];
      if (schedule.length === 0) {
        return new Response(JSON.stringify({
          schedule_driven: true, today, in_window: [], sent: 0,
          message: "No seasonal campaigns in window today",
        }, null, 2), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // ---- Shared data pulls (once for all campaigns) ------------------------
    const { data: copyRows, error: copyErr } = await supabase
      .from("seasonal_campaign_copy")
      .select("campaign_key, category, subject, paragraphs")
      .eq("active", true);
    if (copyErr) throw copyErr;
    const copyByKey = new Map<string, Map<string, CopyRow>>();
    (copyRows || []).forEach((r: any) => {
      if (!copyByKey.has(r.campaign_key)) copyByKey.set(r.campaign_key, new Map());
      copyByKey.get(r.campaign_key)!.set(r.category, r as CopyRow);
    });

    // GLOBAL daily cap across all seasonal campaigns
    const startOfDay = new Date(); startOfDay.setUTCHours(0, 0, 0, 0);
    const { count: sentToday } = await supabase
      .from("seasonal_campaign_sends")
      .select("*", { count: "exact", head: true })
      .gte("sent_at", startOfDay.toISOString());
    let globalRemaining = Math.max(0, DAILY_CAP - (sentToday || 0));

    // All seasonal sends (for dedup, prior-campaign gates, recency spacing)
    const allSends: { campaign_key: string; contact_id: string; sent_at: string; status: string }[] = [];
    {
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("seasonal_campaign_sends")
          .select("campaign_key, contact_id, sent_at, status")
          .range(from, from + PAGE - 1);
        if (error) throw error;
        allSends.push(...((data || []) as any));
        if (!data || data.length < PAGE) break;
      }
    }
    const sentByKey = new Map<string, Set<string>>();
    const lastSentByKeyContact = new Map<string, string>(); // `${key}|${contact}` -> sent_at
    const lastAnySeasonal = new Map<string, string>();
    for (const s of allSends) {
      if (!sentByKey.has(s.campaign_key)) sentByKey.set(s.campaign_key, new Set());
      sentByKey.get(s.campaign_key)!.add(s.contact_id);
      if (s.status === "sent") {
        const k = `${s.campaign_key}|${s.contact_id}`;
        if (!lastSentByKeyContact.has(k) || s.sent_at > lastSentByKeyContact.get(k)!) {
          lastSentByKeyContact.set(k, s.sent_at);
        }
      }
      const prev = lastAnySeasonal.get(s.contact_id);
      if (!prev || s.sent_at > prev) lastAnySeasonal.set(s.contact_id, s.sent_at);
    }

    const { data: suppRows } = await supabase.from("email_suppression_list").select("email");
    const suppressed = new Set<string>((suppRows || []).map((r: any) => (r.email || "").toLowerCase()));

    const fiveDaysAgo = daysAgoIso(5);
    const sevenDaysAgo = daysAgoIso(7);

    const { data: candidates, error: candErr } = await supabase
      .from("cold_email_campaigns")
      .select("id, email, name, company, campaign_category, status, hot_tag, engagement_opens, current_step, last_email_sent_at")
      .not("status", "in", EXCLUDED_STATUSES)
      .limit(5000);
    if (candErr) throw candErr;

    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    if (!dryRun && !RESEND_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Per-campaign processing ------------------------------------------
    const perCampaign: Record<string, unknown> = {};
    let totalSent = 0;

    for (const row of schedule) {
      const key = row.campaign_key;
      const copyByCategory = copyByKey.get(key);
      if (!copyByCategory || copyByCategory.size === 0) {
        perCampaign[key] = { error: `No active copy rows for campaign_key=${key}` };
        continue;
      }

      const alreadySent = sentByKey.get(key) || new Set<string>();
      const eligible: Contact[] = [];
      const skipReasons: Record<string, number> = {};
      const bump = (k: string) => { skipReasons[k] = (skipReasons[k] || 0) + 1; };

      for (const c of (candidates || []) as Contact[]) {
        const email = (c.email || "").toLowerCase();
        if (!email) { bump("no_email"); continue; }
        if (suppressed.has(email)) { bump("suppressed"); continue; }
        if (alreadySent.has(c.id)) { bump("already_sent"); continue; }
        if (c.last_email_sent_at && c.last_email_sent_at > fiveDaysAgo) { bump("recent_step_email"); continue; }
        if (!copyByCategory.has(c.campaign_category)) { bump("no_copy_for_category"); continue; }

        // Schedule targeting extras
        if (row.requires_prior_campaign_key) {
          const priorAt = lastSentByKeyContact.get(`${row.requires_prior_campaign_key}|${c.id}`);
          if (!priorAt) { bump("missing_prior_campaign"); continue; }
          if (row.min_days_since_prior_send != null &&
              priorAt > daysAgoIso(row.min_days_since_prior_send)) {
            bump("prior_send_too_recent"); continue;
          }
        }
        if (row.min_days_since_any_seasonal_send != null) {
          const anyAt = lastAnySeasonal.get(c.id);
          if (anyAt && anyAt > daysAgoIso(row.min_days_since_any_seasonal_send)) {
            bump("seasonal_send_too_recent"); continue;
          }
        }

        const isCompleted = c.status === "completed";
        const isHot = c.hot_tag === true;
        const isActiveMature =
          c.status === "active" &&
          (c.current_step ?? 0) >= 2 &&
          (!c.last_email_sent_at || c.last_email_sent_at < sevenDaysAgo);

        if (!(isCompleted || isHot || isActiveMature)) { bump("not_eligible"); continue; }
        eligible.push(c);
      }

      eligible.sort((a, b) => {
        const ah = a.hot_tag ? 1 : 0, bh = b.hot_tag ? 1 : 0;
        if (ah !== bh) return bh - ah;
        const ac = a.status === "completed" ? 1 : 0, bc = b.status === "completed" ? 1 : 0;
        if (ac !== bc) return bc - ac;
        return (b.engagement_opens || 0) - (a.engagement_opens || 0);
      });

      const byCategory: Record<string, number> = {};
      for (const c of eligible) byCategory[c.campaign_category] = (byCategory[c.campaign_category] || 0) + 1;

      if (dryRun) {
        perCampaign[key] = {
          window: row.starts_on ? `${row.starts_on} to ${row.ends_on}` : "explicit",
          total_eligible: eligible.length,
          by_category: byCategory,
          skip_reasons: skipReasons,
          targeting: {
            requires_prior_campaign_key: row.requires_prior_campaign_key,
            min_days_since_prior_send: row.min_days_since_prior_send,
            min_days_since_any_seasonal_send: row.min_days_since_any_seasonal_send,
          },
          projected_send_days_at_cap: Math.ceil(eligible.length / DAILY_CAP),
        };
        continue;
      }

      const budget = Math.min(requestedLimit, globalRemaining);
      const toSend = budget > 0 ? eligible.slice(0, budget) : [];
      let sent = 0, failed = 0;
      const errors: string[] = [];

      for (const c of toSend) {
        const copy = copyByCategory.get(c.campaign_category)!;
        const first = extractFirstName(c.name);
        const subject = renderMerge(copy.subject, first, c.company);
        const paragraphsHtml = copy.paragraphs
          .map((p) => `<p style="margin:0 0 18px">${renderMerge(p, first, c.company)}</p>`)
          .join("\n");
        const inner = paragraphsHtml + trackedCTA(c.id, key, c.campaign_category) + signoff();
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
            campaign_key: key, contact_id: c.id, status: "sent",
          });
          await supabase.from("newsletter_send_log").insert({
            campaign_id: `${key.replace(/_/g, "")}-${c.campaign_category}`,
            contact_id: c.id,
            ab_variant: "A",
          });
          sent++;
          globalRemaining--;
          totalSent++;
          // Keep in-memory spacing maps fresh for later campaigns in this run
          const nowIso = new Date().toISOString();
          lastAnySeasonal.set(c.id, nowIso);
          lastSentByKeyContact.set(`${key}|${c.id}`, nowIso);
          alreadySent.add(c.id);
        } else {
          failed++;
          const t = await res.text();
          errors.push(`${c.email}: ${res.status} ${t.slice(0, 200)}`);
          await new Promise((r) => setTimeout(r, 250));
        }
      }

      perCampaign[key] = {
        sent, failed, candidates: eligible.length, attempted: toSend.length,
        by_category: byCategory, errors: errors.slice(0, 10),
      };
    }

    return new Response(JSON.stringify({
      schedule_driven: !campaignKey,
      dry_run: dryRun,
      in_window: schedule.map((s) => s.campaign_key),
      daily_cap_global: DAILY_CAP,
      sent_today_before_run: sentToday || 0,
      remaining_today: globalRemaining,
      total_sent: totalSent,
      campaigns: perCampaign,
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
