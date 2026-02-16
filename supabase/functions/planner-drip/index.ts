import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-symbol.png";
const SITE_URL = "https://whiterabbitla.com";
const APP_URL = "https://whiterabbitla.lovable.app";

// Day offsets for each drip step
const DRIP_SCHEDULE = [0, 3, 7, 14, 21]; // Day 0, 3, 7, 14, 21

interface EmailTemplate {
  subject: string;
  preheader: string;
  body: (name: string, company: string, city: string) => string;
}

function wrapEmail(preheader: string, innerHtml: string, email: string): string {
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
body { margin: 0; padding: 0; width: 100% !important; background-color: #2D4A3E; }
@media screen and (max-width: 600px) {
  .email-container { width: 100% !important; }
  .padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
}
</style>
</head>
<body style="margin:0; padding:0; background-color:#2D4A3E;">
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#2D4A3E;">${preheader}</div>
<center style="width:100%; background-color:#2D4A3E;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#2D4A3E;">
<tr><td style="padding: 30px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" align="center" class="email-container" style="max-width:560px; margin:auto; background-color:#1e352c; border-radius:4px;">

<!-- Logo -->
<tr><td style="padding: 40px 40px 24px; text-align:center;" class="padding-mobile">
<img src="${LOGO_URL}" alt="White Rabbit" width="50" style="width:50px; height:auto; display:block; margin:0 auto;" />
</td></tr>

${innerHtml}

<!-- Footer -->
<tr><td style="padding: 0 40px;" class="padding-mobile">
<hr style="border:none; border-top:1px solid rgba(200,160,160,0.15); margin:0 0 24px;" />
</td></tr>
<tr><td style="padding: 0 40px 12px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:12px; color:rgba(245,240,232,0.4);">
White Rabbit · Los Angeles<br/>
<a href="mailto:events@whiterabbitla.com" style="color:#c8a0a0; text-decoration:none;">events@whiterabbitla.com</a> · <a href="tel:+14243941850" style="color:rgba(245,240,232,0.4); text-decoration:none;">(424) 394-1850</a>
</p>
</td></tr>
<tr><td style="padding: 0 40px 32px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:11px; color:rgba(245,240,232,0.25);">
<a href="${APP_URL}/unsubscribe?email=${encodeURIComponent("{{EMAIL}}")}" style="color:rgba(245,240,232,0.3); text-decoration:underline;">Unsubscribe</a>
</p>
</td></tr>

</table>
</td></tr></table>
</center>
</body></html>`.replace(/\{\{EMAIL\}\}/g, email);
}

function signoff(full: boolean = false): string {
  if (full) {
    return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott Syme<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">White Rabbit LA · Modern Magic for Real Events</span>
</p>`;
  }
  return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">Scott</p>`;
}

function ps(text: string): string {
  return `<p style="margin:20px 0 0; font-family:Georgia,serif; font-size:13px; font-style:italic; line-height:1.7; color:rgba(245,240,232,0.5);">P.S. ${text}</p>`;
}

function shareLink(slug: string, text: string): string {
  return `<a href="${SITE_URL}/share/${slug}" style="color:#c8a0a0; text-decoration:none; border-bottom:1px solid rgba(200,160,160,0.3);" target="_blank">${text}</a>`;
}

const TEMPLATES: EmailTemplate[] = [
  // Email 1: Day 0 — The Gap Hook
  {
    subject: "The entertainment gap",
    preheader: "Every planner hits this wall.",
    body: (name, _company, city) => {
      const cityLine = city ? ` in ${city}` : "";
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Planning events${cityLine}? Every event pro I talk to hits the same wall: cocktail hour energy drops, guests drift to their phones, and the night loses momentum before dinner even starts.</p>
<p style="margin:0 0 18px;">We've helped teams at Soho House and Rolls-Royce close that gap. Sometimes it's roaming close-up magic during cocktails. Other times it's a full private show after dinner that nobody saw coming. Either way, guests stay locked in all night.</p>
<p style="margin:0 0 18px;">${shareLink("entertainment-gap-planners-dont-know.html", "See why it works →")}</p>
<p style="margin:0 0 18px;">Open to seeing how it fits yours?</p>
${signoff(true)}
${ps("Not kids' birthday stuff. Sophisticated sleight of hand, mentalism, and private shows for adults.")}
</td></tr>`;
    },
  },
  // Email 2: Day 3 — Cocktail Hour Value
  {
    subject: "Cocktail hour secret",
    preheader: "Turn mingling into the highlight.",
    body: (name, _company, _city) => {
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Cocktail hours are make-or-break.</p>
<p style="margin:0 0 18px;">Dead air, awkward mingling, guests checking the time. I've watched it flip for clients like Morgan Stanley. 200 guests, nobody left early, raving about it for weeks.</p>
<p style="margin:0 0 18px;">For smaller gatherings, we also do intimate private shows: emerald curtains, cinematic lighting, a curated 45-minute performance that turns any room into an experience. Perfect as the main event or a post-dinner surprise.</p>
<p style="margin:0 0 18px;">${shareLink("why-cocktail-hour-entertainment-matters.html", "Quick read on why it matters →")}</p>
<p style="margin:0 0 18px;">Worth exploring for your next one?</p>
${signoff()}
${ps("Close-up magic, parlor shows, or both. We tailor it to your event.")}
</td></tr>`;
    },
  },
  // Email 3: Day 7 — The Surprise Factor
  {
    subject: "Surprise your clients",
    preheader: "Entertainment they didn't know they wanted.",
    body: (name, _company, _city) => {
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Your clients hire you for the wow. But most events blend together until you add the thing nobody expected.</p>
<p style="margin:0 0 18px;">Event pros we've partnered with at places like the Hollywood Roosevelt and Paramount use this to get "best vendor ever" texts the next morning. Sometimes it's roaming magic during cocktails. Sometimes it's a full private magic show as the main event. The format flexes to whatever makes the night unforgettable.</p>
<p style="margin:0 0 18px;">${shareLink("surprise-clients-entertainment-they-didnt-know-they-wanted.html", "See the surprise in action →")}</p>
<p style="margin:0 0 18px;">Open to a peek at how?</p>
${signoff(true)}
${ps("From 20-person dinners to 300-person galas. Scales to your event.")}
</td></tr>`;
    },
  },
  // Email 4: Day 14 — Modern Magic Proof
  {
    subject: "Not your kids' magician",
    preheader: "Luxury events deserve better.",
    body: (name, _company, _city) => {
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Quick one for event pros:</p>
<p style="margin:0 0 18px;">Your clients want luxury, not rabbits from hats. We bring close-up mentalism that feels cinematic and private shows that transform any room into something extraordinary. Custom lighting, emerald curtains, a curated soundtrack. Netflix, Disney, and Rivian have all booked it.</p>
<p style="margin:0 0 18px;">${shareLink("not-kids-birthday-party-modern-magic.html", "See the difference →")}</p>
<p style="margin:0 0 18px;">Thoughts on trying it?</p>
${signoff()}
${ps("Member of the Magic Castle. Disney + AGT vetted. Close-up, parlor, and corporate shows.")}
</td></tr>`;
    },
  },
  // Email 5: Day 21 — Vendor List Closer
  {
    subject: "Add to your vendor list?",
    preheader: "One vendor, three formats.",
    body: (name, _company, _city) => {
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Event pros are stacking their vendor lists with game-changers. The ones who added this got repeat business and referrals they didn't ask for.</p>
<p style="margin:0 0 18px;">Taittinger, Hyatt, Lionsgate. Cocktail receptions, corporate galas, private dinners. One vendor that covers close-up magic, full private shows, and everything in between.</p>
<p style="margin:0 0 18px;">${shareLink("why-event-planners-adding-magician-vendor-list.html", "See why →")}</p>
<p style="margin:0 0 18px;">Open to chatting about fit?</p>
${signoff(true)}
${ps(`30-sec quiz to find your event's perfect format: <a href="${APP_URL}/quiz" style="color:#c8a0a0; text-decoration:none;">whiterabbitla.com/quiz</a>`)}
</td></tr>`;
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, adminPassword, contacts: newContacts, step: requestedStep } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Action: enroll ── Import contacts into planner drip
    if (action === "enroll") {
      if (adminPassword !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!newContacts?.length) {
        return new Response(JSON.stringify({ error: "No contacts provided" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let enrolled = 0;
      let skipped = 0;

      for (const c of newContacts) {
        if (!c.email) continue;
        const email = c.email.toLowerCase().trim();

        // Check if already exists
        const { data: existing } = await supabase
          .from("newsletter_contacts")
          .select("id, drip_campaign")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          // Update to planner campaign if they're on welcome
          if (existing.drip_campaign !== "planner") {
            await supabase
              .from("newsletter_contacts")
              .update({
                drip_campaign: "planner",
                drip_step: 0,
                drip_started_at: new Date().toISOString(),
                company: c.company || null,
                name: c.name || undefined,
                city: c.city || null,
              })
              .eq("id", existing.id);
            enrolled++;
          } else {
            skipped++;
          }
        } else {
          await supabase.from("newsletter_contacts").insert({
            email,
            name: c.name || null,
            company: c.company || null,
            city: c.city || null,
            source: "planner-drip",
            subscribed: true,
            drip_step: 0,
            drip_campaign: "planner",
            drip_started_at: new Date().toISOString(),
          });
          enrolled++;
        }
      }

      return new Response(JSON.stringify({ success: true, enrolled, skipped }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action: process ── Send due drip emails (called by cron)
    if (action === "process") {
      if (!RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: "Email service not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get all planner drip contacts who haven't completed the sequence
      const { data: contacts, error: contactsErr } = await supabase
        .from("newsletter_contacts")
        .select("*")
        .eq("drip_campaign", "planner")
        .eq("subscribed", true)
        .lt("drip_step", 5);

      if (contactsErr) {
        console.error("Query error:", contactsErr);
        return new Response(JSON.stringify({ error: "Database error" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!contacts?.length) {
        return new Response(JSON.stringify({ processed: 0, message: "No contacts due" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date();
      let sent = 0;
      const errors: string[] = [];

      for (const contact of contacts) {
        const step = contact.drip_step; // 0-4 = next email to send (1-5)
        if (step >= 5) continue;

        const startedAt = new Date(contact.drip_started_at);
        const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);

        // Check if it's time for this step
        if (daysSinceStart < DRIP_SCHEDULE[step]) continue;

        const template = TEMPLATES[step];
        const firstName = contact.name?.split(" ")[0] || "there";
        const company = contact.company || "";
        const city = contact.city || "";

        const bodyInner = template.body(firstName, company, city);
        const html = wrapEmail(template.preheader, bodyInner, contact.email);

        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Scott Syme | White Rabbit LA <scott.syme@whiterabbitla.com>",
              to: [contact.email],
              subject: template.subject,
              html,
            }),
          });

          if (res.ok) {
            sent++;
            await supabase
              .from("newsletter_contacts")
              .update({
                drip_step: step + 1,
                last_emailed_at: now.toISOString(),
              })
              .eq("id", contact.id);
          } else {
            const errData = await res.json();
            errors.push(`${contact.email}: ${JSON.stringify(errData)}`);
          }
        } catch (e) {
          errors.push(`${contact.email}: ${e instanceof Error ? e.message : "Send error"}`);
        }

        // Rate limit: small delay between sends
        await new Promise(r => setTimeout(r, 200));
      }

      return new Response(JSON.stringify({ processed: contacts.length, sent, errors: errors.length ? errors : undefined }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action: preview ── Preview a specific email template
    if (action === "preview") {
      if (adminPassword !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const stepNum = requestedStep ?? 0;

      if (stepNum < 0 || stepNum >= TEMPLATES.length) {
        return new Response(JSON.stringify({ error: "Invalid step (0-4)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const template = TEMPLATES[stepNum];
      const innerHtml = template.body("Sarah", "Stellar Events", "Los Angeles");
      const html = wrapEmail(template.preheader, innerHtml, "preview@example.com");

      return new Response(JSON.stringify({
        subject: template.subject,
        preheader: template.preheader,
        body_html: html,
        day: DRIP_SCHEDULE[stepNum],
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action: stats ── Get planner drip stats
    if (action === "stats") {
      if (adminPassword !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: contacts } = await supabase
        .from("newsletter_contacts")
        .select("drip_step, subscribed")
        .eq("drip_campaign", "planner");

      const total = contacts?.length || 0;
      const active = contacts?.filter(c => c.subscribed).length || 0;
      const completed = contacts?.filter(c => c.drip_step >= 5).length || 0;
      const stepCounts = [0, 0, 0, 0, 0];
      contacts?.forEach(c => {
        if (c.drip_step >= 0 && c.drip_step < 5 && c.subscribed) {
          stepCounts[c.drip_step]++;
        }
      });

      return new Response(JSON.stringify({ total, active, completed, stepCounts }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("planner-drip error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
