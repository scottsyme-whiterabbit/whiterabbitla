import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-email-logo.png";
const SITE_URL = "https://whiterabbitla.com";
const TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-click";
const OPEN_TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-open";

// Day offsets: Email 1 immediately (0), Email 2 day 3, Email 3 day 14, Email 4 day 90
const POST_SHOW_SCHEDULE = [0, 3, 14, 90];

function utmUrl(url: string, campaign: string, content: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=email&utm_medium=drip&utm_campaign=${encodeURIComponent(campaign)}&utm_content=${encodeURIComponent(content)}`;
}

function trackedLink(url: string, text: string, contactId: string, step: number): string {
  const taggedUrl = utmUrl(url, "post-show", `step-${step}`);
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${step}&r=${encodeURIComponent(taggedUrl)}`;
  return `<a href="${trackingUrl}" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);" target="_blank">${text}</a>`;
}

function trackedCTA(url: string, label: string, contactId: string, step: number): string {
  const taggedUrl = utmUrl(url, "post-show", `step-${step}-cta`);
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${step}&r=${encodeURIComponent(taggedUrl)}`;
  return `<p style="margin:24px 0 0; text-align:center;">
<a href="${trackingUrl}" target="_blank" style="display:inline-block; padding:14px 32px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#1e352c; background-color:#C9A3A8; text-decoration:none; font-weight:bold; border-radius:2px;">${label}</a>
</p>`;
}

function signoff(italic = false): string {
  return `${italic ? '<p style="margin:0 0 4px; font-family:Georgia,serif; font-size:15px; color:rgba(245,240,232,0.6); font-style:italic;">With gratitude,</p>' : ''}
<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott Syme<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">White Rabbit · Los Angeles</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);">(424) 394-1850 · scott.syme@whiterabbitla.com</span>
</p>`;
}

function wrapEmail(preheader: string, innerHtml: string, email: string, contactId: string, step: number): string {
  const openPixel = `<img src="${OPEN_TRACK_URL}?cid=${contactId}&step=${step}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;
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

// ═══════════════════════════════════════════════
// POST-SHOW TEMPLATES
// ═══════════════════════════════════════════════

interface Deal {
  id: string;
  contact_email: string;
  contact_name: string | null;
  company: string | null;
  event_type: string | null;
  event_date: string | null;
  location: string | null;
  post_show_step: number;
  post_show_started_at: string | null;
}

function getSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "the holidays";
}

function getSeasonalHook(): string {
  const season = getSeason();
  switch (season) {
    case "spring": return "Spring is one of my busiest seasons — corporate retreats, fundraisers, and outdoor celebrations start filling the calendar fast.";
    case "summer": return "Summer events are some of my favorites — rooftop parties, destination weddings, and company picnics with a twist.";
    case "fall": return "Fall is when the best events happen — galas, holiday party planning starts, and the energy is incredible.";
    default: return "The holiday season is right around the corner — and the best dates book months in advance.";
  }
}

function email1ThankYou(deal: Deal): { subject: string; preheader: string; html: string } {
  const name = deal.contact_name?.split(" ")[0] || "there";
  const STANDARD_TYPES = ["corporate", "wedding", "private party", "parlor show", "other"];
  const rawType = deal.event_type?.replace(/_/g, " ") || "";
  const isStandard = STANDARD_TYPES.includes(rawType.toLowerCase());
  const eventLabel = rawType ? (isStandard ? `your ${rawType}` : rawType) : "your event";
  const contactId = deal.id;

  const innerHtml = `<!-- Headline -->
<tr><td style="padding: 0 40px 0; text-align:center;" class="padding-mobile">
<h1 style="margin:0; font-family:Georgia,serif; font-size:26px; font-weight:normal; color:#F5F0E8; letter-spacing:0.02em; line-height:1.3;">
Thank You, ${name}
</h1>
</td></tr>

<!-- Divider -->
<tr><td style="padding: 20px 40px 0; text-align:center;" class="padding-mobile">
<div style="width:40px; height:1px; background-color:#C9A3A8; margin:0 auto;"></div>
</td></tr>

<tr><td style="padding: 20px 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">It was a genuine pleasure performing at ${eventLabel}. I hope the magic created a few moments your guests will be talking about for a while.</p>
<p style="margin:0 0 18px;">Every event is different, and yours had a special energy. Those are the nights that remind me why I do this.</p>
<p style="margin:0 0 18px;">If you have a moment, I'd love to hear what stood out. And if you'd like to share the experience with others, a quick note would mean the world.</p>
${trackedCTA(`${SITE_URL}/review`, "Share Your Experience", contactId, 0)}
<p style="margin:24px 0 18px;">And of course — if you ever need entertainment for a future event, or know someone who does, I'm always just an email away.</p>
${signoff(true)}
</td></tr>`;

  return {
    subject: `Thank you for having me, ${name}`,
    preheader: "It was a genuine pleasure. Thank you.",
    html: wrapEmail("It was a genuine pleasure. Thank you.", innerHtml, deal.contact_email, contactId, 0),
  };
}

function email2Review(deal: Deal): { subject: string; preheader: string; html: string } {
  const name = deal.contact_name?.split(" ")[0] || "there";
  const contactId = deal.id;
  const reviewLink = trackedLink(`${SITE_URL}/review`, "Leave a quick review", contactId, 1);

  const innerHtml = `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">A small favor — if the experience lived up to your expectations, a quick Google review means the world to me. It's how other hosts find White Rabbit, and it truly makes a difference.</p>
<p style="margin:0 0 18px;">Takes about 30 seconds: ${reviewLink}</p>
${trackedCTA(`${SITE_URL}/review`, "Leave a Review", contactId, 1)}
<p style="margin:24px 0 18px;">Either way, thank you again for trusting me with your event. It was a great night.</p>
${signoff()}
</td></tr>`;

  return {
    subject: "A small favor",
    preheader: "If the experience lived up to your expectations...",
    html: wrapEmail("If the experience lived up to your expectations...", innerHtml, deal.contact_email, contactId, 1),
  };
}

function email3Referral(deal: Deal): { subject: string; preheader: string; html: string } {
  const name = deal.contact_name?.split(" ")[0] || "there";
  const contactId = deal.id;
  const STANDARD_TYPES = ["corporate", "wedding", "private party", "parlor show", "other"];
  const rawType = deal.event_type?.replace(/_/g, " ") || "";
  const isStandard = STANDARD_TYPES.includes(rawType.toLowerCase());
  const eventLabel = rawType ? (isStandard ? `your ${rawType}` : rawType) : "your event";
  const referLink = trackedLink(`${SITE_URL}/refer`, "Share White Rabbit", contactId, 2);

  const innerHtml = `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">I keep thinking about ${eventLabel} — those are the nights that remind me why I love this work.</p>
<p style="margin:0 0 18px;">If anyone in your network is planning something special — a corporate event, a wedding, a milestone celebration — I'd love to be the first name you share. Word of mouth from hosts like you is how I've built everything.</p>
<p style="margin:0 0 18px;">${referLink}</p>
${trackedCTA(`${SITE_URL}/refer`, "Refer a Friend", contactId, 2)}
<p style="margin:24px 0 18px;">Thank you for being part of the White Rabbit story.</p>
${signoff()}
</td></tr>`;

  return {
    subject: "Know someone planning an event?",
    preheader: "Word of mouth from hosts like you means everything.",
    html: wrapEmail("Word of mouth from hosts like you means everything.", innerHtml, deal.contact_email, contactId, 2),
  };
}

function email4Reengage(deal: Deal): { subject: string; preheader: string; html: string } {
  const name = deal.contact_name?.split(" ")[0] || "there";
  const contactId = deal.id;
  const season = getSeason();
  const seasonalHook = getSeasonalHook();
  const calendarLink = trackedLink("https://calendar.app.google/58WjggPt3RFAcJjq8", "grab a time here", contactId, 3);

  const innerHtml = `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Planning anything for ${season}?</p>
<p style="margin:0 0 18px;">${seasonalHook}</p>
<p style="margin:0 0 18px;">As a repeat client, I always make sure to hold priority availability. If you're thinking about another event — even just exploring the idea — I'd love to chat early so we can lock in the best date.</p>
<p style="margin:0 0 18px;">No pressure at all. Just ${calendarLink} or reply to this email.</p>
${trackedCTA("https://calendar.app.google/58WjggPt3RFAcJjq8", "Book a Call", contactId, 3)}
<p style="margin:24px 0 18px;">Hope you've been well.</p>
${signoff()}
</td></tr>`;

  return {
    subject: `Planning anything for ${season}?`,
    preheader: "Priority availability for repeat clients.",
    html: wrapEmail("Priority availability for repeat clients.", innerHtml, deal.contact_email, contactId, 3),
  };
}

// ═══════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all completed deals that still need post-show emails
    const { data: deals, error: fetchErr } = await supabase
      .from("deals")
      .select("id, contact_email, contact_name, company, event_type, event_date, location, post_show_step, post_show_started_at")
      .eq("stage", "completed")
      .lt("post_show_step", 4)
      .order("updated_at", { ascending: true });

    if (fetchErr) throw fetchErr;
    if (!deals?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No completed deals to follow up" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    let sent = 0;
    const errors: string[] = [];

    for (const deal of deals) {
      try {
        // Initialize post_show_started_at if not set (first time seeing this completed deal)
        let startedAt: Date;
        if (!deal.post_show_started_at) {
          startedAt = now;
          await supabase
            .from("deals")
            .update({ post_show_started_at: now.toISOString() })
            .eq("id", deal.id);
        } else {
          startedAt = new Date(deal.post_show_started_at);
        }

        const currentStep = deal.post_show_step;
        const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
        const requiredDays = POST_SHOW_SCHEDULE[currentStep];

        // Not time yet
        if (daysSinceStart < requiredDays) continue;

        let subject: string;
        let html: string;

        switch (currentStep) {
          case 0: {
            const e = email1ThankYou(deal as Deal);
            subject = e.subject;
            html = e.html;
            break;
          }
          case 1: {
            const e = email2Review(deal as Deal);
            subject = e.subject;
            html = e.html;
            break;
          }
          case 2: {
            const e = email3Referral(deal as Deal);
            subject = e.subject;
            html = e.html;
            break;
          }
          case 3: {
            const e = email4Reengage(deal as Deal);
            subject = e.subject;
            html = e.html;
            break;
          }
          default:
            continue;
        }

        // Send via Resend
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Scott Syme <scott.syme@whiterabbitla.com>",
            reply_to: "events@whiterabbitla.com",
            to: [deal.contact_email],
            subject,
            html,
            headers: {
              "List-Unsubscribe": `<${SITE_URL}/unsubscribe?email=${encodeURIComponent(deal.contact_email)}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          errors.push(`${deal.contact_email}: Resend error ${errText}`);
          continue;
        }

        // Log the send
        await supabase.from("newsletter_send_log").insert({
          campaign_id: `post-show-${currentStep}`,
          contact_id: deal.id,
          status: "sent",
        });

        // Advance the step
        await supabase
          .from("deals")
          .update({ post_show_step: currentStep + 1 })
          .eq("id", deal.id);

        sent++;
        console.log(`Sent post-show step ${currentStep} to ${deal.contact_email}`);
      } catch (e) {
        errors.push(`${deal.contact_email}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    return new Response(JSON.stringify({ sent, total: deals.length, errors }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("post-show-sequence error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
