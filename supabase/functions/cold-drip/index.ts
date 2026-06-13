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
// Global cap = per-category cap × number of active categories (8 × 7 = 56).
// Effective cap drops to ~40 while pr_agency + restaurant remain paused.
const DAILY_SEND_CAP = 56;
const PER_CATEGORY_DAILY_CAP = 8;

type CampaignCategory = "corporate_planner" | "wedding_planner" | "country_club" | "pr_agency" | "nonprofit" | "talent" | "restaurant" | "spirits" | "nightlife" | "charity_golf";

interface ColdCampaign {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  city: string | null;
  phone: string | null;
  campaign_category: CampaignCategory;
  current_step: number;
  started_at: string | null;
  last_email_sent_at: string | null;
  status: string;
  tournament_name: string | null;
  tournament_date: string | null;
  tournament_course: string | null;
}

// ═══════════════════════════════════════════════
// SHARED HELPERS
// ═══════════════════════════════════════════════

// Canonical signature — exact format required for compliance.
// Scott Syme / Magician / (424) 394-1850 / whiterabbitla.com
function signoff(): string {
  return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott Syme<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">Magician</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);"><a href="tel:+14243941850" style="color:rgba(245,240,232,0.35); text-decoration:none;">(424) 394-1850</a></span><br/>
<span style="font-size:12px;"><a href="https://whiterabbitla.com" style="color:rgba(245,240,232,0.35); text-decoration:none;">whiterabbitla.com</a></span>
</p>`;
}
const signoffShort = signoff;
const signoffFull = signoff;

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
// PLAIN-TEXT-STYLED EMAIL (cold entry / Email 1 only)
// ═══════════════════════════════════════════════
// Strips brand chrome, dark green wrapper, logo, and styled CTA button so
// Email 1 renders like a 1:1 personal Gmail message instead of a marketing
// template. Improves text-to-HTML ratio and Inbox placement (vs Promotions).
// Keeps the open-tracking pixel + List-Unsubscribe header (set in send call).

const PLAIN_FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`;
const CALENDAR_PUBLIC_URL = "https://whiterabbitla.com/book";

function plainCalendarSentence(contactId: string, step: number, campaign: string): string {
  // Tracked link rendered as plain inline text — no button, no border, no color chrome.
  const sep = CALENDAR_PUBLIC_URL.includes("?") ? "&" : "?";
  const tagged = `${CALENDAR_PUBLIC_URL}${sep}utm_source=email&utm_medium=cold-drip&utm_campaign=${encodeURIComponent(campaign)}&utm_content=step-${step}`;
  const tracking = `${TRACK_URL}?cid=${contactId}&step=${step}&r=${encodeURIComponent(tagged)}`;
  return `Happy to jump on a quick call — here's my calendar: <a href="${tracking}">${CALENDAR_PUBLIC_URL}</a>`;
}

function plainSignature(): string {
  return `<p class="sig">
Scott Syme<br>
Magician<br>
<a href="tel:+14243941850" class="plain">(424) 394-1850</a><br>
<a href="https://whiterabbitla.com" class="plain">whiterabbitla.com</a>
</p>`;
}

function plainBody(paragraphs: string[]): string {
  return paragraphs.map((p) => `<p>${p}</p>`).join("\n");
}

function wrapPlainEmail(preheader: string, innerHtml: string, _email: string, contactId: string, step: number): string {
  const openPixel = `<img src="${OPEN_TRACK_URL}?cid=${contactId}&step=${step}" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{margin:0;padding:16px;background:#fff;font-family:${PLAIN_FONT};font-size:15px;line-height:1.5;color:#000}
.wrap{max-width:600px;margin:0 auto}
p{margin:0 0 16px}
.sig{margin:24px 0 0}
a{color:#1a0dab}
a.plain{color:#000;text-decoration:none}
.preheader{display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#fff}
</style>
</head>
<body>
<div class="preheader">${preheader}</div>
<div class="wrap">
${innerHtml}
</div>
${openPixel}
</body></html>`;
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

// Merge field helpers with graceful null fallbacks.
// `mergeCompanyClause` returns " at {company}" when set, "" when null — so the
// surrounding sentence reads naturally either way.
// `mergeCityPhrase` returns " in {city}" when set, "" when null.
function mergeCompanyClause(company: string | null | undefined): string {
  const v = (company || "").trim();
  return v ? ` at ${v}` : "";
}
function mergeCityPhrase(city: string | null | undefined): string {
  const v = (city || "").trim();
  return v ? ` in ${v}` : "";
}

function getCampaignEmail(
  category: CampaignCategory,
  step: number,
  name: string,
  contactId: string,
  company: string | null = null,
  city: string | null = null,
  tournamentName: string | null = null,
  tournamentDate: string | null = null,
  tournamentCourse: string | null = null,
): { subject: string; preheader: string; innerHtml: string } {
  const firstName = extractFirstName(name);
  const companyClause = mergeCompanyClause(company);
  const cityPhrase = mergeCityPhrase(city);
  const tournamentLabel = (tournamentName && tournamentName.trim()) || "your tournament";
  const link = trackedLink(`${SITE_URL}/experience`, "whiterabbitla.com/event-magician", contactId, step, category);
  const siteLink = trackedLink(SITE_URL, "whiterabbitla.com", contactId, step, category);
  const deckLink = trackedLink(`${SITE_URL}/deck`, "digital lookbook", contactId, step, category);
  const quizLink = trackedLink(`${SITE_URL}/quiz`, "35-second quiz", contactId, step, category);
  const tournamentsLink = trackedLink(`${SITE_URL}/services/golf-tournament-magician`, "whiterabbitla.com/services/golf-tournament-magician", contactId, step, category);
  const cta = bookCallCTA(contactId, step, category);

  // Category-specific article links
  const articleLinks = {
    corporate_planner: {
      a1: trackedLink(`${SITE_URL}/blog/west-hollywood-holiday-party-magician`, "How to Choose the Perfect Corporate Event Entertainment", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Event Looks Like", contactId, step, category),
    },
    wedding_planner: {
      a1: trackedLink(`${SITE_URL}/blog/entertainment-gap-planners-dont-know`, "The Entertainment Gap Piece", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/entertainment-gap-planners-dont-know`, "The Entertainment Gap Piece", contactId, step, category),
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
    restaurant: {
      a1: trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Why Restaurants Are Adding Table-Side Magic to Their Programming", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Why Restaurants Are Adding Table-Side Magic to Their Programming", contactId, step, category),
    },
    spirits: {
      a1: trackedLink(`${SITE_URL}/blog/magic-for-spirits-brands-activations`, "Why Spirits Brands Are Adding Live Magic to Their Activations", contactId, step, category),
      a2: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Brand Activation Looks Like", contactId, step, category),
    },
  };
  const arts = articleLinks[category] ?? articleLinks.corporate_planner;

  const TEMPLATES: Record<CampaignCategory, Array<{ subject: string; preheader: string; innerHtml: string }>> = {
    // ═══════════════════════════════════════════════
    // CAMPAIGN 1: CORPORATE EVENT PLANNERS
    // ═══════════════════════════════════════════════
    corporate_planner: [
      {
        subject: "Quick question about your upcoming events",
        preheader: "Interactive cocktail hour entertainment for corporate events.",
        innerHtml: plainBody([
          `${firstName},`,
          `I work with corporate teams at Netflix, Disney, and Morgan Stanley as their go-to for interactive cocktail hour entertainment. I perform close-up magic and mind reading, moving between groups of guests during receptions and networking portions.`,
          `Most planners bring me in for the cocktail hour. Guests are mingling, and instead of awkward small talk, I am right there with them, using their phones, reading their minds, and making impossible things appear in their hands. It changes the energy of the room in minutes.`,
          `Are you planning any client-facing events or team gatherings in the next few months where guest engagement matters?`,
          plainCalendarSentence(contactId, step, category),
        ]) + plainSignature(),
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
        subject: `quick one re:${companyClause ? ` ${(company || "").trim()}` : " your couples"}`,
        preheader: "a question about your couples' cocktail hour",
        innerHtml: plainBody([
          `Hi ${firstName},`,
          `Quick question. Do your couples ever come out of cocktail hour wishing it lasted longer?`,
          `I'm Scott. Close-up magic at the Magic Castle in Hollywood and SoCal weddings. Something the planners I work with keep saying about cocktail hour: around 20 minutes in, guests pull out phones and start texting friends about what just happened six inches from their face.`,
          `Couples get one wedding. Your portfolio gets the Instagram moment the morning after.`,
          `Worth 10 minutes to see if any of${companyClause ? ` ${(company || "").trim()}'s` : " your"} upcoming couples${cityPhrase} would fit?`,
          plainCalendarSentence(contactId, step, category),
        ]) + plainSignature(),
      },
      {
        subject: "re: cocktail hour",
        preheader: "what 'magic at a wedding' actually means",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">Hi ${firstName},</p>
<p style="margin:0 0 18px;">Following up on the last one.</p>
<p style="margin:0 0 18px;">"Magic at a wedding" means a hundred different things, so here's what I actually do. 60 to 90 minutes walking cocktail hour and standing reception. Close-up at arm's length. No stage, no mic, no "ladies and gentlemen." Guests cluster naturally after the first effect. By the time you're calling seating, half the room is texting friends.</p>
<p style="margin:0 0 18px;">One planner told me last season it was the most-DM'd moment on her couple's wedding Instagram, ahead of the vows and the first dance.</p>
<p style="margin:0 0 18px;">If any of${companyClause ? ` ${(company || "").trim()}'s` : " your"} upcoming couples might be a fit, want to grab 10 minutes this week or next?</p>
${cta}
<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott<br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);">Office (424) 394-1850 · Cell (650) 678-9428</span>
</p>`),
      },
      {
        subject: "a weird offer",
        preheader: "10 minutes, no pitch, no follow-up",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">Hi ${firstName},</p>
<p style="margin:0 0 18px;">One more from me, then I'll get out of your inbox.</p>
<p style="margin:0 0 18px;">I'm LA-based, performing weekly at the Magic Castle. If you're in town, I'll come to your office and do 10 minutes of close-up for you and your team. No pitch, no obligation, no follow-up unless you ask. You see what your couples would see.</p>
<p style="margin:0 0 18px;">If you're outside LA, I have a 90-second clip from a recent wedding that does the same job. Want me to send it?</p>
${cta}
<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott<br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);">Office (424) 394-1850 · Cell (650) 678-9428</span>
</p>`),
      },
      {
        subject: "quick check",
        preheader: "a simple yes or no",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">Hi ${firstName},</p>
<p style="margin:0 0 18px;">Before I close the loop, one question.</p>
<p style="margin:0 0 18px;">Is this a "not now, circle back in a few months" or a "not a fit, remove me"?</p>
<p style="margin:0 0 18px;">Either answer helps. Don't want to keep emailing a planner whose entertainment roster is locked.</p>
<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott<br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);">Office (424) 394-1850 · Cell (650) 678-9428</span>
</p>`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 3: COUNTRY CLUBS & GOLF CLUBS
    // ═══════════════════════════════════════════════
    country_club: [
      {
        subject: "A member event idea your social calendar might be missing",
        preheader: "Interactive entertainment for private clubs.",
        innerHtml: plainBody([
          `${firstName},`,
          `I work with private clubs in Southern California as an interactive entertainment option for member events. I perform close-up magic and mind reading during cocktail receptions, holiday galas, and themed dinner nights.`,
          `It is the kind of programming that members talk about for weeks. Imagine a member handing you their phone and watching something impossible happen on the screen, or having me tell them the exact word they were thinking of. That kind of moment differentiates your social calendar from every other club in the area.`,
          `Would it make sense to chat about adding something like this to an upcoming member event?`,
          plainCalendarSentence(contactId, step, category),
        ]) + plainSignature(),
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
        innerHtml: plainBody([
          `${firstName},`,
          `I am a close-up magician and mind reader who works with brands like Netflix, Disney, and CBS for experiential events and activations.`,
          `My work is designed for the cocktail hour of a launch party, the VIP lounge at a brand event, or the unexpected moment during a press dinner that guests post about before they leave. No stage, no AV, just real-time interaction that photographs well and creates shareable content. Guests hand me their phones, I read their minds, and things appear in their hands that should not be there. The reactions are genuine and they film themselves.`,
          `If your agency ever sources talent for client events, I would love to be on your roster.`,
          plainCalendarSentence(contactId, step, category),
        ]) + plainSignature(),
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
        innerHtml: plainBody([
          `${firstName},`,
          `I perform close-up magic and mind reading at fundraising galas as a table-side experience during cocktail hour and dinner.`,
          `The goal is simple: keep your donors engaged, energized, and in the room before the paddle raise. Instead of guests checking phones or slipping out early, they are handing me their own phones, watching me read their minds, and seeing impossible things appear right in their hands. It creates a warmth and energy in the room that carries into the giving portion.`,
          `Are you planning any galas or fundraising events in the next few months?`,
          plainCalendarSentence(contactId, step, category),
        ]) + plainSignature(),
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
    // CAMPAIGN 7: RESTAURANTS & NIGHTLIFE
    // ═══════════════════════════════════════════════
    restaurant: [
      {
        subject: "A guest experience idea for your slower nights",
        preheader: "Table-side magic that fills seats.",
        innerHtml: plainBody([
          `${firstName},`,
          `I work with upscale restaurants in LA as a table-side entertainer. I perform close-up magic and mind reading right at the guest's table during dinner service. Guests hand me their phones and watch something impossible happen on the screen. I tell them the exact dish they were about to order. Things appear in their hands that were not there a second ago.`,
          `Restaurants that bring me in for a weekly or biweekly night see two things: increased covers on that night and guests who come back specifically for the experience. It turns a slow Tuesday into a destination night.`,
          `Would a quick conversation about trying this at your restaurant make sense?`,
          plainCalendarSentence(contactId, step, category),
        ]) + plainSignature(),
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
    // CAMPAIGN 8: SPIRITS BRANDS (5 emails over 21 days)
    // ═══════════════════════════════════════════════
    spirits: [
      {
        subject: "A different kind of activation talent",
        preheader: "Interactive magic for premium brand events.",
        innerHtml: plainBody([
          `${firstName},`,
          `I work with brands like Taittinger, Rolls-Royce, and Netflix as interactive entertainment for activations and VIP events. I perform close-up magic during cocktail receptions — moving between groups, creating impossible moments right in guests' hands.`,
          `No stage, no AV, no disruption. Guests are participating, filming, and tagging your brand before you ask them to.`,
          `Would it make sense to explore this for an upcoming activation?`,
          plainCalendarSentence(contactId, step, category),
        ]) + plainSignature(),
      },
      {
        subject: "What happened at a recent brand tasting",
        preheader: "Organic content from real guest reactions.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">At a recent brand event, within 10 minutes guests were pulling friends over to watch, phones were out, and the brand was being tagged — unprompted. No influencer brief required.</p>
<p style="margin:0 0 18px;">That is the difference between entertainment that fills a time slot and entertainment that generates content. I blend into the crowd and create moments your brand gets credited for.</p>
<p style="margin:0 0 18px;">${arts.a1}</p>
${signoff()}`),
      },
      {
        subject: "The vendor every guest mentions the next day",
        preheader: "What brand teams say after the first booking.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is something I hear from brand teams after the first event: "We have never had a vendor that every single guest mentioned the next day."</p>
<p style="margin:0 0 18px;">I am a member at the Magic Castle in Hollywood and have consulted on America's Got Talent. But what actually sells is what happens in the room — people genuinely losing their minds and connecting that feeling to your brand.</p>
<p style="margin:0 0 18px;">Happy to chat about how this works for your next event.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "The moment you cannot buy with media spend",
        preheader: "Why experiential teams keep rebooking.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">You can buy impressions. You can buy influencer posts. You cannot buy the look on someone's face when something impossible happens in their hands — or the story they tell at dinner the next night.</p>
<p style="margin:0 0 18px;">Product launches. Trade shows. VIP dinners. If there is a crowd and a cocktail, I can turn it into something they will not forget.</p>
<p style="margin:0 0 18px;">${arts.a2}</p>
${signoff()}`),
      },
      {
        subject: "For whenever the right activation comes up",
        preheader: "Just planting the seed.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I know brand calendars plan months out. Just wanted to make sure you have my info for whenever the right activation lands. Launches, trade events, tasting dinners — I work across all of them.</p>
<p style="margin:0 0 18px;">My calendar fills 4 to 6 weeks out during peak season, so early planning helps.</p>
<p style="margin:0 0 18px;">${arts.a2}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 8: NIGHTLIFE (clubs, lounges, late-night venues)
    // ═══════════════════════════════════════════════
    nightlife: [
      {
        subject: `${firstName} — a table moment that becomes the night's story`,
        preheader: "Five minutes at a VIP table that guests retell.",
        innerHtml: plainBody([
          `${firstName},`,
          `Your VIP program sells the best tables in the city. What if the night at those tables could land even harder — not with more bottles, but with a moment the guests actually retell.`,
          `I'm Scott. I run White Rabbit LA — close-up magic built for intimate, high-end rooms. At a VIP table during peak hour, five to ten minutes of close-up with me turns the bottle-service guest into the center of the evening. Your guests don't watch the show, they become the show. Their friends book the next table because they want the same moment.`,
          `One qualifying question before I send anything else: is your Friday VIP program already running a hospitality element beyond the bar, or is the spend still concentrated on bottles and the room?`,
          `Happy to walk you through what a rotation looks like. Phone or email, whichever is easier.`,
          plainCalendarSentence(contactId, step, category),
        ]) + plainSignature(),
      },
      {
        subject: `${firstName} — the $10K bottle and what's missing`,
        preheader: "What a bottle-service table doesn't deliver.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Three days on, wanted to make sure the first note landed.</p>
<p style="margin:0 0 18px;">The angle I didn't fully explain: a $10,000 bottle-service table delivers three things — the bottles, the room, the status. What it doesn't deliver is a moment that belongs to the guest, not the room. Five minutes of close-up at their table is exactly that — the guest's own story to tell the next day. It's why the tables I work rebook. They don't come back for the room. They come back for what happened at their table.</p>
<p style="margin:0 0 18px;">If peak Friday feels like too much to try first, I'd be glad to show you what this looks like at a soft opening, industry night, or private buyout where the stakes are lower.</p>
${signoffFull()}`),
      },
      {
        subject: `${firstName} — one more thought on the room`,
        preheader: "Rebook rate is a hospitality metric.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">One more thought before I let this one rest.</p>
<p style="margin:0 0 18px;">The most valuable Friday in nightlife isn't the busiest one. It's the one that makes Saturday's guest list. Which means the real question at a VIP table isn't "did they order another bottle" — it's "will they call Tuesday to rebook."</p>
<p style="margin:0 0 18px;">Rebook rate is a hospitality metric, not a bar metric. The Ritz-Carlton figured that out a long time ago and became the #1 luxury brand in the world for it. Same principle is quietly true in every elevated club — the tables that retell the night are the ones that come back.</p>
<p style="margin:0 0 18px;">I'm not trying to be precious about this. If it's not a fit, I understand. If there's a Friday or a soft opening where letting me work a few tables makes sense, I'd love to.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: `${firstName} — last note from me`,
        preheader: "One conversation. No pressure.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">This is the last one from me so I'm not crowding your inbox.</p>
<p style="margin:0 0 18px;">If the timing's not right, that's genuinely fine. If it ever is — a private buyout, a new lounge opening, a night you want to hit differently — my number is below. One conversation. No pressure.</p>
<p style="margin:0 0 18px;">If you're ever just curious, the Magic Castle stands. Any night I'm performing, I can get you in.</p>
<p style="margin:0 0 18px;">Hope the room is full.</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 9: TALENT (agents, managers)
    // ═══════════════════════════════════════════════
    talent: [
      {
        subject: `${firstName} — a quiet way to land a wrap party`,
        preheader: "Magic as hospitality at the cast-and-crew evening.",
        innerHtml: plainBody([
          `${firstName},`,
          `Every wrap party has the same transition point — crew finishes arriving, champagne is out, and the room has to shift from coworkers who shared a hard 12 weeks into people at an evening. That 20-minute stretch decides how the night feels all the way through.`,
          `I'm Scott. I run White Rabbit LA — close-up magic built for intimate rooms. At a wrap party, five to ten minutes of close-up with a small group bridges that transition — the grip becomes the story of one trick, the DP becomes the story of another, and by the time dinner is called the room has already found its voice.`,
          `One qualifying question before I say more: is there a specific wrap or premiere on your calendar in the next sixty days, or are you sourcing ahead of the Fall slate?`,
          plainCalendarSentence(contactId, step, category),
        ]) + plainSignature(),
      },
      {
        subject: `${firstName} — one brief, many wraps`,
        preheader: "One vendor conversation now saves you the next one.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Three days on, wanted to make sure the first note landed.</p>
<p style="margin:0 0 18px;">Here's the part I didn't put in the first email: most managers I talk with aren't sourcing for ONE wrap — they're sourcing for the rhythm of the year. Three, five, seven projects ending at different points. One vendor conversation now saves you from running the same brief in April and again in October.</p>
<p style="margin:0 0 18px;">I've kept the show to forty minutes for a reason. It fits the pre-dinner slot, it doesn't interrupt speeches, and it wraps before the room thins out. Easy to slot into any cast-and-crew evening without redesigning the rest of the program.</p>
<p style="margin:0 0 18px;">If it's easier to look at a project-by-project list, I can put together a short rundown for whichever wraps you have on your calendar through the Fall.</p>
${signoffFull()}`),
      },
      {
        subject: `${firstName} — the part most talent managers don't expect`,
        preheader: "The client gets to enjoy their own party.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">The thing most managers don't expect about my show is that their client is never the center of it. The crew is. The producer is. The plus-one who came shy is.</p>
<p style="margin:0 0 18px;">Which is paradoxically the part that lands with talent — most entertainment at these events puts the principal on the spot. Mine doesn't. The client gets to relax into the evening the way they rarely do at their own party. That's the job I took for myself. Magic as hospitality. The client gets to enjoy their own party.</p>
<p style="margin:0 0 18px;">If any of that resonates, even loosely — I'd love to find the right evening for it. No pressure.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: `${firstName} — last one from me`,
        preheader: "If the right wrap or premiere comes up.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">This is the last note from me so I'm not adding to the noise.</p>
<p style="margin:0 0 18px;">If the right wrap, premiere, or dinner comes up — even six months out — I'd be glad to hear about it. My number is below.</p>
<p style="margin:0 0 18px;">If you're ever just curious, the Magic Castle stands. Any night I'm performing, I can get you in.</p>
<p style="margin:0 0 18px;">Until then, hope your slate is a good one this season.</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // CAMPAIGN 10: CHARITY GOLF TOURNAMENTS (3 emails over 9 days)
    // ═══════════════════════════════════════════════
    charity_golf: [
      {
        subject: `What your players do between the 18th hole and dinner`,
        preheader: `The 2-hour dead zone at ${tournamentLabel}.`,
        innerHtml: plainBody([
          `Hi ${firstName},`,
          `Most charity golf tournaments have a long gap between the last putt and the awards dinner — players drift to the bar, energy drops before the auction asks, and committees scramble to fill the time. Same problem at the hospitality tents during play.`,
          `I'm a Magic Castle magician who fills both gaps. Close-up magic at the on-course hospitality tents while players move through, and strolling magic at the post-round reception. No dead time, and a more generous room for the auction.`,
          `Worth 15 minutes? (424) 394-1850 or hit reply.`,
          `More at ${tournamentsLink}`,
        ]) + plainSignature(),
      },
      {
        subject: `Did the ${tournamentLabel} dead-zone note land?`,
        preheader: `Quick follow-up on filling the gap before the awards dinner.`,
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">Hi ${firstName},</p>
<p style="margin:0 0 18px;">Quick follow-up. If filling the gap between the last putt and the awards dinner is something you're actively solving for ${tournamentLabel}, my number is (424) 394-1850.</p>
<p style="margin:0 0 18px;">If it's already covered, no problem — happy to circle back for 2027.</p>
<p style="margin:0 0 18px;">${tournamentsLink}</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: `Last note on ${tournamentLabel}`,
        preheader: `Closing the loop.`,
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">Hi ${firstName},</p>
<p style="margin:0 0 18px;">Closing the loop. If close-up magic for the hospitality tents or post-round reception fits ${tournamentLabel}, the door's open: (424) 394-1850.</p>
<p style="margin:0 0 18px;">If not the right year, want me to circle back January 2027 when planning starts? Just say the word.</p>
<p style="margin:0 0 18px;">${tournamentsLink}</p>
${signoffFull()}`),
      },
    ],
  };

  const lookupKey = category as CampaignCategory;
  const templates = TEMPLATES[lookupKey];
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
        const previewCompany = body.previewCompany ?? null;
        const previewCity = body.previewCity ?? null;
        const previewTournament = body.previewTournament ?? null;
        const template = getCampaignEmail(category as CampaignCategory, step, previewName, "preview", previewCompany, previewCity, previewTournament, null, null);
        if (!template.subject) {
          return new Response(JSON.stringify({ error: "No template found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const html = step === 0
          ? wrapPlainEmail(template.preheader, template.innerHtml, "preview@example.com", "preview", step)
          : wrapEmail(template.preheader, template.innerHtml, "preview@example.com", "preview", step);
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

    // Get all active campaigns. Order by started_at NULLS FIRST so step-0
    // contacts (which have no started_at yet) drain first, oldest imports
    // first within step-0 — preventing the in-flight tail from monopolizing
    // the daily cap.
    const { data: campaignsRaw, error: fetchErr } = await supabase
      .from("cold_email_campaigns")
      .select("*")
      .eq("status", "active")
      .lt("current_step", 5)
      .order("started_at", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });

    // Priority categories drain first within their order group (small,
    // time-sensitive lists like charity_golf shouldn't get crowded out by
    // larger backlogs).
    const PRIORITY_CATEGORIES = new Set(["charity_golf"]);
    const campaigns = campaignsRaw
      ? [...campaignsRaw].sort((a, b) => {
          const ap = PRIORITY_CATEGORIES.has(a.campaign_category) ? 0 : 1;
          const bp = PRIORITY_CATEGORIES.has(b.campaign_category) ? 0 : 1;
          return ap - bp;
        })
      : campaignsRaw;

    if (fetchErr) throw fetchErr;
    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ sent: 0, skipped: 0, completed: 0, message: "No active campaigns" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-category counters (sends + skip reasons) for fairness + observability
    const perCategorySent = new Map<string, number>();
    const perCategorySkipped = new Map<string, { cap: number; timing: number; crash: number; other: number }>();
    const bumpSkip = (cat: string, kind: "cap" | "timing" | "crash" | "other") => {
      const cur = perCategorySkipped.get(cat) ?? { cap: 0, timing: 0, crash: 0, other: 0 };
      cur[kind]++;
      perCategorySkipped.set(cat, cur);
    };

    for (const campaign of campaigns as ColdCampaign[]) {
      const cat = campaign.campaign_category;
      try {
        const maxSteps = cat === "spirits" ? 5 : cat === "charity_golf" ? 3 : 4;
        const step = campaign.current_step;
        const lastSent = campaign.last_email_sent_at ? new Date(campaign.last_email_sent_at) : null;
        const started = campaign.started_at ? new Date(campaign.started_at) : null;

        // Step 0: send immediately (if not already sent)
        if (step === 0 && !started) {
          // First email — send now
        } else if (step >= maxSteps) {
          // Completed
          await supabase.from("cold_email_campaigns").update({ status: "completed" }).eq("id", campaign.id);
          completed++;
          continue;
        } else {
          // Check timing for next email
          if (!lastSent) { skipped++; bumpSkip(cat, "timing"); continue; }
          const daysSinceLast = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24);
          // Spirits:         0, 3, 7, 14, 21 → intervals 3, 4, 7, 7
          // Wedding planner: 0, 3, 7, 14     → intervals 3, 4, 7
          // Charity golf:    0, 4, 9         → intervals 4, 5
          // Others:          0, 3, 10, 24    → intervals 3, 7, 14
          let requiredDays: number;
          if (cat === "spirits") {
            requiredDays = step === 1 ? 3 : step === 2 ? 4 : step === 3 ? 7 : step === 4 ? 7 : 999;
          } else if (cat === "wedding_planner") {
            requiredDays = step === 1 ? 3 : step === 2 ? 4 : step === 3 ? 7 : 999;
          } else if (cat === "charity_golf") {
            requiredDays = step === 1 ? 4 : step === 2 ? 5 : 999;
          } else {
            requiredDays = step === 1 ? 3 : step === 2 ? 7 : step === 3 ? 14 : 999;
          }
          if (daysSinceLast < requiredDays) {
            skipped++;
            bumpSkip(cat, "timing");
            continue;
          }
        }

        // Per-category daily cap (fairness across categories)
        const catSentToday = perCategorySent.get(cat) ?? 0;
        if (catSentToday >= PER_CATEGORY_DAILY_CAP) {
          backlogged++;
          bumpSkip(cat, "cap");
          continue;
        }

        // Global daily cap check
        if (sentToday + sent >= DAILY_SEND_CAP) {
          dailyCapReached = true;
          backlogged++;
          bumpSkip(cat, "cap");
          continue;
        }

        // Get email content (wrapped — never let template lookup abort the loop)
        const firstName = extractFirstName(campaign.name);
        const template = getCampaignEmail(cat as CampaignCategory, step, firstName, campaign.id, campaign.company, campaign.city, campaign.tournament_name, campaign.tournament_date, campaign.tournament_course);

        if (!template.subject) { skipped++; bumpSkip(cat, "other"); continue; }

        const html = step === 0
          ? wrapPlainEmail(template.preheader, template.innerHtml, campaign.email, campaign.id, step)
          : wrapEmail(template.preheader, template.innerHtml, campaign.email, campaign.id, step);

        const oneClickUrl = `https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/unsubscribe-oneclick?email=${encodeURIComponent(campaign.email)}`;

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
              "List-Unsubscribe": `<mailto:unsubscribe@whiterabbitla.com?subject=unsubscribe>, <${oneClickUrl}>`,
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
          if (nextStep >= maxSteps) {
            updates.status = "completed";
            completed++;
          }
          await supabase.from("cold_email_campaigns").update(updates).eq("id", campaign.id);
          sent++;
          perCategorySent.set(cat, catSentToday + 1);
          console.log(`Cold drip: sent step ${step} to ${campaign.email} (${cat})`);
        } else {
          const errBody = await emailRes.text();
          console.error(`Cold drip: failed to send to ${campaign.email}: ${errBody}`);
          skipped++;
          bumpSkip(cat, "other");
        }
      } catch (rowErr) {
        // One bad row must NEVER abort the loop. Log + count + continue.
        console.error(`Cold drip: row crash id=${campaign.id} category=${cat} step=${campaign.current_step}:`, rowErr instanceof Error ? rowErr.message : rowErr);
        skipped++;
        bumpSkip(cat, "crash");
        continue;
      }
    }

    const perCategoryBreakdown: Record<string, { sent: number; skipped: { cap: number; timing: number; crash: number; other: number } }> = {};
    const allCats = new Set<string>([...perCategorySent.keys(), ...perCategorySkipped.keys()]);
    for (const c of allCats) {
      perCategoryBreakdown[c] = {
        sent: perCategorySent.get(c) ?? 0,
        skipped: perCategorySkipped.get(c) ?? { cap: 0, timing: 0, crash: 0, other: 0 },
      };
    }

    console.log(
      `Cold drip summary: processed ${campaigns.length} rows, sent ${sent} emails, skipped ${skipped} (cap+timing+crash+other), completed ${completed}, backlogged ${backlogged}, sentTodayBefore ${sentToday}, dailyCapReached ${dailyCapReached}, per-category: ${JSON.stringify(perCategoryBreakdown)}`
    );

    return new Response(JSON.stringify({ sent, skipped, completed, backlogged, dailyCapReached, sentToday, processed: campaigns.length, perCategoryBreakdown }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("cold-drip error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
