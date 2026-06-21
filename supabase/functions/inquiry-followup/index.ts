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
const CALENDAR_URL = "https://calendar.app.google/58WjggPt3RFAcJjq8";

// Day offsets: Email 1 at day 1, Email 2 at day 3, Email 3 at day 7
const FOLLOWUP_SCHEDULE = [1, 3, 7];

function pickVariant(): "A" | "B" {
  return Math.random() < 0.5 ? "A" : "B";
}

function utmUrl(url: string, campaign: string, content: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=email&utm_medium=drip&utm_campaign=${encodeURIComponent(campaign)}&utm_content=${encodeURIComponent(content)}`;
}

function trackedLink(url: string, text: string, contactId: string, step: number): string {
  const taggedUrl = utmUrl(url, "inquiry-followup", `step-${step}`);
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${step}&r=${encodeURIComponent(taggedUrl)}`;
  return `<a href="${trackingUrl}" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);" target="_blank">${text}</a>`;
}

function bookCallCTA(step: number): string {
  const url = utmUrl(CALENDAR_URL, "inquiry-followup", `step-${step}-book-call`);
  return `<p style="margin:18px 0 0; text-align:center;">
<a href="${url}" target="_blank" style="display:inline-block; padding:12px 32px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C9A3A8; text-decoration:none; font-weight:bold; border:1px solid #C9A3A8; border-radius:2px;">Book a Call</a>
</p>`;
}

function signoff(): string {
  return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott Syme<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">Magician</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);"><a href="tel:+14243941850" style="color:rgba(245,240,232,0.35); text-decoration:none;">(424) 394-1850</a></span><br/>
<span style="font-size:12px;"><a href="https://whiterabbitla.com" style="color:rgba(245,240,232,0.35); text-decoration:none;">whiterabbitla.com</a></span>
</p>`;
}

function wrapEmail(preheader: string, innerHtml: string, email: string, contactId: string, step: number, campaignId?: string, variant?: "A" | "B"): string {
  const openPixel = `<img src="${OPEN_TRACK_URL}?cid=${contactId}&step=${step}${campaignId ? `&cam=${encodeURIComponent(campaignId)}` : ""}${variant ? `&v=${variant}` : ""}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;
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
// INQUIRY FOLLOWUP TEMPLATES (3 emails)
// ═══════════════════════════════════════════════

interface Inquiry {
  id: string;
  email: string;
  name: string;
  event_type: string | null;
  date: string | null;
  location: string | null;
  guest_count: string | null;
  client_type: string | null;
  followup_step: number;
  followup_started_at: string | null;
  created_at: string;
}

function getEmail1(inquiry: Inquiry, variant?: "A" | "B"): { subjectA: string; subjectB: string; preheader: string; html: string } {
  const name = inquiry.name?.split(" ")[0] || "there";
  const eventType = inquiry.event_type || "event";
  const eventDate = inquiry.date || "";
  const contactId = inquiry.id;

  // Personalized body based on client type
  let personalLine = "";
  if (inquiry.client_type?.toLowerCase().includes("corporate") || inquiry.event_type?.toLowerCase().includes("corporate")) {
    personalLine = "I've worked with Netflix, Morgan Stanley, and Rolls-Royce on similar events — close-up magic during cocktails, full private shows after dinner, and everything in between.";
  } else if (inquiry.event_type?.toLowerCase().includes("wedding")) {
    personalLine = "Cocktail hour magic is one of my favorite things — it fills that gap when the couple is away for photos. Guests stay engaged, laughing, and talking about it all night.";
  } else if (inquiry.event_type?.toLowerCase().includes("private") || inquiry.event_type?.toLowerCase().includes("party")) {
    personalLine = "Private events are where the magic really shines — intimate settings, genuine reactions, and an experience your guests won't stop talking about.";
  } else {
    personalLine = "I've performed for Netflix, Morgan Stanley, and Rolls-Royce — from cocktail receptions to private dinner shows. Every event gets a custom approach.";
  }

  const calendarLink = trackedLink(CALENDAR_URL, "Here's my calendar", contactId, 0);

  const innerHtml = `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hi ${name},</p>
<p style="margin:0 0 18px;">I just saw your inquiry come through and wanted to reach out personally.</p>
<p style="margin:0 0 18px;">${personalLine}</p>
<p style="margin:0 0 18px;">I'd love to learn more about what you're envisioning. Open to a quick call this week? ${calendarLink}.</p>
${bookCallCTA(0)}
<p style="margin:18px 0 18px;">Looking forward to hearing from you.</p>
${signoff()}
</td></tr>`;

  return {
    subjectA: `Quick follow-up on your ${eventType}`,
    subjectB: eventDate ? `Thinking about your ${eventDate} event` : `Following up on your inquiry`,
    preheader: "I saw your inquiry and wanted to reach out personally.",
    html: wrapEmail("I saw your inquiry and wanted to reach out personally.", innerHtml, inquiry.email, contactId, 0),
  };
}

function getEmail2(inquiry: Inquiry): { subject: string; preheader: string; html: string } {
  const name = inquiry.name?.split(" ")[0] || "there";
  const contactId = inquiry.id;
  const deckLink = trackedLink(`${SITE_URL}/deck`, "our digital lookbook", contactId, 1);

  const innerHtml = `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Thought this might help as you're planning.</p>
<p style="margin:0 0 18px;">I put together ${deckLink} — it covers the different formats (close-up, parlor show, full stage), past clients, and what the experience actually looks like. It's a quick scroll, easy to share with your team or partner.</p>
<p style="margin:0 0 18px;">If anything sparks a question, just hit reply. Happy to jump on a call anytime.</p>
${bookCallCTA(1)}
${signoff()}
</td></tr>`;

  return {
    subject: "Thought this might help",
    preheader: "A quick lookbook to share with your team.",
    html: wrapEmail("A quick lookbook to share with your team.", innerHtml, inquiry.email, contactId, 1),
  };
}

function getEmail3(inquiry: Inquiry): { subject: string; preheader: string; html: string } {
  const name = inquiry.name?.split(" ")[0] || "there";
  const contactId = inquiry.id;
  const eventDate = inquiry.date;

  const dateLine = eventDate
    ? `I know ${eventDate} will be here before you know it, and I want to make sure we have time to put together something great.`
    : "I know event planning moves fast, and I want to make sure we have time to put together something great if you decide to move forward.";

  const innerHtml = `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Still thinking it over? No rush at all.</p>
<p style="margin:0 0 18px;">${dateLine}</p>
<p style="margin:0 0 18px;">If you have any questions — about formats, pricing, logistics, anything — I'm happy to help. Sometimes a quick 5-minute call clears everything up.</p>
<p style="margin:0 0 18px;">You can reach me directly at <a href="tel:+14243941850" style="color:#C9A3A8; text-decoration:none;">(424) 394-1850</a> or just reply here.</p>
${bookCallCTA(2)}
<p style="margin:18px 0 18px;">Either way, wishing you an incredible event.</p>
${signoff()}
</td></tr>`;

  return {
    subject: "Still thinking it over?",
    preheader: "No rush — just here if you need anything.",
    html: wrapEmail("No rush — just here if you need anything.", innerHtml, inquiry.email, contactId, 2),
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
    // Send window guard: only send on Tue/Wed/Thu Pacific
    const pacificDay = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(new Date());
    if (!["Tue", "Wed", "Thu"].includes(pacificDay)) {
      return new Response(JSON.stringify({ sent: 0, message: `Skipped: ${pacificDay} is outside the Tue-Thu send window` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all inquiries that need followup emails
    const { data: inquiries, error: fetchErr } = await supabase
      .from("contact_inquiries")
      .select("id, email, name, event_type, date, location, guest_count, client_type, followup_step, followup_started_at, created_at")
      .lt("followup_step", 3)
      .order("created_at", { ascending: true });

    if (fetchErr) throw fetchErr;
    if (!inquiries?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No inquiries to follow up" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    let sent = 0;
    const errors: string[] = [];

    for (const inquiry of inquiries) {
      try {
        // Initialize followup_started_at if not set
        const startedAt = inquiry.followup_started_at
          ? new Date(inquiry.followup_started_at)
          : new Date(inquiry.created_at);

        // If followup hasn't been started yet, set it now
        if (!inquiry.followup_started_at) {
          await supabase
            .from("contact_inquiries")
            .update({ followup_started_at: inquiry.created_at })
            .eq("id", inquiry.id);
        }

        const currentStep = inquiry.followup_step;
        const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
        const requiredDays = FOLLOWUP_SCHEDULE[currentStep];

        // Not time yet for this step
        if (daysSinceStart < requiredDays) continue;

        let subject: string;
        let html: string;
        let abVariant: string | null = null;

        switch (currentStep) {
          case 0: {
            const email1 = getEmail1(inquiry as Inquiry);
            const variant = pickVariant();
            abVariant = variant;
            subject = variant === "A" ? email1.subjectA : email1.subjectB;
            html = email1.html;
            break;
          }
          case 1: {
            const email2 = getEmail2(inquiry as Inquiry);
            subject = email2.subject;
            html = email2.html;
            break;
          }
          case 2: {
            const email3 = getEmail3(inquiry as Inquiry);
            subject = email3.subject;
            html = email3.html;
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
            to: [inquiry.email],
            subject,
            html,
            headers: {
              "List-Unsubscribe": `<${SITE_URL}/unsubscribe?email=${encodeURIComponent(inquiry.email)}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          errors.push(`${inquiry.email}: Resend error ${errText}`);
          continue;
        }

        // Log the send
        await supabase.from("newsletter_send_log").insert({
          campaign_id: `inquiry-followup-${currentStep}`,
          contact_id: inquiry.id,
          status: "sent",
          ab_variant: abVariant,
        });

        // Advance the step
        await supabase
          .from("contact_inquiries")
          .update({ followup_step: currentStep + 1 })
          .eq("id", inquiry.id);

        sent++;
        console.log(`Sent inquiry followup step ${currentStep} to ${inquiry.email}`);
      } catch (e) {
        errors.push(`${inquiry.email}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    return new Response(JSON.stringify({ sent, total: inquiries.length, errors }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("inquiry-followup error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
