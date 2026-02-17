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
const TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-click";
const OPEN_TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-open";

// Day offsets for each drip step
const DRIP_SCHEDULE = [0, 3, 7, 14, 21]; // Day 0, 3, 7, 14, 21
const WARM_SCHEDULE = [0, 3, 7]; // Day 0, 3, 7 after entering warm
const BREAKUP_DAY = 28; // Day 28 from original start for non-clickers

interface EmailTemplate {
  subjectA: string;
  subjectB: string;
  preheader: string;
  body: (name: string, company: string, city: string, contactId?: string, step?: number) => string;
}

function pickVariant(): "A" | "B" {
  return Math.random() < 0.5 ? "A" : "B";
}

function getSubject(template: EmailTemplate, variant: "A" | "B"): string {
  return variant === "A" ? template.subjectA : template.subjectB;
}

function wrapEmail(preheader: string, innerHtml: string, email: string, contactId?: string, step?: number): string {
  const openPixel = contactId ? `<img src="${OPEN_TRACK_URL}?cid=${contactId}&step=${step ?? 0}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />` : "";
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
7393 W. Manchester Ave #209, Los Angeles, CA 90045<br/>
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
${openPixel}
</body></html>`.replace(/\{\{EMAIL\}\}/g, email);
}

function signoff(full: boolean = false): string {
  if (full) {
    return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott Syme<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">White Rabbit · Los Angeles</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);">(424) 394-1850 · scott.syme@whiterabbitla.com</span><br/>
<span style="font-size:12px;"><a href="https://whiterabbitla.com" style="color:rgba(245,240,232,0.35); text-decoration:none;">whiterabbitla.com</a></span>
</p>`;
  }
  return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">Scott</p>`;
}

function ps(text: string): string {
  return `<p style="margin:20px 0 0; font-family:Georgia,serif; font-size:13px; font-style:italic; line-height:1.7; color:rgba(245,240,232,0.5);">P.S. ${text}</p>`;
}

function bookCallCTA(): string {
  return `<p style="margin:18px 0 0; text-align:center;">
<a href="https://calendar.app.google/58WjggPt3RFAcJjq8" target="_blank" style="display:inline-block; padding:12px 32px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#c8a0a0; text-decoration:none; font-weight:bold; border:1px solid #c8a0a0; border-radius:2px;">Book a Call</a>
</p>`;
}

// Tracked link: wraps a URL through the click tracker with contact ID and step
function trackedLink(url: string, text: string, contactId: string, step: number): string {
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${step}&r=${encodeURIComponent(url)}`;
  return `<a href="${trackingUrl}" style="color:#c8a0a0; text-decoration:none; border-bottom:1px solid rgba(200,160,160,0.3);" target="_blank">${text}</a>`;
}

// Plain link (for previews/tests where no contact ID exists)
function shareLink(slug: string, text: string): string {
  return `<a href="${SITE_URL}/share/${slug}" style="color:#c8a0a0; text-decoration:none; border-bottom:1px solid rgba(200,160,160,0.3);" target="_blank">${text}</a>`;
}

// ═══════════════════════════════════════════════
// PLANNER DRIP TEMPLATES (5 emails)
// ═══════════════════════════════════════════════

const TEMPLATES: EmailTemplate[] = [
  // Email 1: Day 0 — The Gap Hook
  {
    subjectA: "The entertainment gap",
    subjectB: "What your cocktail hour is missing",
    preheader: "Every planner hits this wall.",
    body: (name, _company, city, contactId, step) => {
      const cityLine = city ? ` in ${city}` : "";
      const link = contactId
        ? trackedLink(`${SITE_URL}/share/entertainment-gap-planners-dont-know.html`, "See why it works →", contactId, step ?? 0)
        : shareLink("entertainment-gap-planners-dont-know.html", "See why it works →");
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Planning events${cityLine}? Every event pro I talk to hits the same wall: cocktail hour energy drops, guests drift to their phones, and the night loses momentum before dinner even starts.</p>
<p style="margin:0 0 18px;">We've helped teams at Soho House and Rolls-Royce close that gap. Sometimes it's roaming close-up magic during cocktails. Other times it's a full private show after dinner that nobody saw coming. Either way, guests stay locked in all night.</p>
<p style="margin:0 0 18px;">${link}</p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Open to seeing how it fits yours?</p>
${signoff(true)}
${ps("Not kids' birthday stuff. Sophisticated sleight of hand, mentalism, and private shows for adults.")}
</td></tr>`;
    },
  },
  // Email 2: Day 3 — Cocktail Hour Value
  {
    subjectA: "Cocktail hour secret",
    subjectB: "Why 200 guests didn't leave early",
    preheader: "Turn mingling into the highlight.",
    body: (name, _company, _city, contactId, step) => {
      const link = contactId
        ? trackedLink(`${SITE_URL}/share/why-cocktail-hour-entertainment-matters.html`, "Quick read on why it matters →", contactId, step ?? 1)
        : shareLink("why-cocktail-hour-entertainment-matters.html", "Quick read on why it matters →");
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Cocktail hours are make-or-break.</p>
<p style="margin:0 0 18px;">Dead air, awkward mingling, guests checking the time. I've watched it flip for clients like Morgan Stanley. 200 guests, nobody left early, raving about it for weeks.</p>
<p style="margin:0 0 18px;">For smaller gatherings, we also do intimate private shows: emerald curtains, cinematic lighting, a curated 45-minute performance that turns any room into an experience. Perfect as the main event or a post-dinner surprise.</p>
<p style="margin:0 0 18px;">${link}</p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Worth exploring for your next one?</p>
${signoff(true)}
${ps("Close-up magic, parlor shows, or both. We tailor it to your event.")}
</td></tr>`;
    },
  },
  // Email 3: Day 7 — The Surprise Factor
  {
    subjectA: "Surprise your clients",
    subjectB: "The thing nobody expected",
    preheader: "Entertainment they didn't know they wanted.",
    body: (name, _company, _city, contactId, step) => {
      const link = contactId
        ? trackedLink(`${SITE_URL}/share/surprise-clients-entertainment-they-didnt-know-they-wanted.html`, "See the surprise in action →", contactId, step ?? 2)
        : shareLink("surprise-clients-entertainment-they-didnt-know-they-wanted.html", "See the surprise in action →");
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Your clients hire you for the wow. But most events blend together until you add the thing nobody expected.</p>
<p style="margin:0 0 18px;">Event pros we've partnered with at places like the Hollywood Roosevelt and Paramount use this to get "best vendor ever" texts the next morning. Sometimes it's roaming magic during cocktails. Sometimes it's a full private magic show as the main event. The format flexes to whatever makes the night unforgettable.</p>
<p style="margin:0 0 18px;">${link}</p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Open to a peek at how?</p>
${signoff(true)}
${ps(`Need to share this with your team? Here's our lookbook: <a href="${SITE_URL}/deck" style="color:#c8a0a0; text-decoration:none;">whiterabbitla.com/deck</a>`)}
</td></tr>`;
    },
  },
  // Email 4: Day 14 — Modern Magic Proof
  {
    subjectA: "Not your kids' magician",
    subjectB: "What Netflix and Disney booked",
    preheader: "Luxury events deserve better.",
    body: (name, _company, _city, contactId, step) => {
      const link = contactId
        ? trackedLink(`${SITE_URL}/share/not-kids-birthday-party-modern-magic.html`, "See the difference →", contactId, step ?? 3)
        : shareLink("not-kids-birthday-party-modern-magic.html", "See the difference →");
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Quick one for event pros:</p>
<p style="margin:0 0 18px;">Your clients want luxury, not rabbits from hats. We bring close-up mentalism that feels cinematic and private shows that transform any room into something extraordinary. Custom lighting, emerald curtains, a curated soundtrack. Netflix, Disney, and Rivian have all booked it.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">Want to share this with a client or colleague? <a href="${SITE_URL}/deck" style="color:#c8a0a0; text-decoration:none; border-bottom:1px solid rgba(200,160,160,0.3);">Here's our lookbook</a> — one link, everything they need to see.</p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Thoughts on trying it?</p>
${signoff(true)}
${ps("Member of the Magic Castle. Disney + AGT vetted. Close-up, parlor, and corporate shows.")}
</td></tr>`;
    },
  },
  // Email 5: Day 21 — Vendor List Closer
  {
    subjectA: "Add to your vendor list?",
    subjectB: "One vendor, three formats",
    preheader: "One vendor, three formats.",
    body: (name, _company, _city, contactId, step) => {
      const link = contactId
        ? trackedLink(`${SITE_URL}/share/why-event-planners-adding-magician-vendor-list.html`, "See why →", contactId, step ?? 4)
        : shareLink("why-event-planners-adding-magician-vendor-list.html", "See why →");
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Event pros are stacking their vendor lists with game-changers. The ones who added this got repeat business and referrals they didn't ask for.</p>
<p style="margin:0 0 18px;">Taittinger, Hyatt, Lionsgate. Cocktail receptions, corporate galas, private dinners. One vendor that covers close-up magic, full private shows, and everything in between.</p>
<p style="margin:0 0 18px;">${link}</p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Open to chatting about fit?</p>
${signoff(true)}
${ps(`Share our lookbook with your team: <a href="${SITE_URL}/deck" style="color:#c8a0a0; text-decoration:none;">whiterabbitla.com/deck</a> · Or find your format: <a href="${APP_URL}/quiz" style="color:#c8a0a0; text-decoration:none;">whiterabbitla.com/quiz</a>`)}
</td></tr>`;
    },
  },
];

// ═══════════════════════════════════════════════
// WARM LEAD TEMPLATES (3 emails for clickers)
// ═══════════════════════════════════════════════

const WARM_TEMPLATES: EmailTemplate[] = [
  // Warm 1: Day 0 — Acknowledge interest
  {
    subjectA: "Quick thought for your next event",
    subjectB: "Noticed you were curious",
    preheader: "Since you were curious...",
    body: (name, _company, _city) => {
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">I noticed you checked out some of our work. Figured I'd reach out directly.</p>
<p style="margin:0 0 18px;">Most planners I work with start with a quick 10-minute call to talk through the event, the vibe, and which format would land best. No pitch, just a conversation about what would actually make your event unforgettable.</p>
<p style="margin:0 0 18px;">Want to find 10 minutes this week?</p>
<p style="margin:0 0 18px;"><a href="mailto:events@whiterabbitla.com?subject=Let's%20chat%20about%20an%20event" style="color:#c8a0a0; text-decoration:none; border-bottom:1px solid rgba(200,160,160,0.3);">Just reply to this email</a> or call me at (424) 394-1850.</p>
${bookCallCTA()}
${signoff(true)}
</td></tr>`;
    },
  },
  // Warm 2: Day 3 — Social proof reinforcement
  {
    subjectA: "What Soho House said",
    subjectB: "Their highest-rated entertainment ever",
    preheader: "Real feedback from real events.",
    body: (name, _company, _city) => {
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Quick share: after our last show at Soho House, the events team told us it was the highest-rated entertainment they'd ever booked. Guests literally wouldn't leave the room.</p>
<p style="margin:0 0 18px;">That's the thing about what we do. It's not background entertainment. It's the thing people talk about at brunch the next day.</p>
<p style="margin:0 0 18px;">Would love to show you what that looks like for your events. Even a quick call helps me understand what you're working with.</p>
${bookCallCTA()}
${signoff(true)}
${ps(`No commitment. Just a conversation. Or share our lookbook with your client: <a href="${SITE_URL}/deck" style="color:#c8a0a0; text-decoration:none;">whiterabbitla.com/deck</a>`)}
</td></tr>`;
    },
  },
  // Warm 3: Day 7 — Direct CTA
  {
    subjectA: "Before I move on",
    subjectB: "Last note from me",
    preheader: "Last note from me.",
    body: (name, _company, _city) => {
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">I know inboxes get crowded, so I'll keep this short.</p>
<p style="margin:0 0 18px;">If you've got an event coming up where you want guests to feel genuinely alive and taken care of, I'd love to chat. 10 minutes, no pressure.</p>
<p style="margin:0 0 18px;">If the timing isn't right, no worries at all. You know where to find me when it is.</p>
<p style="margin:0 0 18px;"><a href="mailto:events@whiterabbitla.com?subject=Let's%20chat%20about%20an%20event" style="color:#c8a0a0; text-decoration:none; border-bottom:1px solid rgba(200,160,160,0.3);">Reply here</a> · <a href="tel:+14243941850" style="color:#c8a0a0; text-decoration:none; border-bottom:1px solid rgba(200,160,160,0.3);">(424) 394-1850</a> · <a href="${APP_URL}/quiz" style="color:#c8a0a0; text-decoration:none; border-bottom:1px solid rgba(200,160,160,0.3);">Take the quiz</a></p>
${bookCallCTA()}
${signoff(true)}
</td></tr>`;
    },
  },
];

// ═══════════════════════════════════════════════
// BREAKUP EMAIL (for non-clickers after Day 28)
// ═══════════════════════════════════════════════

const BREAKUP_TEMPLATE: EmailTemplate = {
  subjectA: "Closing the loop",
  subjectB: "Timing is everything",
  preheader: "Last one from me.",
  body: (name, _company, _city) => {
    return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">I've sent a few notes and I get it. Timing matters more than anything in this business.</p>
<p style="margin:0 0 18px;">I'll stop filling your inbox. But if you ever have an event where you want to blow your clients away with something they've never experienced before, I'm a phone call away.</p>
<p style="margin:0 0 18px;"><a href="mailto:events@whiterabbitla.com" style="color:#c8a0a0; text-decoration:none; border-bottom:1px solid rgba(200,160,160,0.3);">events@whiterabbitla.com</a> · <a href="tel:+14243941850" style="color:#c8a0a0; text-decoration:none; border-bottom:1px solid rgba(200,160,160,0.3);">(424) 394-1850</a></p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Wishing you incredible events ahead.</p>
${signoff(true)}
</td></tr>`;
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reqBody = await req.json();
    const { action, adminPassword, contacts: newContacts, step: requestedStep, testEmail } = reqBody;

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

      // Deduplicate within the batch
      const seen = new Set<string>();
      const dedupedContacts = newContacts.filter((c: { email?: string }) => {
        if (!c.email) return false;
        const email = c.email.toLowerCase().trim();
        if (seen.has(email)) return false;
        seen.add(email);
        return true;
      });

      let enrolled = 0;
      let skipped = 0;

      for (const c of dedupedContacts) {
        const email = c.email.toLowerCase().trim();

        const { data: existing } = await supabase
          .from("newsletter_contacts")
          .select("id, drip_campaign")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
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
                engagement_status: "new",
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
            engagement_status: "new",
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

      const now = new Date();
      let sent = 0;
      const errors: string[] = [];

      // ── Process PLANNER drip contacts ──
      const { data: plannerContacts } = await supabase
        .from("newsletter_contacts")
        .select("*")
        .eq("drip_campaign", "planner")
        .eq("subscribed", true)
        .lt("drip_step", 5);

      if (plannerContacts?.length) {
        for (const contact of plannerContacts) {
          
          const step = contact.drip_step;
          if (step >= 5) continue;

          const startedAt = new Date(contact.drip_started_at);
          const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceStart < DRIP_SCHEDULE[step]) continue;

          const template = TEMPLATES[step];
          const variant = pickVariant();
          const subject = getSubject(template, variant);
          const firstName = contact.name?.split(" ")[0] || "there";
          const bodyInner = template.body(firstName, contact.company || "", contact.city || "", contact.id, step);
          const html = wrapEmail(template.preheader, bodyInner, contact.email, contact.id, step);

          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({
                from: "Scott Syme | White Rabbit LA <scott.syme@whiterabbitla.com>",
                to: [contact.email],
                subject,
                html,
              }),
            });
            if (res.ok) {
              sent++;
              await supabase.from("newsletter_contacts").update({ drip_step: step + 1, last_emailed_at: now.toISOString() }).eq("id", contact.id);
              // Log send with A/B variant
              await supabase.from("newsletter_send_log").insert({
                campaign_id: `planner-step-${step}`,
                contact_id: contact.id,
                ab_variant: variant,
              });
            } else {
              const errData = await res.json();
              errors.push(`${contact.email}: ${JSON.stringify(errData)}`);
            }
          } catch (e) {
            errors.push(`${contact.email}: ${e instanceof Error ? e.message : "Send error"}`);
          }
          await new Promise(r => setTimeout(r, 200));
        }
      }

      // ── Branch completed planner contacts ──
      // Contacts at step 5 (finished planner drip): check engagement
      const { data: completedContacts } = await supabase
        .from("newsletter_contacts")
        .select("*")
        .eq("drip_campaign", "planner")
        .eq("subscribed", true)
        .eq("drip_step", 5);

      if (completedContacts?.length) {
        for (const contact of completedContacts) {
          if (contact.engagement_status === "warm" || contact.engagement_status === "hot") {
            // Move to warm-lead campaign
            await supabase.from("newsletter_contacts").update({
              drip_campaign: "planner-warm",
              drip_step: 0,
              drip_started_at: now.toISOString(),
            }).eq("id", contact.id);
          } else {
            // Non-clicker: check if it's time for breakup email
            const startedAt = new Date(contact.drip_started_at);
            const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceStart >= BREAKUP_DAY) {
              const firstName = contact.name?.split(" ")[0] || "there";
              const breakupVariant = pickVariant();
              const breakupSubject = getSubject(BREAKUP_TEMPLATE, breakupVariant);
              const bodyInner = BREAKUP_TEMPLATE.body(firstName, contact.company || "", contact.city || "");
              const html = wrapEmail(BREAKUP_TEMPLATE.preheader, bodyInner, contact.email, contact.id, 5);
              try {
                const res = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
                  body: JSON.stringify({
                    from: "Scott Syme | White Rabbit LA <scott.syme@whiterabbitla.com>",
                    to: [contact.email],
                    subject: breakupSubject,
                    html,
                  }),
                });
                if (res.ok) {
                  sent++;
                  await supabase.from("newsletter_contacts").update({
                    drip_campaign: "planner-done",
                    drip_step: 6,
                    last_emailed_at: now.toISOString(),
                    engagement_status: "cold",
                  }).eq("id", contact.id);
                }
              } catch (_e) { /* skip */ }
            }
          }
        }
      }

      // ── Process WARM LEAD campaign ──
      const { data: warmContacts } = await supabase
        .from("newsletter_contacts")
        .select("*")
        .eq("drip_campaign", "planner-warm")
        .eq("subscribed", true)
        .lt("drip_step", 3);

      if (warmContacts?.length) {
        for (const contact of warmContacts) {
          
          const step = contact.drip_step;
          if (step >= 3) continue;

          const startedAt = new Date(contact.drip_started_at);
          const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceStart < WARM_SCHEDULE[step]) continue;

          const template = WARM_TEMPLATES[step];
          const warmVariant = pickVariant();
          const warmSubject = getSubject(template, warmVariant);
          const firstName = contact.name?.split(" ")[0] || "there";
          const bodyInner = template.body(firstName, contact.company || "", contact.city || "");
          const html = wrapEmail(template.preheader, bodyInner, contact.email, contact.id, step);

          try {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({
                from: "Scott Syme | White Rabbit LA <scott.syme@whiterabbitla.com>",
                to: [contact.email],
                subject: warmSubject,
                html,
              }),
            });
            if (res.ok) {
              sent++;
              const newStep = step + 1;
              await supabase.from("newsletter_contacts").update({
                drip_step: newStep,
                last_emailed_at: now.toISOString(),
                ...(newStep >= 3 ? { drip_campaign: "planner-done" } : {}),
              }).eq("id", contact.id);
              // Log send with A/B variant
              await supabase.from("newsletter_send_log").insert({
                campaign_id: `warm-step-${step}`,
                contact_id: contact.id,
                ab_variant: warmVariant,
              });
            }
          } catch (_e) { /* skip */ }
          await new Promise(r => setTimeout(r, 200));
        }
      }

      return new Response(JSON.stringify({ processed: (plannerContacts?.length || 0) + (warmContacts?.length || 0) + (completedContacts?.length || 0), sent, errors: errors.length ? errors : undefined }), {
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
      const campaign = reqBody.campaign || "planner";

      if (campaign === "planner-warm") {
        if (stepNum < 0 || stepNum >= WARM_TEMPLATES.length) {
          return new Response(JSON.stringify({ error: "Invalid step (0-2)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const template = WARM_TEMPLATES[stepNum];
        const innerHtml = template.body("Sarah", "Stellar Events", "Los Angeles");
        const html = wrapEmail(template.preheader, innerHtml, "preview@example.com");
        return new Response(JSON.stringify({ subjectA: template.subjectA, subjectB: template.subjectB, preheader: template.preheader, body_html: html, day: WARM_SCHEDULE[stepNum], campaign: "planner-warm" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (campaign === "breakup") {
        const innerHtml = BREAKUP_TEMPLATE.body("Sarah", "Stellar Events", "Los Angeles");
        const html = wrapEmail(BREAKUP_TEMPLATE.preheader, innerHtml, "preview@example.com");
        return new Response(JSON.stringify({ subjectA: BREAKUP_TEMPLATE.subjectA, subjectB: BREAKUP_TEMPLATE.subjectB, preheader: BREAKUP_TEMPLATE.preheader, body_html: html, day: BREAKUP_DAY, campaign: "breakup" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (stepNum < 0 || stepNum >= TEMPLATES.length) {
        return new Response(JSON.stringify({ error: "Invalid step (0-4)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const template = TEMPLATES[stepNum];
      const innerHtml = template.body("Sarah", "Stellar Events", "Los Angeles");
      const html = wrapEmail(template.preheader, innerHtml, "preview@example.com");
      return new Response(JSON.stringify({ subjectA: template.subjectA, subjectB: template.subjectB, preheader: template.preheader, body_html: html, day: DRIP_SCHEDULE[stepNum] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Action: stats ── Get planner drip stats (enhanced)
    if (action === "stats") {
      if (adminPassword !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: contacts } = await supabase
        .from("newsletter_contacts")
        .select("drip_step, subscribed, drip_campaign, engagement_status, reply_detected")
        .in("drip_campaign", ["planner", "planner-warm", "planner-done"]);

      const total = contacts?.length || 0;
      const active = contacts?.filter(c => c.subscribed).length || 0;
      const unsubscribed = contacts?.filter(c => !c.subscribed).length || 0;
      const plannerActive = contacts?.filter(c => c.drip_campaign === "planner" && c.subscribed).length || 0;
      const warmActive = contacts?.filter(c => c.drip_campaign === "planner-warm" && c.subscribed).length || 0;
      const completed = contacts?.filter(c => c.drip_campaign === "planner-done").length || 0;
      const warm = contacts?.filter(c => c.engagement_status === "warm" || c.engagement_status === "hot").length || 0;
      const hot = contacts?.filter(c => c.engagement_status === "hot" || c.reply_detected).length || 0;
      const cold = contacts?.filter(c => c.engagement_status === "cold").length || 0;

      const stepCounts = [0, 0, 0, 0, 0];
      contacts?.forEach(c => {
        if (c.drip_campaign === "planner" && c.drip_step >= 0 && c.drip_step < 5 && c.subscribed) {
          stepCounts[c.drip_step]++;
        }
      });

      // Click stats
      const { count: totalClicks } = await supabase
        .from("newsletter_clicks")
        .select("*", { count: "exact", head: true });

      const { data: uniqueClickers } = await supabase
        .from("newsletter_clicks")
        .select("contact_id");
      const uniqueClickerCount = new Set(uniqueClickers?.map(c => c.contact_id)).size;

      // Send log stats (for calculating rates)
      const { count: totalSent } = await supabase
        .from("newsletter_send_log")
        .select("*", { count: "exact", head: true });

      // A/B test stats: get sends with variant, join with opens
      const { data: sendLogs } = await supabase
        .from("newsletter_send_log")
        .select("campaign_id, contact_id, ab_variant")
        .not("ab_variant", "is", null);

      const { data: openLogs } = await supabase
        .from("newsletter_opens")
        .select("contact_id, drip_step");

      // Build A/B results per step
      const openSet = new Set(openLogs?.map(o => `${o.contact_id}-${o.drip_step}`) || []);
      const abResults: Record<string, { sentA: number; sentB: number; openedA: number; openedB: number }> = {};

      for (const log of (sendLogs || [])) {
        const key = log.campaign_id; // e.g. "planner-step-0"
        if (!abResults[key]) abResults[key] = { sentA: 0, sentB: 0, openedA: 0, openedB: 0 };
        // Extract step number from campaign_id
        const stepMatch = key.match(/step-(\d+)/);
        const stepNum = stepMatch ? parseInt(stepMatch[1]) : -1;
        const opened = openSet.has(`${log.contact_id}-${stepNum}`);
        if (log.ab_variant === "A") {
          abResults[key].sentA++;
          if (opened) abResults[key].openedA++;
        } else {
          abResults[key].sentB++;
          if (opened) abResults[key].openedB++;
        }
      }

      return new Response(JSON.stringify({
        total, active, unsubscribed, completed, stepCounts,
        plannerActive, warmActive,
        engagement: { warm, hot, cold },
        clicks: { total: totalClicks || 0, uniqueContacts: uniqueClickerCount },
        totalSent: totalSent || 0,
        abResults,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action: test-send ── Send a single test email
    if (action === "test-send") {
      if (adminPassword !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!RESEND_API_KEY) {
        return new Response(JSON.stringify({ error: "Email service not configured" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stepNum = requestedStep ?? 0;
      const toEmail = testEmail || "scott.syme@whiterabbitla.com";
      const campaign = reqBody.campaign || "planner";

      let template: EmailTemplate;
      let subjectPrefix = "[TEST] ";

      if (campaign === "planner-warm") {
        if (stepNum < 0 || stepNum >= WARM_TEMPLATES.length) {
          return new Response(JSON.stringify({ error: "Invalid step (0-2)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        template = WARM_TEMPLATES[stepNum];
        subjectPrefix = "[TEST WARM] ";
      } else if (campaign === "breakup") {
        template = BREAKUP_TEMPLATE;
        subjectPrefix = "[TEST BREAKUP] ";
      } else {
        if (stepNum < 0 || stepNum >= TEMPLATES.length) {
          return new Response(JSON.stringify({ error: "Invalid step (0-4)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        template = TEMPLATES[stepNum];
      }

      const testVariant = (reqBody.variant === "B" ? "B" : "A") as "A" | "B";
      const innerHtml = template.body("Sarah", "Stellar Events", "Los Angeles");
      const html = wrapEmail(template.preheader, innerHtml, toEmail);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Scott Syme | White Rabbit LA <scott.syme@whiterabbitla.com>",
          to: [toEmail],
          subject: `${subjectPrefix}${getSubject(template, testVariant)}`,
          html,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return new Response(JSON.stringify({ success: true, emailId: data.id, sentTo: toEmail, step: stepNum, campaign }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const errData = await res.json();
        return new Response(JSON.stringify({ error: "Send failed", details: errData }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Action: get_contacts ── List planner contacts with engagement info
    if (action === "get_contacts") {
      if (adminPassword !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: contacts } = await supabase
        .from("newsletter_contacts")
        .select("id, email, name, company, city, drip_step, drip_campaign, engagement_status, subscribed, reply_detected, last_emailed_at, created_at")
        .in("drip_campaign", ["planner", "planner-warm", "planner-done"])
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ contacts: contacts || [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Action: get_contact_activity ── Get clicks & opens for a specific contact
    if (action === "get_contact_activity") {
      if (adminPassword !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const contactId = reqBody.contactId;
      if (!contactId) {
        return new Response(JSON.stringify({ error: "contactId required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: clicks } = await supabase
        .from("newsletter_clicks")
        .select("id, link_slug, drip_step, clicked_at")
        .eq("contact_id", contactId)
        .order("clicked_at", { ascending: false });

      const { data: opens } = await supabase
        .from("newsletter_opens")
        .select("id, drip_step, opened_at")
        .eq("contact_id", contactId)
        .order("opened_at", { ascending: false });

      return new Response(JSON.stringify({ clicks: clicks || [], opens: opens || [] }), {
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
