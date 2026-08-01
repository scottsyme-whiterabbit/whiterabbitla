// Castle Invite Track — SINGLE-SEND campaign, parallel to the national cold drip.
// - Throttled: 30 invites/day max, weekdays only, send loop runs after 10 AM PT
// - Tier order: newsletter → paused → active → completed
// - Plain Gmail-style HTML (no dark wrapper), 1:1 invitation tone
// - Sets castle_invite_status='invited', logs per-tier daily counts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_CAP = 30;
const TIER_ORDER = ["newsletter", "paused", "active", "completed"] as const;
type Tier = typeof TIER_ORDER[number];

const OPEN_TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-open";
const PLAIN_FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
const SITE_URL = "https://whiterabbitla.com";

const COMPANY_SUFFIXES = ["agency","group","co","studio","productions","marketing","pr","events","inc","llc","ltd","partners","associates","collective"];
const SHORT_NAME_WHITELIST = new Set(["bo","ed","jo","sam","max","ben","tim","tom","jay","ray","al","ali","ana","amy","ava","eli","eva","ian","ivy","kai","kim","leo","lou","mia","nia","pat","sue","zoe","cj","dj","aj","tj","kj","mj","rj","bob","joe","dan","meg","rob","zac","tal","ria","jim","ken","don","ron","ted","jen","liz","lia","noa","rey","gus","abe","art","guy","hal","ira","jed","kit","lev","luz","may","mel","moe","ned","nik","pam","peg","phi","raj","sal","syd","val","vic","wes","wyn"]);
const GENERIC_LOCALS = new Set(["hello","info","contact","team","support","admin","office","events","sales","bookings","media","press","marketing","reception","general","ops","hr"]);

export function extractFirstName(name: string | null | undefined, email?: string): string {
  if (email) {
    const local = email.split("@")[0]?.toLowerCase().replace(/[._-].*$/, "");
    if (local && GENERIC_LOCALS.has(local)) return "there";
  }
  if (!name) return "there";
  const trimmed = name.trim();
  if (trimmed.includes(" and ") || trimmed.includes(" & ")) return trimmed;
  if (trimmed.toLowerCase().endsWith("team")) return trimmed;
  const tokens = trimmed.split(/\s+/);
  const lowerTokens = tokens.map((t) => t.toLowerCase().replace(/[.,]/g, ""));
  if (lowerTokens.some((t) => COMPANY_SUFFIXES.includes(t))) return "there";
  const first = tokens[0].replace(/[.,]/g, "");
  const firstLower = first.toLowerCase();
  if (first.length <= 3 && !SHORT_NAME_WHITELIST.has(firstLower)) return "there";
  return first;
}

function buildTemplate(tier: Tier, firstName: string): { subject: string; preheader: string; paragraphs: string[] } {
  const castleNight = [
    `You arrive. I meet you at the door, tour you through The Magic Castle — the bars, the Parlour of Prestidigitation, the Palace. Then I'll perform a highlight version of my show for you in the Museum Theater (small, intimate, close-up at conversation distance). We'll catch other shows around the Castle for a few hours and connect along the way.`,
  ];
  const accessTerms = `You and up to one guest come on my pass — no $45 door fee, no required dinner reservations, no pressure to spend a dollar inside. The Castle is members-only, so this is the cleanest way to get in.`;

  if (tier === "newsletter") {
    return {
      subject: `${firstName} — the Castle on me this summer?`,
      preheader: `A real evening with me at the Magic Castle.`,
      paragraphs: [
        `${firstName},`,
        `Wanted to extend you a real invitation. A few nights a month I host guests — usually planners, agents, PR folks, fundraisers, people who work in the same world you do — at the Magic Castle in Hollywood. Yes, this is partly business; if we hit it off and an event comes up, I'd hope to be on your shortlist. But the night itself has zero strings. The point is a real evening together, some magic, and meeting other people doing interesting work in the city.`,
        accessTerms,
        `Here's the night:`,
        ...castleNight,
        `If a Castle night sounds like a fit, send me two or three weekday evenings that work for you this summer and I'll lock one of them in.`,
      ],
    };
  }
  if (tier === "paused") {
    return {
      subject: `${firstName} — better way to talk than email`,
      preheader: `The Castle on me, this summer.`,
      paragraphs: [
        `${firstName},`,
        `You clicked through to my booking page at some point and we never connected — which is on me, not you. Inbox traffic happens.`,
        `Different approach: a few nights a month I host event professionals — planners, agents, PR folks, fundraisers — at the Magic Castle in Hollywood. Yes, this is partly business; you already know I'd love to work with you on an event. But the night itself has zero strings, and it's a much better way to see if there's a real fit than another email exchange.`,
        accessTerms,
        `Here's the night:`,
        ...castleNight,
        `Send me two or three weekday evenings that work for you this summer and I'll lock one of them in.`,
      ],
    };
  }
  if (tier === "active") {
    return {
      subject: `${firstName} — skip the rest of my emails?`,
      preheader: `The Castle on me this summer instead.`,
      paragraphs: [
        `${firstName},`,
        `Quick one. You're a few emails into one of my sequences and I'd rather not let it just play out.`,
        `A few nights a month I host event professionals — planners, agents, PR folks, fundraisers — at the Magic Castle in Hollywood. Yes, this is partly business; if there's a fit, I'd love to work on an event with you. But the night itself has zero strings, and it skips past every other email I was going to send.`,
        accessTerms,
        `Here's the night:`,
        ...castleNight,
        `Send me two or three weekday evenings that work for you this summer and I'll lock one of them in.`,
      ],
    };
  }
  // completed
  return {
    subject: `${firstName} — different ask`,
    preheader: `The Castle on me, this summer.`,
    paragraphs: [
      `${firstName},`,
      `You've seen a few notes from me over the past months. Quiet from your side, which is fine — most of mine fall into the same category in other people's inboxes.`,
      `One different ask before I file this away. A few nights a month I host event professionals — planners, agents, PR folks, fundraisers — at the Magic Castle in Hollywood. Yes, this is partly business; I'd love to find the right event to work on with you. But the night itself has zero strings, and it'll tell you more in three hours than three more emails ever will.`,
      accessTerms,
      `Here's the night:`,
      ...castleNight,
      `Send me two or three weekday evenings that work for you this summer and I'll lock one of them in.`,
    ],
  };
}

function renderPlainHtml(preheader: string, paragraphs: string[], email: string, contactId: string): string {
  const openPixel = `<img src="${OPEN_TRACK_URL}?cid=${contactId}&step=castle" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;
  const body = paragraphs.map((p) => `<p>${p}</p>`).join("\n");
  const sig = `<p class="sig">
Scott Syme<br>
Magician<br>
<a href="tel:+14243941850" class="plain">(424) 394-1850</a><br>
<a href="https://whiterabbitla.com" class="plain">whiterabbitla.com</a>
</p>`;
  const legal = `<div class="legal">
White Rabbit LA · 7393 W. Manchester Ave #209, Los Angeles, CA 90045<br>
<a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a>
</div>`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{margin:0;padding:16px;background:#fff;font-family:${PLAIN_FONT};font-size:15px;line-height:1.5;color:#000}
.wrap{max-width:600px;margin:0 auto}
p{margin:0 0 16px}
.sig{margin:24px 0 0}
a{color:#1a0dab}
a.plain{color:#000;text-decoration:none}
.preheader{display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fff}
.legal{margin-top:28px;padding-top:16px;border-top:1px solid #eee;font-size:11px;line-height:1.5;color:#888}
.legal a{color:#888;text-decoration:underline}
</style></head>
<body>
<div class="preheader">${preheader}</div>
<div class="wrap">
${body}
${sig}
${legal}
</div>
${openPixel}
</body></html>`;
}

function renderPlainText(paragraphs: string[]): string {
  return paragraphs.join("\n\n") + `\n\nScott Syme\nMagician\n(424) 394-1850\nwhiterabbitla.com`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth gate — required before any DB read/write or Resend send.
    // Accepted: x-cron-secret header / body.cron_secret === CRON_SECRET,
    // or body.adminPassword === ADMIN_PASSWORD.
    const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
    const adminPasswordEnv = Deno.env.get("ADMIN_PASSWORD") ?? "";
    let dryRun = false;
    let adminOk = false;
    let cronOk = req.headers.get("x-cron-secret") === cronSecret && cronSecret.length > 0;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      dryRun = !!body.dryRun;
      adminOk = adminPasswordEnv.length > 0 && body.adminPassword === adminPasswordEnv;
      cronOk = cronOk || (cronSecret.length > 0 && body.cron_secret === cronSecret);
    }
    if (!adminOk && !cronOk) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;


    // Send window guard: weekdays, after 10 AM PT
    const now = new Date();
    const pacificDay = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(now);
    const pacificHour = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", hour12: false }).format(now), 10);
    const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(pacificDay);
    if (!dryRun && (!isWeekday || pacificHour < 10)) {
      return new Response(JSON.stringify({ sent: 0, skipped: true, reason: `Outside window (${pacificDay} ${pacificHour}:00 PT)` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count what we've already sent today (PT)
    const todayPT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);
    const todayStartISO = new Date(`${todayPT}T00:00:00-08:00`).toISOString();
    const { count: sentTodayCount } = await supabase
      .from("cold_email_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("campaign_track", "castle_invite_la")
      .gte("castle_invited_at", todayStartISO);
    const sentToday = sentTodayCount ?? 0;
    const remaining = Math.max(0, DAILY_CAP - sentToday);
    if (remaining === 0) {
      return new Response(JSON.stringify({ sent: 0, sentToday, message: "Daily cap reached" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sentByTier: Record<string, number> = {};
    let totalSent = 0;
    const errors: string[] = [];

    for (const tier of TIER_ORDER) {
      if (totalSent >= remaining) break;
      const budget = remaining - totalSent;

      const { data: batch, error: fetchErr } = await supabase
        .from("cold_email_campaigns")
        .select("id, email, name, first_name")
        .eq("campaign_track", "castle_invite_la")
        .eq("castle_tier", tier)
        .is("castle_invite_status", null)
        .order("created_at", { ascending: true })
        .limit(budget);
      if (fetchErr) throw fetchErr;
      if (!batch || batch.length === 0) continue;

      for (const row of batch) {
        const rawFirst = row.first_name?.trim();
        const firstName = (rawFirst && rawFirst.length > 0) ? rawFirst : extractFirstName(row.name, row.email);
        const tpl = buildTemplate(tier, firstName);
        const html = renderPlainHtml(tpl.preheader, tpl.paragraphs, row.email, row.id);
        const text = renderPlainText(tpl.paragraphs);
        const oneClickUrl = `https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/unsubscribe-oneclick?email=${encodeURIComponent(row.email)}`;

        if (dryRun) {
          totalSent++;
          sentByTier[tier] = (sentByTier[tier] ?? 0) + 1;
          continue;
        }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_KEY}` },
          body: JSON.stringify({
            from: "Scott Syme <scott.syme@whiterabbitla.com>",
            reply_to: "scott.syme@whiterabbitla.com",
            to: row.email,
            subject: tpl.subject,
            html,
            text,
            headers: {
              "List-Unsubscribe": `<mailto:unsubscribe@whiterabbitla.com?subject=unsubscribe>, <${oneClickUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
        });

        if (res.ok) {
          await supabase
            .from("cold_email_campaigns")
            .update({
              castle_invite_status: "invited",
              castle_invited_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", row.id);
          totalSent++;
          sentByTier[tier] = (sentByTier[tier] ?? 0) + 1;
        } else {
          const errBody = await res.text();
          console.error(`castle-invite-send: ${row.email}: ${errBody}`);
          errors.push(`${row.email}: ${errBody.slice(0, 200)}`);
        }
      }
    }

    // Upsert per-tier daily log row
    if (!dryRun) {
      for (const [tier, count] of Object.entries(sentByTier)) {
        const { data: existing } = await supabase
          .from("castle_invite_log")
          .select("id, sent")
          .eq("log_date", todayPT)
          .eq("tier", tier)
          .maybeSingle();
        if (existing) {
          await supabase
            .from("castle_invite_log")
            .update({ sent: (existing.sent ?? 0) + count })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("castle_invite_log")
            .insert({ log_date: todayPT, tier, sent: count });
        }
      }
    }

    return new Response(JSON.stringify({ sent: totalSent, sentToday: sentToday + totalSent, sentByTier, errors, dryRun }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("castle-invite-send error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
