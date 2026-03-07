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
      a1: trackedLink(`${SITE_URL}/blog/hollywood-rehearsal-dinner-magician`, "Why Planners Are Adding Magic to Rehearsal Dinners", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/lake-tahoe-rehearsal-dinner-magician`, "Destination Wedding Entertainment That Travels With You", contactId, step, category),
    },
    country_club: {
      a1: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Event Looks Like", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Event Looks Like", contactId, step, category),
    },
    pr_agency: {
      a1: trackedLink(`${SITE_URL}/post/why-a-magic-show-in-los-angeles-is-the-perfect-entertainment-for-your-next-event`, "Why Magic Is the Perfect Experiential Element for Your Next Event", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/post/why-a-magic-show-in-los-angeles-is-the-perfect-entertainment-for-your-next-event`, "Why Magic Is the Perfect Experiential Element for Your Next Event", contactId, step, category),
    },
    nonprofit: {
      a1: trackedLink(`${SITE_URL}/event-magician`, "See How White Rabbit Transforms Events", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/event-magician`, "See How White Rabbit Transforms Events", contactId, step, category),
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
