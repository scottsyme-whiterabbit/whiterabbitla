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

// Days after followup completes for each general nurture email
// Step offset of 200 to keep tracking namespace separate from inquiry-followup (0-2) and nurture-drip (100+)
const NURTURE_OFFSETS = [30, 60, 90, 120];
const STEP_TRACK_OFFSET = 200;

interface Inquiry {
  id: string;
  email: string;
  name: string | null;
  event_type: string | null;
  date: string | null;
  nurture_step: number;
  nurture_started_at: string | null;
  followup_step: number;
  created_at: string;
}

function firstName(name: string | null | undefined): string {
  if (!name) return "there";
  if (name.includes(" and ") || name.includes(" & ")) return name;
  return name.split(" ")[0];
}

function trackedLink(url: string, text: string, contactId: string, step: number): string {
  const sep = url.includes("?") ? "&" : "?";
  const tagged = `${url}${sep}utm_source=email&utm_medium=inquiry-nurture&utm_campaign=stay-in-loop&utm_content=step-${step}`;
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${STEP_TRACK_OFFSET + step}&r=${encodeURIComponent(tagged)}`;
  return `<a href="${trackingUrl}" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);" target="_blank">${text}</a>`;
}

function signoff(): string {
  return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott Syme<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">Magician</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);"><a href="tel:+14243941850" style="color:rgba(245,240,232,0.35); text-decoration:none;">(424) 394-1850</a></span><br/>
<span style="font-size:12px;"><a href="https://whiterabbitla.com" style="color:rgba(245,240,232,0.35); text-decoration:none;">whiterabbitla.com</a></span>
</p>`;
}

function wrapEmail(preheader: string, innerHtml: string, email: string, contactId: string, step: number): string {
  const openPixel = `<img src="${OPEN_TRACK_URL}?cid=${contactId}&step=${STEP_TRACK_OFFSET + step}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
body { margin: 0; padding: 0; width: 100% !important; background-color: #335747; }
@media screen and (max-width: 600px) {
  .email-container { width: 100% !important; }
  .padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
}
</style></head>
<body style="margin:0; padding:0; background-color:#335747;">
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#335747;">${preheader}</div>
<center style="width:100%; background-color:#335747;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#335747;">
<tr><td style="padding: 30px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" align="center" class="email-container" style="max-width:560px; margin:auto; background-color:#223D34; border-radius:4px;">
<tr><td style="padding: 40px 40px 24px; text-align:center;" class="padding-mobile">
<img src="${LOGO_URL}" alt="White Rabbit" width="90" style="width:90px; height:auto; display:block; margin:0 auto;" />
</td></tr>
${innerHtml}
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
</table></td></tr></table></center>
${openPixel}
</body></html>`;
}

function bodyCell(html: string): string {
  return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
${html}
</td></tr>`;
}

// ═══════════════════════════════════════════════
// 4 GENERAL "STAY IN THE LOOP" EMAILS
// Not planner-specific. Story-driven. Soft.
// ═══════════════════════════════════════════════

function getEmail(step: number, inquiry: Inquiry): { subject: string; preheader: string; html: string } {
  const name = firstName(inquiry.name);
  const cid = inquiry.id;

  if (step === 0) {
    const inner = bodyCell(`<p style="margin:0 0 18px;">Hi ${name},</p>
<p style="margin:0 0 18px;">It has been a few weeks since you reached out, and I wanted to drop a quick note — no pitch, just a peek behind the curtain.</p>
<p style="margin:0 0 18px;">A White Rabbit night usually starts before anyone realizes a magician is there. I move quietly between conversations during cocktails, performing close-up magic for small groups. People stop mid-sentence. Strangers start talking to each other. Phones go down without anyone asking.</p>
<p style="margin:0 0 18px;">By the time dinner is served, the room feels different. Looser. More connected. That is the part that does not show up in a highlight reel.</p>
<p style="margin:0 0 18px;">If you ever want to see what it looks like in motion, ${trackedLink(SITE_URL + "/experience", "here is a quick walkthrough of the experience", cid, step)}.</p>
${signoff()}`);
    return {
      subject: "A peek behind the curtain",
      preheader: "What a White Rabbit night actually looks like.",
      html: wrapEmail("What a White Rabbit night actually looks like.", inner, inquiry.email, cid, step),
    };
  }

  if (step === 1) {
    const inner = bodyCell(`<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">A short story, because it is the kind of thing that stays with you.</p>
<p style="margin:0 0 18px;">At a wedding in Monterey, a woman pulled me aside after cocktail hour. She had flown in from out of state and barely knew anyone in the room. I had just performed at her table — close-up magic, a little mind reading, the kind of thing that gets strangers laughing together within minutes.</p>
<p style="margin:0 0 18px;">By the time I moved on, the people around her were not strangers anymore. They became her dinner companions for the rest of the night.</p>
<p style="margin:0 0 18px;">She said, "You made me feel like I belonged."</p>
<p style="margin:0 0 18px;">That is the part of the work I love most. Magic is the doorway. Connection is the room.</p>
${signoff()}`);
    return {
      subject: "She said \"you made me belong\"",
      preheader: "A small moment from a Monterey wedding.",
      html: wrapEmail("A small moment from a Monterey wedding.", inner, inquiry.email, cid, step),
    };
  }

  if (step === 2) {
    const inner = bodyCell(`<p style="margin:0 0 18px;">Hi ${name},</p>
<p style="margin:0 0 18px;">A quick recap of where the last few months have taken me — figured you might enjoy a little behind-the-scenes:</p>
<p style="margin:0 0 18px;">A corporate dinner for Morgan Stanley. A wedding cocktail hour at a private estate in Santa Barbara. A client appreciation evening for Rolls-Royce. A small dinner for ten at a Hollywood Hills home that turned into one of my favorite nights of the year.</p>
<p style="margin:0 0 18px;">Different rooms, different crowds — but the same thing happens every time. People put their phones down. Strangers laugh together. The room gets a little warmer.</p>
<p style="margin:0 0 18px;">If you are still thinking about your event, I would love to hear where you are. ${trackedLink("https://calendar.app.google/58WjggPt3RFAcJjq8", "Grab a quick call here", cid, step)} or just reply to this email.</p>
${signoff()}`);
    return {
      subject: "Where I have been recently",
      preheader: "A few moments from the last few months.",
      html: wrapEmail("A few moments from the last few months.", inner, inquiry.email, cid, step),
    };
  }

  // step === 3
  const inner = bodyCell(`<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Just wanted to say — I am still here when the moment is right.</p>
<p style="margin:0 0 18px;">No pressure, no follow-up campaign. Plans change, dates shift, events get pushed. Whenever you are ready to revisit, I would love to hear from you.</p>
<p style="margin:0 0 18px;">You can reach me directly at <a href="tel:+14243941850" style="color:#C9A3A8; text-decoration:none;">(424) 394-1850</a>, reply to this email, or ${trackedLink("https://calendar.app.google/58WjggPt3RFAcJjq8", "grab a time on my calendar", cid, step)}.</p>
<p style="margin:0 0 18px;">Wishing you a great season either way.</p>
${signoff()}`);
  return {
    subject: "Still here when you're ready",
    preheader: "No pressure — just keeping the door open.",
    html: wrapEmail("No pressure — just keeping the door open.", inner, inquiry.email, cid, 3),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Send window guard: only Tue/Wed/Thu PT
    const pacificDay = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short" }).format(new Date());
    if (!["Tue", "Wed", "Thu"].includes(pacificDay)) {
      return new Response(JSON.stringify({ sent: 0, message: `Skipped: ${pacificDay} outside send window` }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pull inquiries that finished follow-up (followup_step >= 3) and have not finished nurture
    const { data: inquiries, error } = await supabase
      .from("contact_inquiries")
      .select("id, email, name, event_type, date, nurture_step, nurture_started_at, followup_step, created_at")
      .gte("followup_step", 3)
      .lt("nurture_step", 4)
      .order("created_at", { ascending: true });

    if (error) throw error;
    if (!inquiries?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No inquiries due for nurture" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    let sent = 0;
    const errors: string[] = [];

    for (const inq of inquiries as Inquiry[]) {
      try {
        // Check suppression / unsubscribe
        const { data: unsub } = await supabase
          .from("email_unsubscribes")
          .select("id")
          .eq("email", inq.email.toLowerCase())
          .maybeSingle();
        if (unsub) continue;

        // Initialize nurture_started_at if missing — anchor to created_at + ~10d (followup window)
        let startedAt: Date;
        if (inq.nurture_started_at) {
          startedAt = new Date(inq.nurture_started_at);
        } else {
          // anchor: created_at + 10 days (after the 3-email follow-up window completes)
          const anchor = new Date(new Date(inq.created_at).getTime() + 10 * 24 * 60 * 60 * 1000);
          startedAt = anchor;
          await supabase
            .from("contact_inquiries")
            .update({ nurture_started_at: anchor.toISOString() })
            .eq("id", inq.id);
        }

        const step = inq.nurture_step;
        const requiredDays = NURTURE_OFFSETS[step];
        const daysSince = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < requiredDays) continue;

        const email = getEmail(step, inq);

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Scott Syme <scott.syme@whiterabbitla.com>",
            reply_to: "scott.syme@whiterabbitla.com",
            to: [inq.email],
            subject: email.subject,
            html: email.html,
            headers: {
              "List-Unsubscribe": `<${SITE_URL}/unsubscribe?email=${encodeURIComponent(inq.email)}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          errors.push(`${inq.email}: ${txt}`);
          continue;
        }

        await supabase.from("newsletter_send_log").insert({
          campaign_id: `inquiry-nurture-${step}`,
          contact_id: inq.id,
          status: "sent",
        });

        await supabase
          .from("contact_inquiries")
          .update({ nurture_step: step + 1 })
          .eq("id", inq.id);

        sent++;
        console.log(`Sent inquiry-nurture step ${step} to ${inq.email}`);
      } catch (e) {
        errors.push(`${inq.email}: ${e instanceof Error ? e.message : "unknown"}`);
      }
    }

    return new Response(JSON.stringify({ sent, total: inquiries.length, errors }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("inquiry-nurture error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
