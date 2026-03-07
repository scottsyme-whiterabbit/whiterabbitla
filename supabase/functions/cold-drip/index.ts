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

// Day offsets: Email 1 (0), Email 2 (3), Email 3 (10), Breakup (24)
const COLD_SCHEDULE = [0, 3, 10, 24];

type CampaignCategory = "corporate_planner" | "wedding_planner" | "country_club" | "pr_agency" | "nonprofit" | "talent_management" | "restaurant";

interface ColdCampaign {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  campaign_category: CampaignCategory;
  current_step: number;
  started_at: string | null;
  last_email_sent_at: string | null;
  status: string;
}

// ═══════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════

function signoff(): string {
  return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">White Rabbit · Los Angeles</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);">(424) 394-1850 · scott.syme@whiterabbitla.com</span>
</p>`;
}

function signoffShort(): string {
  return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott<br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);">(424) 394-1850</span>
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
  const taggedUrl = `${url}${sep}utm_source=email&utm_medium=cold-drip&utm_campaign=${encodeURIComponent(campaign)}&utm_content=step-${step}`;
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${step}&r=${encodeURIComponent(taggedUrl)}`;
  return `<a href="${trackingUrl}" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);" target="_blank">${text}</a>`;
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

function bodyCell(html: string): string {
  return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
${html}
</td></tr>`;
}

// ═══════════════════════════════════════════════
// ALL 7 CAMPAIGN TEMPLATES (4 emails each)
// ═══════════════════════════════════════════════

const CALENDAR_URL = "https://calendar.app.google/58WjggPt3RFAcJjq8";

function bookCallCTA(contactId: string, step: number, campaign: string): string {
  const sep = CALENDAR_URL.includes("?") ? "&" : "?";
  const taggedUrl = `${CALENDAR_URL}${sep}utm_source=email&utm_medium=cold-drip&utm_campaign=${encodeURIComponent(campaign)}&utm_content=step-${step}`;
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${step}&r=${encodeURIComponent(taggedUrl)}`;
  return `<p style="margin:24px 0 0; text-align:center;">
<a href="${trackingUrl}" target="_blank" style="display:inline-block; padding:12px 32px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C9A3A8; text-decoration:none; font-weight:bold; border:1px solid #C9A3A8; border-radius:2px;">Book a Call</a>
</p>`;
}

function getCampaignEmail(category: CampaignCategory, step: number, name: string, contactId: string): { subject: string; preheader: string; innerHtml: string } {
  const firstName = name || "there";
  const link = trackedLink(`${SITE_URL}/experience`, "whiterabbitla.com/event-magician", contactId, step, category);
  const siteLink = trackedLink(SITE_URL, "whiterabbitla.com", contactId, step, category);
  const deckLink = trackedLink(`${SITE_URL}/deck`, "digital lookbook", contactId, step, category);
  const quizLink = trackedLink(`${SITE_URL}/quiz`, "35-second quiz", contactId, step, category);
  const cta = bookCallCTA(contactId, step, category);

  // Category-specific article links
  const articleLinks = {
    corporate_planner: {
      a1: trackedLink(`${SITE_URL}/blog/west-hollywood-holiday-party-magician`, "How to Choose the Perfect Corporate Event Entertainment", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Event Looks Like", contactId, step, category),
    },
    wedding_planner: {
      a1: trackedLink(`${SITE_URL}/blog/wedding-entertainment-beyond-the-dj`, "Wedding Entertainment Beyond the DJ", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/why-cocktail-hour-entertainment-matters`, "Why Cocktail Hour Entertainment Matters", contactId, step, category),
    },
    country_club: {
      a1: trackedLink(`${SITE_URL}/blog/golf-tournament-entertainment-ideas`, "Golf Tournament Entertainment Ideas", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/why-cocktail-hour-entertainment-matters`, "Why Cocktail Hour Entertainment Matters", contactId, step, category),
    },
    pr_agency: {
      a1: trackedLink(`${SITE_URL}/blog/corporate-entertainment-trends-2026`, "Corporate Entertainment Trends for 2026", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/how-to-choose-entertainment-for-luxury-event`, "How to Choose Entertainment for a Luxury Event", contactId, step, category),
    },
    nonprofit: {
      a1: trackedLink(`${SITE_URL}/blog/why-cocktail-hour-entertainment-matters`, "Why Cocktail Hour Entertainment Matters", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/entertainment-gap-planners-dont-know`, "The Entertainment Gap Most Planners Don't Know They Have", contactId, step, category),
    },
    talent_management: {
      a1: trackedLink(`${SITE_URL}/blog/how-to-choose-entertainment-for-luxury-event`, "How to Choose Entertainment for a Luxury Event", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/planning-private-party-los-angeles`, "Guide to Planning a Private Party in LA", contactId, step, category),
    },
    restaurant: {
      a1: trackedLink(`${SITE_URL}/blog/magic-spirits-tastings-cigar-nights`, "Magic at Spirits Tastings & Cigar Nights", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/why-cocktail-hour-entertainment-matters`, "Why Cocktail Hour Entertainment Matters", contactId, step, category),
    },
  };
  const arts = articleLinks[category];

  const TEMPLATES: Record<CampaignCategory, Array<{ subject: string; preheader: string; innerHtml: string }>> = {
    // ═══════════════════════════════════════════════
    // CAMPAIGN 1: CORPORATE EVENT PLANNERS
    // ═══════════════════════════════════════════════
    corporate_planner: [
      {
        subject: "Quick question about your upcoming events",
        preheader: "Interactive cocktail hour entertainment for corporate events.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I work with corporate teams at Netflix, Disney, and Morgan Stanley as their go-to for interactive cocktail hour entertainment. I perform close-up magic and mind reading, moving between groups of guests during receptions and networking portions.</p>
<p style="margin:0 0 18px;">Most planners bring me in for the cocktail hour. Guests are mingling, and instead of awkward small talk, I am right there with them, using their phones, reading their minds, and making impossible things appear in their hands. It changes the energy of the room in minutes.</p>
<p style="margin:0 0 18px;">Are you planning any client-facing events or team gatherings in the next few months where guest engagement matters?</p>
${cta}
<p style="margin:0 0 18px;">${arts.a2}</p>
${signoffFull()}`),
      },
      {
        subject: "What Netflix does differently at their events",
        preheader: "The events people actually remember.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">One thing I have noticed working corporate events for the past decade: the events people remember are never about the venue or the food. It is always the unexpected moment.</p>
<p style="margin:0 0 18px;">That is why companies like Netflix and Rivian bring me in during cocktail hour. I do strolling close-up magic and mind reading, moving between groups of 4 to 8 guests at a time. No stage. No setup. No AV requirements. I show up 15 minutes early, blend in with your guests, and within seconds people are handing me their phones, picking cards, and losing their minds when I tell them exactly what they are thinking.</p>
<p style="margin:0 0 18px;">At a recent Morgan Stanley event, I performed for over 200 guests across a large indoor reception space. The format scales seamlessly whether it is an intimate dinner or a full corporate gathering.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoff()}`),
      },
      {
        subject: "How a 45-minute set changed a client reception",
        preheader: "An intimate evening for Rolls-Royce.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I recently performed at an intimate evening for Rolls-Royce. 30 guests, all clients of the brand. Close-up magic and mind reading at a private reception where every person in the room mattered. By the end of the night, guests were pulling their friends over to watch, handing me their phones to use, and trying to figure out how I knew exactly what they were thinking.</p>
<p style="margin:0 0 18px;">The host told me afterward that multiple guests came up to her asking how she found me. That is the reaction I aim for: your guests crediting you for the experience.</p>
<p style="margin:0 0 18px;">I am a member at the Magic Castle in Hollywood and was a consultant on America's Got Talent. I mention that only because planners tell me it helps when they need to justify the vendor choice internally.</p>
<p style="margin:0 0 18px;">Would a quick call make sense to see if this fits an upcoming event?</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Last note from me",
        preheader: "Planting the seed for your next event.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I know your inbox is relentless, so I will keep this short.</p>
<p style="margin:0 0 18px;">If you ever need a reliable entertainment option for a cocktail reception, client dinner, or team event, I would love to be on your radar. My calendar fills 4 to 6 weeks out during peak season.</p>
<p style="margin:0 0 18px;">No pressure at all. Just planting the seed.</p>
<p style="margin:0 0 18px;">${arts.a2}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 2: WEDDING PLANNERS
    // ═══════════════════════════════════════════════
    wedding_planner: [
      {
        subject: "what happens during the 45 minutes your couple is gone",
        preheader: "Quick question about your weddings.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Quick question — what's happening at your weddings during that 45-minute cocktail hour while the couple's doing photos?</p>
<p style="margin:0 0 18px;">For most planners, it's the one window that's hard to control. Guests mill around, energy dips, and the momentum from the ceremony fades.</p>
<p style="margin:0 0 18px;">I fix that. Close-up magic woven through the cocktail hour — no stage, no cheesy announcements. Just intimate, elegant moments that get tables of strangers laughing together. Clients like Netflix and Hyatt Hotels trust me for exactly this.</p>
<p style="margin:0 0 18px;">Open to a quick call to see if this is a fit for your couples?</p>
${cta}
${signoff()}`),
      },
      {
        subject: "Re: what happens during the 45 minutes your couple is gone",
        preheader: "Thought this might resonate.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">One more thought — I put together a piece on ${arts.a1} that I think might resonate with how you approach your couples' events.</p>
<p style="margin:0 0 18px;">The takeaway: the planners getting the best guest feedback (and the best reviews for their couples) are the ones solving that cocktail hour gap with something interactive and memorable, not just background music.</p>
<p style="margin:0 0 18px;">Also — here's my ${deckLink} if you'd like to share something visual with a couple who's curious. It shows the experience better than I can explain in an email.</p>
${signoff()}`),
      },
      {
        subject: "your vendor list for 2026",
        preheader: "A few LA planners have started adding me...",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Different angle —</p>
<p style="margin:0 0 18px;">A few LA planners have started adding me to their preferred vendor lists after seeing how cocktail hour magic changes the guest experience (and the reviews their couples leave).</p>
<p style="margin:0 0 18px;">If you're building out your 2026 roster, happy to do a quick private demo so you can see it firsthand. No commitment.</p>
${cta}
${signoffShort()}`),
      },
      {
        subject: "closing the loop",
        preheader: "Totally get it if the timing isn't right.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Totally get it if the timing isn't right.</p>
<p style="margin:0 0 18px;">If a couple ever asks about entertainment beyond the DJ, I'm at ${siteLink} or (424) 394-1850.</p>
<p style="margin:0 0 18px;">Wishing you a packed 2026 season.</p>
${signoff()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 3: COUNTRY CLUBS & GOLF CLUBS
    // ═══════════════════════════════════════════════
    country_club: [
      {
        subject: "the member event everyone actually talks about",
        preheader: "What makes a club event feel different?",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Quick thought — when members come to a club event, what's the one thing that makes it feel different from last month's?</p>
<p style="margin:0 0 18px;">The food is always great. The setting is beautiful. But the entertainment? That's usually where events start to feel interchangeable.</p>
<p style="margin:0 0 18px;">I perform close-up magic and mentalism at private clubs and country club events across the country. I move through the room during cocktails, creating intimate moments of genuine wonder — the kind of thing members bring up at the next round of golf.</p>
<p style="margin:0 0 18px;">I've performed for Netflix, Disney, Morgan Stanley, and Hyatt Hotels. Happy to come by for a complimentary 15-minute demo for your events team.</p>
<p style="margin:0 0 18px;">Worth setting up?</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Re: the member event everyone actually talks about",
        preheader: "Thought your events team might find this useful.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Quick follow-up — I wrote a piece on ${arts.a1} that I think your events team would find interesting. It covers how clubs are using on-course entertainment during tournaments and 19th hole magic to keep members engaged.</p>
<p style="margin:0 0 18px;">Also worth a read: ${arts.a2} — it breaks down why that cocktail/reception window is the highest-impact moment for entertainment at any club event.</p>
<p style="margin:0 0 18px;">The demo offer stands — happy to come by any afternoon that works for your team.</p>
${signoff()}`),
      },
      {
        subject: "holiday party and member event season",
        preheader: "A few clubs have started booking me for recurring events.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Different angle —</p>
<p style="margin:0 0 18px;">A few private clubs have started booking me for their recurring member events — holiday galas, father-daughter dances, wine dinners, new member receptions. It's become their signature entertainment that members genuinely look forward to.</p>
<p style="margin:0 0 18px;">If you're planning your event calendar, I'm booking Q2 and Q3 now. Take this ${quizLink} to see which format fits your events best.</p>
${cta}
${signoffShort()}`),
      },
      {
        subject: "last thing",
        preheader: "If the events team ever wants to try something different...",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I'll leave this with you — if the events team ever wants to try something different for a member event, I'm at ${siteLink} or (424) 394-1850.</p>
<p style="margin:0 0 18px;">Appreciate your time, and here's to a great season at the club.</p>
${signoff()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 4: PR & MARKETING AGENCIES
    // ═══════════════════════════════════════════════
    pr_agency: [
      {
        subject: "the moment that makes everyone pull out their phone",
        preheader: "What guarantees organic social content?",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">When you're planning a brand activation or client event, what's the one element that guarantees organic social content?</p>
<p style="margin:0 0 18px;">Not the step-and-repeat. Not the branded cocktails. It's the moment where someone says "wait — you HAVE to see this" and pulls out their phone.</p>
<p style="margin:0 0 18px;">I create those moments. Close-up magic and mentalism woven through cocktail receptions — no stage, no corny setup. Just jaw-dropping, intimate experiences that generate organic shares and keep guests talking about the brand long after the event.</p>
<p style="margin:0 0 18px;">I've done this for Netflix, Rivian, Morgan Stanley, and Rolls-Royce. Here's how it works: ${link}</p>
<p style="margin:0 0 18px;">Worth exploring for an upcoming activation?</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Re: the moment that makes everyone pull out their phone",
        preheader: "Thought your team might find this relevant.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">One add — I wrote a piece on ${arts.a1} that breaks down the shift agencies are seeing: experiential, interactive entertainment is replacing passive formats at brand events because it generates the organic content and guest engagement that clients actually measure.</p>
<p style="margin:0 0 18px;">Also put together a ${deckLink} showing how this has worked at past brand activations — it's a quick flip-through that might be worth sharing with your events team.</p>
<p style="margin:0 0 18px;">Happy to chat about any upcoming activations where this could fit.</p>
${signoff()}`),
      },
      {
        subject: "brand activation idea",
        preheader: "A few agencies have started booking me for launches.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Quick thought —</p>
<p style="margin:0 0 18px;">A few agencies have started booking me specifically for product launches and VIP client dinners. The magic becomes a branded conversation piece — guests associate the wonder with the brand experience.</p>
<p style="margin:0 0 18px;">If you've got any Q2 activations or client events on deck, this ${quizLink} can help you figure out the right format in 35 seconds.</p>
${cta}
${signoffShort()}`),
      },
      {
        subject: "keeping this brief",
        preheader: "No worries if the timing isn't right.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">No worries if the timing isn't right.</p>
<p style="margin:0 0 18px;">If a client ever needs experiential entertainment that actually generates buzz, I'm at ${siteLink}.</p>
<p style="margin:0 0 18px;">All the best with your upcoming campaigns.</p>
${signoff()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 5: NONPROFIT & CHARITY GALAS
    // ═══════════════════════════════════════════════
    nonprofit: [
      {
        subject: "what happens between cocktails and the paddle raise",
        preheader: "That gap is where energy either builds or fades.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Quick question — at your galas, what's keeping donors engaged during that window between cocktail hour and the live auction?</p>
<p style="margin:0 0 18px;">That gap is where energy either builds or fades. And when it fades, it shows up in the giving.</p>
<p style="margin:0 0 18px;">I perform close-up magic and mentalism at fundraisers and charity galas — moving through the room during cocktails, creating moments of genuine wonder that put donors in an elevated mood right before the ask. It's not a stage act — it's intimate, elegant, and designed for high-net-worth rooms.</p>
<p style="margin:0 0 18px;">Organizations like FosterAll and the Bachelors Ball have trusted me with their events. Clients include Netflix, Disney, and Morgan Stanley.</p>
<p style="margin:0 0 18px;">Worth a quick call to see if this fits your next gala?</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Re: what happens between cocktails and the paddle raise",
        preheader: "This might help with your planning.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Quick add — I put together an article on ${arts.a1} that I think speaks directly to the challenge most gala organizers face: keeping energy high during those transitional moments so donors are engaged and generous when the ask comes.</p>
<p style="margin:0 0 18px;">Also: ${arts.a2} — it covers the specific gaps in event programming that most planners don't realize they have, and how the right entertainment solves them.</p>
<p style="margin:0 0 18px;">Worth a look if you're building out your 2026 gala entertainment lineup.</p>
${signoff()}`),
      },
      {
        subject: "gala entertainment that pays for itself",
        preheader: "Engaged donors give more generously.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Different thought —</p>
<p style="margin:0 0 18px;">A few gala organizers have told me the entertainment paid for itself — engaged donors give more generously, and the "wow factor" gets sponsors excited about next year.</p>
<p style="margin:0 0 18px;">If you're planning your 2026 gala season, take this ${quizLink} to see which format fits your event — or let's jump on a quick call.</p>
${cta}
${signoffShort()}`),
      },
      {
        subject: "wishing you a great gala season",
        preheader: "Keeping the door open.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I'll keep the door open — if you ever need entertainment that energizes donors and elevates the evening, I'm at ${siteLink} or (424) 394-1850.</p>
<p style="margin:0 0 18px;">Wishing you a wildly successful fundraising season.</p>
${signoff()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 6: CELEBRITY & TALENT MANAGEMENT
    // ═══════════════════════════════════════════════
    talent_management: [
      {
        subject: "entertainment for rooms where everyone's seen everything",
        preheader: "That's exactly where I thrive.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">When your clients host private events, the guest list is usually full of people who've seen the best of everything — and they're hard to impress.</p>
<p style="margin:0 0 18px;">That's exactly where I thrive.</p>
<p style="margin:0 0 18px;">I perform close-up magic and mentalism at private parties for entertainment industry clients — the kind of intimate, sophisticated experience that makes A-listers say "how did you DO that?" I'm a member of the Magic Castle in Hollywood and have performed for Netflix, Disney, Paramount, and Rolls-Royce.</p>
<p style="margin:0 0 18px;">No stage, no setup — I move through the room creating moments of genuine wonder during cocktails and dinner. It's the entertainment your clients' guests will actually talk about.</p>
<p style="margin:0 0 18px;">Worth a quick call?</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Re: entertainment for rooms where everyone's seen everything",
        preheader: "Thought this might be relevant for your clients.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">One more thought — I wrote a piece on ${arts.a1} that covers what separates forgettable entertainment from the kind that actually impresses high-caliber guest lists. I think it speaks to exactly the rooms your clients are hosting.</p>
<p style="margin:0 0 18px;">Also worth a look: ${arts.a2} — a practical guide to making private celebrations in Los Angeles unforgettable.</p>
<p style="margin:0 0 18px;">If any of your clients have something coming up, I'd love to be on your radar. Happy to do a private demo at your office anytime.</p>
${signoff()}`),
      },
      {
        subject: "private party season",
        preheader: "The best entertainment decision we made.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Different angle —</p>
<p style="margin:0 0 18px;">I've performed at private events for clients of several major agencies and management companies. The feedback is always the same — "this was the single best entertainment decision we made."</p>
<p style="margin:0 0 18px;">If any of your clients have birthdays, holidays, or milestone celebrations coming up, here's my ${deckLink} — easy to forward. Or take this ${quizLink} for a personalized recommendation.</p>
${cta}
${signoffShort()}`),
      },
      {
        subject: "keeping this short",
        preheader: "If a client ever needs private entertainment...",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Totally understand if the timing isn't right.</p>
<p style="margin:0 0 18px;">If a client ever needs private entertainment that matches the caliber of their guest list, I'm at ${siteLink} or (424) 394-1850.</p>
<p style="margin:0 0 18px;">All the best.</p>
${signoff()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 7: RESTAURANTS & NIGHTLIFE
    // ═══════════════════════════════════════════════
    restaurant: [
      {
        subject: "filling seats on your slowest night",
        preheader: "What if that night became your most talked-about?",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Quick question — what's your slowest night of the week?</p>
<p style="margin:0 0 18px;">What if that night became your most talked-about?</p>
<p style="margin:0 0 18px;">I perform weekly magic residencies at restaurants and venues across LA — close-up magic at the tables during dinner service. Guests get an unforgettable experience, the venue gets social media content and repeat visits, and suddenly your Tuesday feels like a Saturday.</p>
<p style="margin:0 0 18px;">I currently perform weekly at a venue in Los Angeles, and I've performed for brands like Netflix, Disney, and Rolls-Royce. My style is intimate, elegant, and designed to elevate — not interrupt — the dining experience.</p>
<p style="margin:0 0 18px;">Worth a quick conversation?</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Re: filling seats on your slowest night",
        preheader: "Thought this might spark an idea.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Quick add — I wrote a piece on ${arts.a1} that explores how restaurants and lounges are using live magic to elevate the dining experience. Whiskey tastings, private dining, cigar nights — the intimacy of these settings is where close-up magic shines brightest.</p>
<p style="margin:0 0 18px;">Also: ${arts.a2} — it covers why that cocktail/reception window is the highest-impact moment for any venue looking to create a signature experience.</p>
<p style="margin:0 0 18px;">Happy to swing by for a quick demo any evening. No commitment.</p>
${signoff()}`),
      },
      {
        subject: "weekly magic residency — how it works",
        preheader: "More covers on your slow night.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Different thought —</p>
<p style="margin:0 0 18px;">Here's how the residency model works: I come in one night a week, perform tableside magic for 2-3 hours during dinner service. The venue promotes it as a signature experience. Over time, it becomes the thing people come specifically for — and they bring friends.</p>
<p style="margin:0 0 18px;">The ROI is straightforward: more covers on your slow night, organic social content, and a reputation as the place with the coolest experience in town.</p>
<p style="margin:0 0 18px;">Happy to swing by for a quick 15-minute demo any evening. No commitment.</p>
${cta}
${signoffShort()}`),
      },
      {
        subject: "last note",
        preheader: "No worries if the timing doesn't work right now.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">No worries if the timing doesn't work right now.</p>
<p style="margin:0 0 18px;">If you ever want to try a magic night or need entertainment for a private event at the venue, I'm at ${siteLink} or (424) 394-1850.</p>
<p style="margin:0 0 18px;">Cheers to a packed house.</p>
${signoff()}`),
      },
    ],
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
        const template = getCampaignEmail(category as CampaignCategory, step, previewName, "preview");
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

    // Get all active campaigns
    const { data: campaigns, error: fetchErr } = await supabase
      .from("cold_email_campaigns")
      .select("*")
      .eq("status", "active")
      .lt("current_step", 4);

    if (fetchErr) throw fetchErr;
    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: 0, completed: 0, message: "No active campaigns" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const campaign of campaigns as ColdCampaign[]) {
      const step = campaign.current_step;
      const lastSent = campaign.last_email_sent_at ? new Date(campaign.last_email_sent_at) : null;
      const started = campaign.started_at ? new Date(campaign.started_at) : null;

      // Step 0: send immediately (if not already sent)
      if (step === 0 && !started) {
        // First email — send now
      } else if (step >= 4) {
        // Completed
        await supabase.from("cold_email_campaigns").update({ status: "completed" }).eq("id", campaign.id);
        completed++;
        continue;
      } else {
        // Check timing for next email
        if (!lastSent) { skipped++; continue; }
        const daysSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24);
        const requiredDays = step === 1 ? 3 : step === 2 ? 7 : step === 3 ? 14 : 999;
        if (daysSinceLast < requiredDays) {
          skipped++;
          continue;
        }
      }

      // Get email content
      const firstName = campaign.name?.split(" ")[0] || "there";
      const template = getCampaignEmail(campaign.campaign_category as CampaignCategory, step, firstName, campaign.id);

      if (!template.subject) { skipped++; continue; }

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
          current_step: nextStep,
          last_email_sent_at: now.toISOString(),
          updated_at: now.toISOString(),
        };
        if (step === 0) {
          updates.started_at = now.toISOString();
        }
        if (nextStep >= 4) {
          updates.status = "completed";
          completed++;
        }
        await supabase.from("cold_email_campaigns").update(updates).eq("id", campaign.id);
        sent++;
        console.log(`Cold drip: sent step ${step} to ${campaign.email} (${campaign.campaign_category})`);
      } else {
        const errBody = await emailRes.text();
        console.error(`Cold drip: failed to send to ${campaign.email}: ${errBody}`);
        skipped++;
      }
    }

    return new Response(JSON.stringify({ sent, skipped, completed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("cold-drip error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
