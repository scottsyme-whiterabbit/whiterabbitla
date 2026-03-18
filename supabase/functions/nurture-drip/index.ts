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
// SHARED HELPERS
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

const CALENDAR_URL = "https://calendar.app.google/58WjggPt3RFAcJjq8";

function bookCallCTA(contactId: string, step: number, campaign: string): string {
  const sep = CALENDAR_URL.includes("?") ? "&" : "?";
  const taggedUrl = `${CALENDAR_URL}${sep}utm_source=email&utm_medium=nurture-drip&utm_campaign=${encodeURIComponent(campaign)}&utm_content=nurture-${step}`;
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${100 + step}&r=${encodeURIComponent(taggedUrl)}`;
  return `<p style="margin:24px 0 0; text-align:center;">
<a href="${trackingUrl}" target="_blank" style="display:inline-block; padding:12px 32px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C9A3A8; text-decoration:none; font-weight:bold; border:1px solid #C9A3A8; border-radius:2px;">Book a Call</a>
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
// These fire AFTER the cold drip sequence completes.
// ═══════════════════════════════════════════════

function getNurtureEmail(category: CampaignCategory, step: number, name: string, contactId: string): { subject: string; preheader: string; innerHtml: string } {
  const firstName = extractFirstName(name);
  const experienceLink = trackedLink(`${SITE_URL}/experience`, "whiterabbitla.com/event-magician", contactId, step, `nurture-${category}`);
  const deckLink = trackedLink(`${SITE_URL}/deck`, "digital lookbook", contactId, step, `nurture-${category}`);
  const quizLink = trackedLink(`${SITE_URL}/quiz`, "35-second quiz", contactId, step, `nurture-${category}`);
  const cta = bookCallCTA(contactId, step, `nurture-${category}`);

  // Category-specific article links for nurture
  const blogLinks: Record<CampaignCategory, { b1: string; b2: string }> = {
    corporate_planner: {
      b1: trackedLink(`${SITE_URL}/blog/corporate-entertainment-trends-2026`, "Corporate Entertainment Trends for 2026", contactId, step, `nurture-${category}`),
      b2: trackedLink(`${SITE_URL}/blog/why-cocktail-hour-entertainment-matters`, "Why Cocktail Hour Entertainment Matters", contactId, step, `nurture-${category}`),
    },
    wedding_planner: {
      b1: trackedLink(`${SITE_URL}/blog/wedding-entertainment-beyond-the-dj`, "Wedding Entertainment Beyond the DJ", contactId, step, `nurture-${category}`),
      b2: trackedLink(`${SITE_URL}/blog/hollywood-rehearsal-dinner-magician`, "Why Planners Are Adding Magic to Rehearsal Dinners", contactId, step, `nurture-${category}`),
    },
    country_club: {
      b1: trackedLink(`${SITE_URL}/blog/golf-tournament-entertainment-ideas`, "Golf Tournament Entertainment Ideas", contactId, step, `nurture-${category}`),
      b2: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Event Looks Like", contactId, step, `nurture-${category}`),
    },
    pr_agency: {
      b1: trackedLink(`${SITE_URL}/blog/surprise-clients-entertainment-they-didnt-know-they-wanted`, "Surprise Clients With Entertainment They Didn't Know They Wanted", contactId, step, `nurture-${category}`),
      b2: trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Best Magic Experiences in Los Angeles", contactId, step, `nurture-${category}`),
    },
    nonprofit: {
      b1: trackedLink(`${SITE_URL}/blog/why-cocktail-hour-entertainment-matters`, "Why Cocktail Hour Entertainment Matters", contactId, step, `nurture-${category}`),
      b2: trackedLink(`${SITE_URL}/event-magician`, "See How White Rabbit Transforms Events", contactId, step, `nurture-${category}`),
    },
    talent_management: {
      b1: trackedLink(`${SITE_URL}/blog/how-to-vet-magician-high-end-event`, "How to Vet a Magician for a High-End Event", contactId, step, `nurture-${category}`),
      b2: trackedLink(`${SITE_URL}/event-magician`, "See What a White Rabbit Experience Looks Like", contactId, step, `nurture-${category}`),
    },
    restaurant: {
      b1: trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Best Magic Experiences in Los Angeles", contactId, step, `nurture-${category}`),
      b2: trackedLink(`${SITE_URL}/blog/magic-monday-studio-city`, "Magic Monday in Studio City", contactId, step, `nurture-${category}`),
    },
    spirits: {
      b1: trackedLink(`${SITE_URL}/blog/magic-for-spirits-brands-activations`, "Why Spirits Brands Are Adding Live Magic to Activations", contactId, step, `nurture-${category}`),
      b2: trackedLink(`${SITE_URL}/blog/surprise-clients-entertainment-they-didnt-know-they-wanted`, "Surprise Clients With Entertainment They Didn't Know They Wanted", contactId, step, `nurture-${category}`),
    },
  };
  const bl = blogLinks[category];

  // Category display names for natural phrasing
  const categoryNames: Record<CampaignCategory, string> = {
    corporate_planner: "corporate events",
    wedding_planner: "weddings",
    country_club: "member events",
    pr_agency: "client activations",
    nonprofit: "fundraising galas",
    talent_management: "private events",
    restaurant: "dining experiences",
    spirits: "brand activations",
  };
  const eventType = categoryNames[category];

  // Category-specific verb for "planners" / "teams" / etc.
  const audienceLabels: Record<CampaignCategory, string> = {
    corporate_planner: "planners",
    wedding_planner: "planners",
    country_club: "club directors",
    pr_agency: "agency teams",
    nonprofit: "event chairs",
    talent_management: "talent managers",
    restaurant: "restaurateurs",
    spirits: "brand teams",
  };
  const audience = audienceLabels[category];

  const TEMPLATES: Record<CampaignCategory, Array<{ subject: string; preheader: string; innerHtml: string }>> = {
    // ═══════════════════════════════════════════════
    // CORPORATE PLANNER NURTURE
    // ═══════════════════════════════════════════════
    corporate_planner: [
      {
        subject: "What a Rivian product launch looked like",
        preheader: "Behind the scenes of a high-touch corporate event.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I wanted to share something I thought you would find interesting. I recently performed at a Rivian product launch. 150 guests, open-air cocktail reception. I did strolling close-up magic and mind reading for about 90 minutes while guests explored the new vehicles.</p>
<p style="margin:0 0 18px;">The brand team told me afterward that guests spent 40 percent more time on the floor than at previous launches. Interactive entertainment gives people a reason to stay, mingle, and engage with what you are showcasing.</p>
<p style="margin:0 0 18px;">If you have anything coming up where guest engagement matters, I would love to chat.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "A resource for your next corporate event",
        preheader: "Something different for cocktail hour.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I put together a short article on what is working in corporate entertainment right now. Thought it might be useful as you plan upcoming events.</p>
<p style="margin:0 0 18px;">${bl.b1}</p>
<p style="margin:0 0 18px;">The short version: the events people remember are never about the venue or the menu. They are about the moments that caught them off guard. That is what I do.</p>
<p style="margin:0 0 18px;">My fall calendar is starting to fill. If anything is on the horizon, I am always happy to check availability.</p>
${signoffFull()}`),
      },
      {
        subject: "Something I hear from planners after the first booking",
        preheader: "The reaction that gets me rebooked.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is the most common thing planners say to me after the first event: "I did not expect the reaction to be that big."</p>
<p style="margin:0 0 18px;">Close-up magic and mind reading at a cocktail reception creates a level of guest engagement that most entertainment cannot match. People are participating, laughing, filming each other, and talking about it at the bar afterward. It transforms the energy of the entire event.</p>
<p style="margin:0 0 18px;">I work with repeat clients at Netflix, Morgan Stanley, and Disney. Once planners see it live, it becomes a standard line item.</p>
<p style="margin:0 0 18px;">${bl.b2}</p>
${signoff()}`),
      },
      {
        subject: "Checking in",
        preheader: "Quick note — no pressure at all.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Just a quick check-in. I know event calendars shift constantly, so I wanted to make sure you still have my info for whenever the right event comes up.</p>
<p style="margin:0 0 18px;">Whether it is a client dinner, holiday party, product launch, or team event — I am always happy to put together a custom proposal. My calendar fills 4 to 6 weeks out during peak season.</p>
<p style="margin:0 0 18px;">${experienceLink}</p>
${cta}
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // WEDDING PLANNER NURTURE
    // ═══════════════════════════════════════════════
    wedding_planner: [
      {
        subject: "What happened at a Lake Tahoe rehearsal dinner",
        preheader: "The part of the wedding guests remember most.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I performed at a rehearsal dinner in Lake Tahoe last month. 60 guests, outdoor terrace, golden hour. I did close-up magic moving between tables for about an hour. By the end of the night, the groom's father pulled me aside and said it was the highlight of the entire wedding weekend.</p>
<p style="margin:0 0 18px;">Rehearsal dinners and welcome parties are where I have seen the most demand lately. It is a more intimate setting where magic really shines, and it gives the couple something unexpected to offer their guests.</p>
<p style="margin:0 0 18px;">${bl.b2}</p>
${signoffFull()}`),
      },
      {
        subject: "A trend I am seeing in luxury weddings",
        preheader: "Entertainment beyond the DJ and photo booth.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I wrote something recently about how wedding entertainment is evolving beyond the traditional DJ and photo booth. Thought you might find it useful.</p>
<p style="margin:0 0 18px;">${bl.b1}</p>
<p style="margin:0 0 18px;">The couples who book me are looking for something their guests have never experienced at a wedding before. Something that makes people say, "How did you find this?" That reaction reflects directly on the planner.</p>
<p style="margin:0 0 18px;">My wedding season calendar fills early, so if you have couples considering this for 2026, I am happy to chat.</p>
${signoff()}`),
      },
      {
        subject: "Why planners add me to their proposals",
        preheader: "Zero logistics, maximum impact.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">A planner I work with in LA told me she now includes me in every luxury wedding proposal. The reason is simple: couples love the idea once they see it, it requires zero logistics from her team, and the guest reaction makes her look like a genius.</p>
<p style="margin:0 0 18px;">I show up 15 minutes before cocktail hour, perform for 45 to 60 minutes, and slip out before dinner. No setup, no sound, no coordination beyond a start time. It is the easiest vendor on your timeline.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "For your 2026 couples",
        preheader: "Planting the seed for wedding season.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Just a gentle note as wedding season planning picks up. If any of your couples are looking for something unexpected for cocktail hour, rehearsal dinner, or welcome party entertainment, I would love to be on your vendor list.</p>
<p style="margin:0 0 18px;">I travel nationwide for weddings and my peak season dates book months in advance.</p>
<p style="margin:0 0 18px;">${experienceLink}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // COUNTRY CLUB NURTURE
    // ═══════════════════════════════════════════════
    country_club: [
      {
        subject: "How a golf club used magic for their member gala",
        preheader: "The event members referenced for months.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I wanted to share a quick example of how a private club used strolling magic at their annual gala. I performed during the cocktail reception, moving between groups of members for about 90 minutes. The club director told me it was the first event where members stayed through the entire evening without a single early exit.</p>
<p style="margin:0 0 18px;">The format works especially well for clubs because it elevates the social experience without changing anything about the event structure. No stage, no AV, no disruption.</p>
<p style="margin:0 0 18px;">${bl.b1}</p>
${signoffFull()}`),
      },
      {
        subject: "Recurring entertainment programming for clubs",
        preheader: "Monthly or quarterly magic nights.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Some of the clubs I work with have moved from single-event bookings to recurring monthly or quarterly programming. It gives their social calendar a signature event that members look forward to and invite guests to attend.</p>
<p style="margin:0 0 18px;">If that kind of ongoing programming would be a better fit for your club, I am happy to put together a custom proposal with preferred pricing for recurring dates.</p>
${cta}
${signoff()}`),
      },
      {
        subject: "An idea for your holiday calendar",
        preheader: "Interactive entertainment for holiday events.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">As you start building out your holiday event calendar, I wanted to plant the idea of adding interactive entertainment to one of your upcoming member events. Holiday galas, New Year's Eve parties, and member appreciation dinners are all formats where strolling close-up magic and mind reading create an incredible atmosphere.</p>
<p style="margin:0 0 18px;">My holiday calendar fills quickly, so if anything is on the radar, it is worth locking in a date early.</p>
<p style="margin:0 0 18px;">${bl.b2}</p>
${signoffFull()}`),
      },
      {
        subject: "Still here if you need me",
        preheader: "For whenever the right event comes along.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Just a quick note to keep me on your radar. Whether it is a holiday gala, golf tournament dinner, or themed member night — I am always available to chat about adding interactive entertainment to your event calendar.</p>
<p style="margin:0 0 18px;">${experienceLink}</p>
${cta}
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // PR AGENCY NURTURE
    // ═══════════════════════════════════════════════
    pr_agency: [
      {
        subject: "How a brand launch generated organic content without influencers",
        preheader: "Guest phones out — unprompted.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I performed at a product launch recently where within the first 15 minutes, a dozen guests had their phones out filming. No influencer brief, no content ask. They just could not believe what was happening in front of them.</p>
<p style="margin:0 0 18px;">That is the value of live interactive magic at a brand event: real reactions create organic, authentic content that performs better than anything staged. And your client's brand is in every frame.</p>
<p style="margin:0 0 18px;">${bl.b1}</p>
${signoffFull()}`),
      },
      {
        subject: "Something useful for your next client pitch",
        preheader: "The experiential element clients did not know they wanted.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I wrote something recently about experiential elements that agencies are adding to client events. Thought it might be useful as you build out proposals.</p>
<p style="margin:0 0 18px;">${bl.b1}</p>
<p style="margin:0 0 18px;">The short version: close-up magic and mind reading give your client a "how did you think of this?" moment at a price point that is a fraction of most experiential activations. And it requires zero logistics from your team.</p>
${signoff()}`),
      },
      {
        subject: "Why agencies keep booking me for the same clients",
        preheader: "The vendor your client remembers.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is a pattern I see often: an agency books me for a client event. The client's guests love it. The client asks the agency to book me again for their next event. It becomes a recurring line item.</p>
<p style="margin:0 0 18px;">That repeat business reflects well on the agency. You become the team that found something the client's guests actually talk about.</p>
<p style="margin:0 0 18px;">Happy to be a resource whenever you need experiential talent.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Quick check-in from Scott",
        preheader: "For your next client event or activation.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Just keeping myself on your radar for whenever the right client event comes along. Product launches, press dinners, VIP receptions, brand activations — I work across all of them.</p>
<p style="margin:0 0 18px;">${experienceLink}</p>
${cta}
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // NONPROFIT NURTURE
    // ═══════════════════════════════════════════════
    nonprofit: [
      {
        subject: "How a charity gala kept donors in the room all night",
        preheader: "Table-side entertainment before the paddle raise.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I performed at a fundraising gala recently where the event chair specifically told me their biggest challenge was keeping donors engaged before the paddle raise. Guests would leave early, step out for calls, or lose energy by the time the giving portion started.</p>
<p style="margin:0 0 18px;">I did table-side close-up magic during the cocktail reception and first course. By the time the auctioneer took the stage, the entire room was energized. The chair told me they raised 15 percent more than the previous year.</p>
<p style="margin:0 0 18px;">If you have a gala coming up, I would love to help create that same energy.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "A dual role that saves you a vendor",
        preheader: "Entertainment plus auctioneer in one.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Something I have been doing more of at fundraising galas: serving as both the interactive entertainment during cocktail hour and the emcee or auctioneer during the program portion. It creates a seamless arc through the evening and saves the organization the cost of booking two separate vendors.</p>
<p style="margin:0 0 18px;">I did this recently at a FosterAll gala at the Jonathan Club. The energy I built during cocktail hour carried directly into the live auction.</p>
<p style="margin:0 0 18px;">${bl.b1}</p>
${signoff()}`),
      },
      {
        subject: "Planning your next annual event?",
        preheader: "Interactive entertainment that elevates your gala.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">If your organization is starting to plan your next annual gala or fundraiser, I wanted to make sure you were thinking about the guest experience during those critical early hours. The cocktail reception and dinner are where donor energy is built. Interactive entertainment during that window creates the emotional openness that translates into generosity.</p>
<p style="margin:0 0 18px;">I am always happy to put together a custom proposal that fits your event format and budget.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Keeping in touch",
        preheader: "For your next fundraising event.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I know nonprofit event planning has long lead times. Just wanted to keep my info in your back pocket for whenever the next gala, fundraiser, or donor event is on the calendar.</p>
<p style="margin:0 0 18px;">Always happy to connect.</p>
<p style="margin:0 0 18px;">${experienceLink}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // TALENT MANAGEMENT NURTURE
    // ═══════════════════════════════════════════════
    talent_management: [
      {
        subject: "A private event your clients will not stop talking about",
        preheader: "Close-up mind reading for intimate gatherings.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I recently performed at a private birthday celebration for a high-profile client. 25 guests, all close friends and family. By the end of the evening, I had read the minds of half the room and made impossible predictions come true in people's hands. Three guests independently asked for my contact info before they left.</p>
<p style="margin:0 0 18px;">For private events with discerning guests who have seen everything, close-up magic and mind reading offers something genuinely new. And discretion is always standard.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Why private event hosts rebook me",
        preheader: "The referral effect.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is what I notice with private event clients: after the first booking, the referrals start. Guests at the party want me for their birthday. The host books me again for a holiday gathering. It becomes a word-of-mouth chain that starts with one event.</p>
<p style="margin:0 0 18px;">If any of your clients are hosting private events, milestone celebrations, or intimate dinners, I would love to be on your go-to list.</p>
<p style="margin:0 0 18px;">${bl.b1}</p>
${signoff()}`),
      },
      {
        subject: "Something different for your next client event",
        preheader: "The talent their guests do not expect.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">For clients who have experienced every type of entertainment, close-up magic and mind reading hits differently. It is personal, it is participatory, and it happens right in front of them. No stage, no spectacle, just genuine astonishment three feet away.</p>
<p style="margin:0 0 18px;">I am comfortable in any environment — private estates, hotel suites, yachts, restaurants. I carry my own insurance and handle all logistics independently.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Quick note from Scott",
        preheader: "For whenever the right event comes up.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Just keeping in touch. Whenever your clients are hosting a private event, dinner party, or milestone celebration, I am always available for an avails check.</p>
<p style="margin:0 0 18px;">${experienceLink}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // RESTAURANT NURTURE
    // ═══════════════════════════════════════════════
    restaurant: [
      {
        subject: "How a restaurant turned Tuesday into their busiest night",
        preheader: "Table-side magic that fills seats.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I wanted to share a quick example. A restaurant I work with in LA started a weekly magic night on their slowest evening. Within a month, it became their busiest night. Guests started making reservations specifically for it, bringing friends who had never been to the restaurant before.</p>
<p style="margin:0 0 18px;">The math is simple: higher covers, higher check averages (guests stay longer and order more), and free word-of-mouth marketing from guests posting their experience.</p>
<p style="margin:0 0 18px;">If you have a night that could use a boost, I am happy to chat about a trial.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "What guests post about your restaurant",
        preheader: "Organic social content from real reactions.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is something restaurants tell me: the social media posts from magic nights get more engagement than anything else they do. Guests film the reactions, tag the restaurant, and their friends ask where it is. It becomes a discovery engine.</p>
<p style="margin:0 0 18px;">${bl.b2}</p>
<p style="margin:0 0 18px;">No hashtag campaigns, no influencer budgets. Just real moments that people want to share.</p>
${signoff()}`),
      },
      {
        subject: "A no-commitment trial night",
        preheader: "See the guest reaction firsthand.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I know adding a new element to your restaurant is a decision that requires seeing it work firsthand. That is why I offer a complimentary trial night. One evening, no commitment, no contract. You see how your guests react, and we go from there.</p>
<p style="margin:0 0 18px;">I work with your host to time my table visits between courses. No disruption to service, no setup, no sound system. Just an elevated guest experience that happens right at the table.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "Whenever you are ready",
        preheader: "The offer stands.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Just a quick note to say the trial night offer always stands. Whenever you want to test table-side entertainment at your restaurant, I am here.</p>
<p style="margin:0 0 18px;">I have weeknight availability and my calendar gets busier during the holidays, so planning ahead helps.</p>
<p style="margin:0 0 18px;">${experienceLink}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // SPIRITS BRAND NURTURE
    // ═══════════════════════════════════════════════
    spirits: [
      {
        subject: "Behind the scenes of a Taittinger activation",
        preheader: "What happened when we added magic to a tasting event.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I recently performed at a Taittinger tasting event — 80 guests, rooftop venue. I did strolling close-up magic during the reception, integrating the brand into the experience. By the second set, guests were pulling their friends over, phones were out, and the brand was being tagged organically.</p>
<p style="margin:0 0 18px;">The brand team told me they received more social mentions from that single evening than from their previous three events combined. Interactive entertainment creates moments that your audience wants to share — unprompted.</p>
<p style="margin:0 0 18px;">If you have an activation on the calendar, I would love to explore this together.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "The experiential gap most brands miss",
        preheader: "Why live interaction outperforms passive experiences.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Most brand activations give guests something to look at. The ones that actually drive engagement give guests something to participate in. That is the gap that close-up magic fills.</p>
<p style="margin:0 0 18px;">When a guest hands me their phone and watches something impossible happen on the screen, they do not just remember it. They tell the story at dinner the next night, and your brand is in the story.</p>
<p style="margin:0 0 18px;">${bl.b1}</p>
${signoff()}`),
      },
      {
        subject: "Scaling the magic across multiple markets",
        preheader: "For multi-city brand activations.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Something worth mentioning: I travel nationwide for brand events. If your activation calendar spans multiple markets, I can be a consistent experiential element across cities — same quality, same impact, one point of contact.</p>
<p style="margin:0 0 18px;">Product launches, trade events, VIP tasting dinners, festival activations. I have performed at all of them.</p>
${cta}
${signoffFull()}`),
      },
      {
        subject: "For your next activation",
        preheader: "The offer is always open.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I know brand event calendars plan far in advance. Just wanted to make sure I am on your radar for whenever the next activation, launch, or tasting event comes together.</p>
<p style="margin:0 0 18px;">My calendar fills 4 to 6 weeks out during peak season, so early conversations help.</p>
<p style="margin:0 0 18px;">${experienceLink}</p>
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

    // Count emails already sent today (Pacific time)
    const todayPacific = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);
    const todayStart = new Date(`${todayPacific}T00:00:00-08:00`).toISOString();
    const { count: sentTodayCount } = await supabase
      .from("cold_email_campaigns")
      .select("id", { count: "exact", head: true })
      .gte("nurture_last_sent_at", todayStart);
    const sentToday = sentTodayCount ?? 0;

    // Step 1: Auto-enroll completed cold campaigns that haven't started nurture yet
    const { data: newNurtures, error: enrollErr } = await supabase
      .from("cold_email_campaigns")
      .select("id")
      .eq("status", "completed")
      .eq("nurture_status", "pending");

    if (enrollErr) throw enrollErr;

    if (newNurtures && newNurtures.length > 0) {
      // Only enroll campaigns that completed cold drip at least 30 days ago
      for (const campaign of newNurtures) {
        // Get the full campaign to check last_email_sent_at
        const { data: full } = await supabase
          .from("cold_email_campaigns")
          .select("last_email_sent_at")
          .eq("id", campaign.id)
          .single();

        if (full?.last_email_sent_at) {
          const daysSinceCompletion = (now.getTime() - new Date(full.last_email_sent_at).getTime()) / (1000 * 60 * 60 * 24);
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

      // Step 0: send immediately if just enrolled (nurture_started_at is set but no nurture emails sent yet)
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

      // Daily send cap check
      if (sentToday + sent >= DAILY_SEND_CAP) {
        dailyCapReached = true;
        backlogged++;
        continue;
      }

      // Get email content
      const firstName = extractFirstName(campaign.name);
      const template = getNurtureEmail(campaign.campaign_category as CampaignCategory, step, firstName, campaign.id);

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
