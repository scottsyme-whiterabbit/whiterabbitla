import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-email-logo.png";

function extractFirstName(name: string | null | undefined): string {
  if (!name) return "there";
  if (name.includes(" and ") || name.includes(" & ")) return name;
  if (name.trim().toLowerCase().endsWith("team")) return name;
  return name.split(" ")[0];
}

const SITE_URL = "https://whiterabbitla.com";
const TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-click";
const OPEN_TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-open";

// Monthly cadence: ~30 days between each email
const NURTURE_INTERVAL_DAYS = 30;
const DAILY_SEND_CAP = 50;

type CampaignCategory = "corporate_planner" | "wedding_planner" | "country_club" | "pr_agency" | "nonprofit" | "talent_management" | "restaurant" | "spirits";

interface NurtureCampaign {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  campaign_category: CampaignCategory;
  status: string;
  nurture_step: number;
  nurture_status: string;
  nurture_started_at: string | null;
  nurture_last_sent_at: string | null;
  last_email_sent_at: string | null;
}

// ═══════════════════════════════════════════════
// SHARED HELPERS (copied from cold-drip)
// ═══════════════════════════════════════════════

function signoff(): string {
  return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">White Rabbit · Los Angeles</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);">(424) 394-1850 · scott.syme@whiterabbitla.com</span>
</p>`;
}

function signoffFull(): string {
  return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott Syme<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">White Rabbit · Los Angeles</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);">whiterabbitla.com · (424) 394-1850</span>
</p>`;
}

function trackedLink(url: string, text: string, contactId: string, step: number, campaign: string): string {
  const sep = url.includes("?") ? "&" : "?";
  const taggedUrl = `${url}${sep}utm_source=email&utm_medium=nurture-drip&utm_campaign=${encodeURIComponent(campaign)}&utm_content=nurture-${step}`;
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${100 + step}&r=${encodeURIComponent(taggedUrl)}`;
  return `<a href="${trackingUrl}" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);" target="_blank">${text}</a>`;
}

const BOOKING_URL = `${SITE_URL}/booking`;

function bookCallCTA(contactId: string, step: number, campaign: string, label: string = "Book a Call"): string {
  const sep = BOOKING_URL.includes("?") ? "&" : "?";
  const taggedUrl = `${BOOKING_URL}${sep}utm_source=email&utm_medium=nurture-drip&utm_campaign=${encodeURIComponent(campaign)}&utm_content=nurture-${step}`;
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${100 + step}&r=${encodeURIComponent(taggedUrl)}`;
  return `<p style="margin:24px 0 0; text-align:center;">
<a href="${trackingUrl}" target="_blank" style="display:inline-block; padding:12px 32px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C9A3A8; text-decoration:none; font-weight:bold; border:1px solid #C9A3A8; border-radius:2px;">${label}</a>
</p>`;
}

function wrapEmail(preheader: string, innerHtml: string, email: string, contactId: string, step: number): string {
  const openPixel = `<img src="${OPEN_TRACK_URL}?cid=${contactId}&step=${100 + step}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
body { margin: 0; padding: 0; width: 100% !important; background-color: #335747; }
@media screen and (max-width: 600px) {
  .email-container { width: 100% !important; }
  .padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body style="margin:0; padding:0; background-color:#335747;">
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#335747;">${preheader}</div>
<center style="width:100%; background-color:#335747;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#335747;">
<tr><td style="padding: 30px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" align="center" class="email-container" style="max-width:560px; margin:auto; background-color:#223D34; border-radius:4px;">

<!-- Logo -->
<tr><td style="padding: 40px 40px 24px; text-align:center;" class="padding-mobile">
<img src="${LOGO_URL}" alt="White Rabbit" width="90" style="width:90px; height:auto; display:block; margin:0 auto;" />
</td></tr>

${innerHtml}

<!-- Footer -->
<tr><td style="padding: 0 40px;" class="padding-mobile">
<hr style="border:none; border-top:1px solid rgba(201,163,168,0.15); margin:0 0 24px;" />
</td></tr>
<tr><td style="padding: 0 40px 12px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:12px; color:rgba(245,240,232,0.4);">
White Rabbit · Los Angeles<br/>
7393 W. Manchester Ave #209, Los Angeles, CA 90045<br/>
<a href="mailto:events@whiterabbitla.com" style="color:#C9A3A8; text-decoration:none;">events@whiterabbitla.com</a> · <a href="tel:+14243941850" style="color:rgba(248,245,240,0.4); text-decoration:none;">(424) 394-1850</a>
</p>
</td></tr>
<tr><td style="padding: 0 40px 32px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:11px; color:rgba(245,240,232,0.25);">
<a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}" style="color:rgba(245,240,232,0.3); text-decoration:underline;">Unsubscribe</a>
</p>
</td></tr>

</table>
</td></tr></table>
</center>
${openPixel}
</body></html>`;
}

function bodyCell(html: string): string {
  return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
${html}
</td></tr>`;
}

// ═══════════════════════════════════════════════
// NURTURE TEMPLATES — 4 monthly emails per category
// Fires AFTER cold drip completes (all 4 cold emails sent)
// ═══════════════════════════════════════════════

function getNurtureEmail(category: CampaignCategory, step: number, name: string, contactId: string): { subject: string; preheader: string; innerHtml: string } {
  const firstName = extractFirstName(name);
  const cta = bookCallCTA(contactId, step, `nurture-${category}`);
  const ctaGrab = bookCallCTA(contactId, step, `nurture-${category}`, "Grab a Time");

  const TEMPLATES: Record<string, Array<{ subject: string; preheader: string; innerHtml: string }>> = {
    // ═══════════════════════════════════════════════
    // CORPORATE PLANNER NURTURE
    // ═══════════════════════════════════════════════
    corporate_planner: [
      {
        subject: "400 phones went face-down",
        preheader: "What happened at the Morgan Stanley dinner.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I performed at a Morgan Stanley dinner recently. 400 people — sharp, skeptical, not easily impressed.</p>
<p style="margin:0 0 18px;">Within 90 seconds of starting close-up magic at the tables, every phone in the room went face-down. Not because anyone asked — because what was happening three feet away was more interesting than anything on the screen.</p>
<p style="margin:0 0 18px;">The conversations at dinner were different after that. People were looser, more connected. I have seen the same thing at Rivian, Rolls-Royce, and events in New York. When something unexpected happens up close, the room resets.</p>
<p style="margin:0 0 18px;">Worth a quick conversation if you are planning anything where the energy in the room matters.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/why-cocktail-hour-entertainment-matters`, "Why Cocktail Hour Entertainment Changes Everything", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Your Q4 dates are going fast",
        preheader: "Holiday parties, galas, client dinners — best dates book early.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">My calendar is filling up for the fall. Holiday parties, year-end galas, and client dinners all tend to cluster between October and December, and the best dates go fast.</p>
<p style="margin:0 0 18px;">Rivian booked months in advance, which gave us time to tailor the experience to their audience and event flow. Even if your event is still a maybe — it is worth a 15-minute call to hold a date and talk through the format, audience, and style so there are no surprises.</p>
${ctaGrab}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/corporate-entertainment-trends-2026`, "Corporate Entertainment Trends Worth Knowing", contactId, step, `nurture-${category}`)}</p>
${signoff()}`),
      },
      {
        subject: "3 entertainment mistakes smart planners avoid",
        preheader: "After Morgan Stanley, Rivian, Rolls-Royce — the patterns are clear.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">After performing at hundreds of corporate events, I have noticed three things that trip up even experienced planners:</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">1. Wrong time slot.</strong> Transitions work 10x better than a standalone entertainment block. Cocktail hour, between courses, during a reception — those natural pauses are when magic hits hardest.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">2. Stage when it should be close-up.</strong> Under 200 guests, tables and small groups create connection. A stage creates distance. The intimacy is the whole point.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">3. Treating entertainment as decoration.</strong> The real value is not what happens during the performance — it is what happens after. Eight people who just saw something impossible together now have something to talk about.</p>
<p style="margin:0 0 18px;">I put together a guide called the ${trackedLink(`${SITE_URL}/hosts-playbook`, "Host's Playbook", contactId, step, `nurture-${category}`)} that covers more of this.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/entertainment-gap-planners-dont-know`, "The Entertainment Gap Planners Don't Know They Have", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Valet stand to Rolls-Royce",
        preheader: "The unlikely path to White Rabbit LA.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Before White Rabbit LA — I was in real estate. Before that — I was parking cars.</p>
<p style="margin:0 0 18px;">Magic was always on the side — at the valet stand, at open mics, anywhere someone would watch. What I learned parking cars for people arriving at luxury events: the experience starts before the front door.</p>
<p style="margin:0 0 18px;">Today I perform for Morgan Stanley, Rivian, and Rolls-Royce. I have performed at Soho House and the Jonathan Club. But the approach is the same: make every person feel like the most important one in the room.</p>
<p style="margin:0 0 18px;">If that is the kind of energy your next event needs, let's talk.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/how-to-choose-entertainment-for-luxury-event`, "How to Choose Entertainment for a Luxury Event", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // PLACEHOLDER: Other categories (to be added in follow-up prompts)
    // ═══════════════════════════════════════════════
  };

  const templates = TEMPLATES[category];
  if (!templates || step < 0 || step >= templates.length) {
    return { subject: "", preheader: "", innerHtml: "" };
  }
  return templates[step];
}

// ═══════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle preview requests
    if (req.method === "POST") {
      const body = await req.json();
      if (body.action === "preview") {
        const { category, step } = body;
        if (!category || step === undefined) {
          return new Response(JSON.stringify({ error: "category and step required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const previewName = body.previewName || "Kevin";
        const template = getNurtureEmail(category as CampaignCategory, step, previewName, "preview");
        if (!template.subject) {
          return new Response(JSON.stringify({ error: "No template found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const html = wrapEmail(template.preheader, template.innerHtml, "preview@example.com", "preview", step);
        return new Response(JSON.stringify({ subject: template.subject, body_html: html }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Send window guard: only send on Tue/Wed/Thu Pacific
    const pacificDay = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(new Date());
    if (!["Tue", "Wed", "Thu"].includes(pacificDay)) {
      return new Response(JSON.stringify({ sent: 0, skipped: 0, completed: 0, message: `Skipped: ${pacificDay} is outside the Tue-Thu send window` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
    const now = new Date();
    let sent = 0;
    let skipped = 0;
    let completed = 0;
    let backlogged = 0;
    let enrolled = 0;
    let dailyCapReached = false;

    // Count nurture emails already sent today (Pacific time)
    const todayPacific = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);
    const todayStart = new Date(`${todayPacific}T00:00:00-08:00`).toISOString();
    const { count: sentTodayCount } = await supabase
      .from("cold_email_campaigns")
      .select("id", { count: "exact", head: true })
      .gte("nurture_last_sent_at", todayStart);
    const sentToday = sentTodayCount ?? 0;

    // Step 1: Auto-enroll completed cold campaigns that haven't started nurture yet
    // Must be completed AND at least 30 days since last cold email
    const { data: newNurtures, error: enrollErr } = await supabase
      .from("cold_email_campaigns")
      .select("id, last_email_sent_at")
      .eq("status", "completed")
      .eq("nurture_status", "pending");

    if (enrollErr) throw enrollErr;

    if (newNurtures && newNurtures.length > 0) {
      for (const campaign of newNurtures) {
        if (campaign.last_email_sent_at) {
          const daysSinceCompletion = (now.getTime() - new Date(campaign.last_email_sent_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceCompletion >= 30) {
            await supabase
              .from("cold_email_campaigns")
              .update({
                nurture_status: "active",
                nurture_started_at: now.toISOString(),
                updated_at: now.toISOString(),
              })
              .eq("id", campaign.id);
            enrolled++;
          }
        }
      }
    }

    // Step 2: Process active nurture campaigns
    const { data: campaigns, error: fetchErr } = await supabase
      .from("cold_email_campaigns")
      .select("*")
      .eq("nurture_status", "active")
      .lt("nurture_step", 4);

    if (fetchErr) throw fetchErr;
    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: 0, completed: 0, enrolled, message: "No active nurture campaigns" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const campaign of campaigns as NurtureCampaign[]) {
      const step = campaign.nurture_step;
      const lastSent = campaign.nurture_last_sent_at ? new Date(campaign.nurture_last_sent_at) : null;

      // Step 0: send immediately if just enrolled
      if (step === 0 && !lastSent) {
        // First nurture email — send now
      } else if (step >= 4) {
        await supabase.from("cold_email_campaigns").update({ nurture_status: "completed" }).eq("id", campaign.id);
        completed++;
        continue;
      } else {
        // Monthly cadence: 30 days between each nurture email
        if (!lastSent) { skipped++; continue; }
        const daysSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLast < NURTURE_INTERVAL_DAYS) {
          skipped++;
          continue;
        }
      }

      // Skip categories without templates yet
      const template = getNurtureEmail(campaign.campaign_category as CampaignCategory, step, campaign.name || "", campaign.id);
      if (!template.subject) { skipped++; continue; }

      // Daily send cap check
      if (sentToday + sent >= DAILY_SEND_CAP) {
        dailyCapReached = true;
        backlogged++;
        continue;
      }

      const html = wrapEmail(template.preheader, template.innerHtml, campaign.email, campaign.id, step);

      // Send via Resend
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: "Scott Syme <scott.syme@whiterabbitla.com>",
          reply_to: "scott.syme@whiterabbitla.com",
          to: campaign.email,
          subject: template.subject,
          html,
          headers: {
            "List-Unsubscribe": `<${SITE_URL}/unsubscribe?email=${encodeURIComponent(campaign.email)}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        }),
      });

      if (emailRes.ok) {
        const nextStep = step + 1;
        const updates: Record<string, unknown> = {
          nurture_step: nextStep,
          nurture_last_sent_at: now.toISOString(),
          updated_at: now.toISOString(),
        };
        if (nextStep >= 4) {
          updates.nurture_status = "completed";
          completed++;
        }
        await supabase.from("cold_email_campaigns").update(updates).eq("id", campaign.id);
        sent++;
        console.log(`Nurture drip: sent step ${step} to ${campaign.email} (${campaign.campaign_category})`);
      } else {
        const errBody = await emailRes.text();
        console.error(`Nurture drip: failed to send to ${campaign.email}: ${errBody}`);
        skipped++;
      }
    }

    return new Response(JSON.stringify({ sent, skipped, completed, enrolled, backlogged, dailyCapReached, sentToday }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("nurture-drip error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
