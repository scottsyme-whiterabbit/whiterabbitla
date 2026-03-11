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

// Day offsets: Email 1 (0), Email 2 (3), Email 3 (10), Breakup (24)
const COLD_SCHEDULE = [0, 3, 10, 24];
const DAILY_SEND_CAP = 50;

type CampaignCategory = "corporate_planner" | "wedding_planner" | "country_club" | "pr_agency" | "nonprofit" | "talent_management" | "restaurant" | "spirits";

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
  const firstName = extractFirstName(name);
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
      a1: trackedLink(`${SITE_URL}/blog/hollywood-rehearsal-dinner-magician`, "Why Planners Are Adding Magic to Rehearsal Dinners", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/lake-tahoe-rehearsal-dinner-magician`, "Destination Wedding Entertainment That Travels With You", contactId, step, category),
    },
    country_club: {
      a1: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Event Looks Like", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Event Looks Like", contactId, step, category),
    },
    pr_agency: {
      a1: trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Why Magic Is the Perfect Experiential Element for Your Next Event", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Why Magic Is the Perfect Experiential Element for Your Next Event", contactId, step, category),
    },
    nonprofit: {
      a1: trackedLink(`${SITE_URL}/event-magician`, "See How White Rabbit Transforms Events", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/event-magician`, "See How White Rabbit Transforms Events", contactId, step, category),
    },
    talent_management: {
      a1: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Experience Looks Like", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Experience Looks Like", contactId, step, category),
    },
    restaurant: {
      a1: trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Why Restaurants Are Adding Table-Side Magic to Their Programming", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Why Restaurants Are Adding Table-Side Magic to Their Programming", contactId, step, category),
    },
    spirits: {
      a1: trackedLink(`${SITE_URL}/blog/magic-for-spirits-brands-activations`, "Why Spirits Brands Are Adding Live Magic to Their Activations", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Brand Activation Looks Like", contactId, step, category),
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
        subject: "Cocktail hour entertainment your couples will love",
        preheader: "Close-up magic for luxury weddings.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I specialize in close-up magic and mind reading for luxury weddings. I perform during cocktail hour, moving between guest tables while the couple is off doing photos.</p>
<p style="margin:0 0 18px;">It solves a problem every planner knows: that 45-minute gap where guests are standing around waiting. Instead of idle conversation, guests are handing me their phones, gasping when I read their minds, and watching impossible things appear in their hands. Multiple planners have told me it is the part of the wedding guests bring up months later.</p>
<p style="margin:0 0 18px;">Would you be open to a quick intro? I am happy to walk you through what this looks like and how it fits into a wedding day flow.</p>
${cta}
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
      {
        subject: "How planners use me for the cocktail hour gap",
        preheader: "No stage, no microphone, no power needed.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">The cocktail hour is the one part of a wedding where the couple is absent and guests have nothing structured to do. That is where I come in.</p>
<p style="margin:0 0 18px;">I do strolling close-up magic and mind reading. No stage, no microphone, no power needed. I move between groups of guests, performing 3 to 5 minute interactive sets. Guests are participating the entire time. They are picking cards, unlocking their phones for me to use, and trying to figure out how I predicted exactly what they were going to say. It keeps energy high, gets strangers talking to each other, and gives the photographer candid reaction shots they cannot get any other way.</p>
<p style="margin:0 0 18px;">I have performed at The Langham, Bacara, and private estates throughout Southern California. I am also a member at the Magic Castle in Hollywood and was a consultant on America's Got Talent.</p>
<p style="margin:0 0 18px;">${arts.a2}</p>
${signoff()}`),
      },
      {
        subject: "What a planner said after adding me to her roster",
        preheader: "Zero logistics on your end.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">A planner I work with told me recently that she now includes me in every luxury proposal as a cocktail hour add-on. Her couples love it because it is unexpected, and she loves it because it is zero logistics on her end.</p>
<p style="margin:0 0 18px;">I show up 15 minutes before cocktail hour, perform for 45 to 60 minutes, and leave quietly before dinner. No setup, no breakdown, no coordination needed beyond the start time.</p>
<p style="margin:0 0 18px;">I work with planners nationwide. If you ever want to chat about how this fits into your weddings, I would love to connect.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Open invitation",
        preheader: "For whenever the right event comes along.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Just a quick note to say I would love to be a resource for you whenever the right event comes along. Whether it is a cocktail hour, rehearsal dinner, or welcome party, I am happy to put together a custom proposal.</p>
<p style="margin:0 0 18px;">My spring calendar is starting to fill, so if anything is on the horizon, just let me know.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 3: COUNTRY CLUBS & GOLF CLUBS
    // ═══════════════════════════════════════════════
    country_club: [
      {
        subject: "A member event idea your social calendar might be missing",
        preheader: "Interactive entertainment for private clubs.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I work with private clubs in Southern California as an interactive entertainment option for member events. I perform close-up magic and mind reading during cocktail receptions, holiday galas, and themed dinner nights.</p>
<p style="margin:0 0 18px;">It is the kind of programming that members talk about for weeks. Imagine a member handing you their phone and watching something impossible happen on the screen, or having me tell them the exact word they were thinking of. That kind of moment differentiates your social calendar from every other club in the area.</p>
<p style="margin:0 0 18px;">Would it make sense to chat about adding something like this to an upcoming member event?</p>
${cta}
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
      {
        subject: "How private clubs use strolling entertainment",
        preheader: "No stage, no AV, no disruption.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is how this typically works at a club event: I arrive 15 minutes before the reception starts and perform strolling close-up magic and mind reading during the cocktail hour. I move between groups of members, performing 3 to 5 minute interactive sets where they are participating the entire time.</p>
<p style="margin:0 0 18px;">No stage needed. No AV setup. No disruption to your event flow. Members get an elevated experience, and you get an engagement event that practically runs itself.</p>
<p style="margin:0 0 18px;">I have performed at an intimate private reception for 30 Rolls-Royce clients and large-scale events for over 200 Morgan Stanley guests, so the caliber matches what your members expect.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoff()}`),
      },
      {
        subject: "The event members remember all year",
        preheader: "Member engagement through interactive magic.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">The events that drive member engagement are rarely the ones with the biggest budgets. They are the ones with the unexpected element.</p>
<p style="margin:0 0 18px;">Close-up magic and mind reading at a dinner or cocktail event creates exactly that. Members do not just watch. They participate. They hand me objects, I use their phones, and I tell them things about themselves they have not said out loud. The conversations it sparks between members who might not usually interact is something club directors tell me they value most.</p>
<p style="margin:0 0 18px;">I am a member at the Magic Castle in Hollywood and a consultant for America's Got Talent. Happy to chat anytime about how this would work for your club.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Keeping it on your radar",
        preheader: "For your next member event or holiday gala.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">No rush on this at all. I just wanted to make sure you had my info for whenever a member event or holiday gala comes up where you need something fresh for the social calendar.</p>
<p style="margin:0 0 18px;">Happy to put together a custom proposal anytime. I also do recurring monthly or quarterly programming if that is a better fit for your events schedule.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 4: PR & MARKETING AGENCIES
    // ═══════════════════════════════════════════════
    pr_agency: [
      {
        subject: "Experiential talent for your next client activation",
        preheader: "Close-up magic for brand events and activations.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I am a close-up magician and mind reader who works with brands like Netflix, Disney, and CBS for experiential events and activations.</p>
<p style="margin:0 0 18px;">My work is designed for the cocktail hour of a launch party, the VIP lounge at a brand event, or the unexpected moment during a press dinner that guests post about before they leave. No stage, no AV, just real-time interaction that photographs well and creates shareable content. Guests hand me their phones, I read their minds, and things appear in their hands that should not be there. The reactions are genuine and they film themselves.</p>
<p style="margin:0 0 18px;">If your agency ever sources talent for client events, I would love to be on your roster.</p>
${cta}
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
      {
        subject: "The moment that makes your activation go viral",
        preheader: "Organic social content from real guest reactions.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is what happens when you add a mind reader to a client event: guests stop scrolling their phones and start engaging with each other. Then they pull out their phones to record what just happened. That organic content is worth more than any branded photo booth.</p>
<p style="margin:0 0 18px;">I specialize in close-up experiences for groups of 4 to 8 people. I move through the event creating these moments over and over, using their personal objects, reading their thoughts, making predictions that come true in their hands. By the end of the night, your client has dozens of organic social posts from their guests.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoff()}`),
      },
      {
        subject: "Why agencies keep bringing me back",
        preheader: "Zero logistics for your event day.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I work with a Vogue-listed event producer in LA who books me for multi-day client activations. The reason she keeps bringing me back: zero logistics. I show up, perform, and leave. No rider, no tech requirements, no coordination beyond a start time.</p>
<p style="margin:0 0 18px;">For an agency managing a dozen vendors on event day, having one that requires nothing from your team is valuable.</p>
<p style="margin:0 0 18px;">I am also a Magic Castle member and AGT consultant, which helps when agencies need a quick credential check for their client.</p>
${cta}
${signoff()}`),
      },
      {
        subject: "On your radar for client events",
        preheader: "Product launches, press dinners, VIP receptions.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Just a final note to say I am always available if you need experiential talent for a client event. Product launches, press dinners, VIP receptions, brand activations. I work across all of them.</p>
<p style="margin:0 0 18px;">Happy to jump on a quick call anytime.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 5: NONPROFIT & CHARITY GALAS
    // ═══════════════════════════════════════════════
    nonprofit: [
      {
        subject: "Keeping donors engaged before the paddle raise",
        preheader: "Table-side magic for fundraising galas.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I perform close-up magic and mind reading at fundraising galas as a table-side experience during cocktail hour and dinner.</p>
<p style="margin:0 0 18px;">The goal is simple: keep your donors engaged, energized, and in the room before the paddle raise. Instead of guests checking phones or slipping out early, they are handing me their own phones, watching me read their minds, and seeing impossible things appear right in their hands. It creates a warmth and energy in the room that carries into the giving portion.</p>
<p style="margin:0 0 18px;">Are you planning any galas or fundraising events in the next few months?</p>
${cta}
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
      {
        subject: "Why table-side magic works at galas",
        preheader: "Personal, participatory, right at the donor table.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is why close-up magic works differently than a stage act at a fundraiser: it happens right at the donor's table. It is personal and participatory. Guests are not watching from a distance. They are holding objects, handing me their phones, and reacting out loud when I tell them exactly what they are thinking. It creates a one-on-one connection that puts the room in an emotionally open state before the fundraising portion begins.</p>
<p style="margin:0 0 18px;">I move between tables performing 3 to 5 minute sets for groups of 6 to 10 guests. No microphone, no stage, no disruption to your event flow.</p>
<p style="margin:0 0 18px;">I have performed at corporate events for Disney, CBS, and Morgan Stanley. Happy to walk you through how this would work at your next event.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoff()}`),
      },
      {
        subject: "The gala entertainment guests talk about at the next board meeting",
        preheader: "FosterAll at the Jonathan Club.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I recently performed at a FosterAll fundraising gala at the Jonathan Club. I did table-side close-up magic during the cocktail reception, moving between donor tables and creating moments that had the entire room buzzing. Then I stepped in as the auctioneer for the live auction portion. The combination of entertainment and fundraising energy in the same person created a seamless flow through the evening that kept donors engaged from the first drink to the final bid.</p>
<p style="margin:0 0 18px;">The best gala programming creates moments that board members and major donors reference long after the event. Close-up magic does that because it happens to them, not in front of them.</p>
<p style="margin:0 0 18px;">I would love to bring that same energy to your next event.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "For your next gala",
        preheader: "Interactive entertainment plus auctioneer.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I know gala planning has a long lead time, so I just wanted to plant the seed for whenever your next event is on the horizon.</p>
<p style="margin:0 0 18px;">If you ever need an interactive entertainment element that keeps donors present and engaged, or even someone who can double as an auctioneer, I am always happy to put together a custom proposal.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 6: CELEBRITY & TALENT MANAGEMENT
    // ═══════════════════════════════════════════════
    talent_management: [
      {
        subject: "Specialty talent for your clients private events",
        preheader: "Close-up magic and mind reading for VIP events.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I am a close-up magician and mind reader based in LA. I work private events and VIP receptions for clients like Netflix, Disney, and Rolls-Royce.</p>
<p style="margin:0 0 18px;">If your agency ever books specialty talent for private parties, brand events, or client dinners, I would love to be on your roster. I am a Magic Castle member, AGT consultant, and I carry my own insurance.</p>
<p style="margin:0 0 18px;">Happy to send my info or an avails check for any upcoming dates.</p>
${cta}
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
      {
        subject: "The talent your VIP clients do not expect",
        preheader: "Mind reading three feet away.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is why close-up magic and mind reading works at private celebrity and VIP events: these guests have seen everything. Live bands, DJs, photo booths. What they have not seen is someone reading their mind three feet away, using their own phone to create something impossible, and making a prediction come true in their hands.</p>
<p style="margin:0 0 18px;">I perform in small groups during cocktail receptions. No stage, no setup, no attention-grabbing announcements. Just quiet, jaw-dropping experiences that the room cannot stop talking about.</p>
<p style="margin:0 0 18px;">I am comfortable in any environment. Private estates, hotel suites, yachts, you name it.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoff()}`),
      },
      {
        subject: "Why I get rebooked for VIP events",
        preheader: "Discretion is standard.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">A client manager recently told me that after bringing me in for a private birthday event, three guests at the party independently asked for my contact info. That is the reaction that gets me rebooked.</p>
<p style="margin:0 0 18px;">I understand discretion is paramount. No photos, no social posts, no name-dropping unless a client gives explicit permission. That is standard for me.</p>
<p style="margin:0 0 18px;">Happy to chat about any upcoming events your clients are hosting.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "On your talent radar",
        preheader: "Private parties, brand dinners, milestones.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Just wanted to make sure you have my info for when the right event comes up. Private parties, brand dinners, milestone celebrations. I work across all of them.</p>
<p style="margin:0 0 18px;">My spring calendar is filling up, so if anything is coming down the pipeline, I am happy to check avails.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 7: RESTAURANTS & NIGHTLIFE
    // ═══════════════════════════════════════════════
    restaurant: [
      {
        subject: "A guest experience idea for your slower nights",
        preheader: "Table-side magic that fills seats.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I work with upscale restaurants in LA as a table-side entertainer. I perform close-up magic and mind reading right at the guest's table during dinner service. Guests hand me their phones and watch something impossible happen on the screen. I tell them the exact dish they were about to order. Things appear in their hands that were not there a second ago.</p>
<p style="margin:0 0 18px;">Restaurants that bring me in for a weekly or biweekly night see two things: increased covers on that night and guests who come back specifically for the experience. It turns a slow Tuesday into a destination night.</p>
<p style="margin:0 0 18px;">Would a quick conversation about trying this at your restaurant make sense?</p>
${cta}
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
      {
        subject: "How table-side magic increases your average check",
        preheader: "Guests stay longer and order more.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is what typically happens when I perform at a restaurant: guests stay longer. They order another round. They tell the table next to them to watch. And they tell their friends to come next week.</p>
<p style="margin:0 0 18px;">I perform 3 to 5 minute sets at each table, moving through the dining room over 2 to 3 hours. The experience is intimate, interactive, and completely participatory. Guests are involved the entire time. It gives your diners something to post about and a reason to come back.</p>
<p style="margin:0 0 18px;">No stage. No sound system. No disruption to service. I work with your host to time my table visits between courses.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoff()}`),
      },
      {
        subject: "What guests say about the table-side experience",
        preheader: "Guests start making reservations for magic nights.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">The restaurants I work with tell me the same thing: guests start making reservations specifically for the nights I perform. It becomes a reason to choose your restaurant over the one next door.</p>
<p style="margin:0 0 18px;">I have performed at an intimate private dinner for 30 Rolls-Royce clients and large-scale receptions for over 200 Morgan Stanley guests. The quality of the experience matches the caliber of your guests.</p>
<p style="margin:0 0 18px;">Happy to do a complimentary trial night so you can see the guest reaction firsthand.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "If you ever want to try something different",
        preheader: "No commitment trial night.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Just keeping this brief. If you ever want to test a table-side entertainment night at your restaurant, I am happy to set up a trial. No commitment, no contract. Just one night to see how your guests react.</p>
<p style="margin:0 0 18px;">My calendar gets busy on weekends, but I have availability on weeknight evenings, which is usually when restaurants want the programming most.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 8: SPIRITS BRANDS (5 emails)
    // ═══════════════════════════════════════════════
    spirits: [
      {
        subject: "30 minutes to Presidents Club",
        preheader: "The activation element your competitors haven't found yet.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Your next activation has 30 minutes to make people feel something. Not see something. Not photograph something. Feel it.</p>
<p style="margin:0 0 18px;">I am a magician who works with premium brands during their highest-stakes moments — product launches, ambassador dinners, trade show activations. I move through the crowd and create impossible, intimate experiences right in guests' hands. No stage. No microphone. No setup. Just real reactions that people cannot stop talking about.</p>
<p style="margin:0 0 18px;">Brands like Taittinger, Rolls-Royce, and Netflix have used me for exactly this. The ROI is not in impressions — it is in the organic content guests create because they genuinely cannot believe what just happened.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Your guests are already filming — give them something worth posting",
        preheader: "Organic social from real guest reactions.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">At a recent brand event, something happened that no influencer brief could have planned. Within 10 minutes of my first performance, guests were pulling friends over, phones were out, and the brand was being tagged — unprompted.</p>
<p style="margin:0 0 18px;">That is the difference between entertainment that fills a time slot and entertainment that generates content. The magic happens three feet from the guest. It is personal. It is visceral. And it gives them a story they are desperate to share.</p>
<p style="margin:0 0 18px;">No AV requirements. No disruption to your event flow. I blend in and create moments your brand gets credited for.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoff()}`),
      },
      {
        subject: "The activation line item nobody questions twice",
        preheader: "What brand teams say after the first booking.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is something I hear from brand teams after the first event: "We have never had a vendor that every single guest mentioned the next day."</p>
<p style="margin:0 0 18px;">Every activation has tastings, branded lounges, maybe a DJ. What none of your competitors have is someone creating impossible moments with a guest's own watch, their own phone, their own glass — making them feel like the entire experience was designed just for them.</p>
<p style="margin:0 0 18px;">I am a member at the Magic Castle in Hollywood and have consulted on America's Got Talent. But what actually sells is what happens in the room: people losing their minds and associating that feeling with your brand.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "The brand moment you cannot buy with media spend",
        preheader: "Why experiential teams are adding this to every activation.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">You can buy impressions. You can buy influencer posts. You cannot buy the look on someone's face when something impossible happens in their hands — and you definitely cannot buy the story they tell at dinner the next night.</p>
<p style="margin:0 0 18px;">That is what I do. I create the un-purchasable moment. The one your guests replay in their heads. The one that makes them say your brand's name to people who were not even there.</p>
<p style="margin:0 0 18px;">Product launches. Trade shows. VIP dinners. Ambassador tastings. If there is a crowd and a cocktail, I can turn it into something they will not forget.</p>
<p style="margin:0 0 18px;">${arts.a2}</p>
${signoff()}`),
      },
      {
        subject: "Saving this for whenever your next big activation lands",
        preheader: "For whenever the timing is right.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I know brand calendars plan months out. I am not going to keep emailing — just wanted to make sure you have my info for whenever the right activation comes up.</p>
<p style="margin:0 0 18px;">Launches. Trade events. Tasting dinners. Press moments. I work across all of them, and my calendar fills 4 to 6 weeks out during peak season.</p>
<p style="margin:0 0 18px;">If you ever want to see what this looks like: ${arts.a2}</p>
${signoffFull()}`),
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
    let backlogged = 0;
    let dailyCapReached = false;

    // Count emails already sent today (Pacific time)
    const todayPacific = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now); // YYYY-MM-DD
    const todayStart = new Date(`${todayPacific}T00:00:00-08:00`).toISOString();
    const { count: sentTodayCount } = await supabase
      .from("cold_email_campaigns")
      .select("id", { count: "exact", head: true })
      .gte("last_email_sent_at", todayStart);
    const sentToday = sentTodayCount ?? 0;

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

      // Daily send cap check
      if (sentToday + sent >= DAILY_SEND_CAP) {
        dailyCapReached = true;
        backlogged++;
        continue;
      }

      // Get email content
      const firstName = extractFirstName(campaign.name);
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

    return new Response(JSON.stringify({ sent, skipped, completed, backlogged, dailyCapReached, sentToday }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("cold-drip error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
