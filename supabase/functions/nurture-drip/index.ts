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

type CampaignCategory = "corporate_planner" | "wedding_planner" | "country_club" | "pr_agency" | "nonprofit" | "talent" | "restaurant" | "spirits";

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
// SHARED HELPERS (copied from cold-drip)
// ═══════════════════════════════════════════════

function signoff(): string {
  return `<p style="margin:0; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);">
Scott Syme<br/>
<span style="font-size:13px; color:rgba(245,240,232,0.5);">Magician</span><br/>
<span style="font-size:12px; color:rgba(245,240,232,0.35);"><a href="tel:+14243941850" style="color:rgba(245,240,232,0.35); text-decoration:none;">(424) 394-1850</a></span><br/>
<span style="font-size:12px;"><a href="https://whiterabbitla.com" style="color:rgba(245,240,232,0.35); text-decoration:none;">whiterabbitla.com</a></span>
</p>`;
}
const signoffFull = signoff;

function trackedLink(url: string, text: string, contactId: string, step: number, campaign: string): string {
  const sep = url.includes("?") ? "&" : "?";
  const taggedUrl = `${url}${sep}utm_source=email&utm_medium=nurture-drip&utm_campaign=${encodeURIComponent(campaign)}&utm_content=nurture-${step}`;
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${100 + step}&r=${encodeURIComponent(taggedUrl)}`;
  return `<a href="${trackingUrl}" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);" target="_blank">${text}</a>`;
}

const GALLERY_URL = `${SITE_URL}/experience/gallery`;
const BOOKING_URL = "https://calendar.app.google/9DnGRoMUWaMDvvpt9";

function buildTrackedUrl(url: string, contactId: string, step: number, campaign: string, content: string): string {
  const sep = url.includes("?") ? "&" : "?";
  const taggedUrl = `${url}${sep}utm_source=email&utm_medium=nurture-drip&utm_campaign=${encodeURIComponent(campaign)}&utm_content=${encodeURIComponent(content)}`;
  return `${TRACK_URL}?cid=${contactId}&step=${100 + step}&r=${encodeURIComponent(taggedUrl)}`;
}

// Unified bottom-of-email CTA: emerald button to gallery + secondary calendar link.
// Both links are click-tracked through /track-click. `label` is accepted for
// backwards compatibility with existing call sites but no longer used.
function bookCallCTA(contactId: string, step: number, campaign: string, _label: string = "Book a Call"): string {
  const galleryTracking = buildTrackedUrl(GALLERY_URL, contactId, step, campaign, `nurture-${step}-gallery`);
  const calendarTracking = buildTrackedUrl(BOOKING_URL, contactId, step, campaign, `nurture-${step}-calendar`);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:28px 0 0;">
<tr><td align="center" style="text-align:center;">
<a href="${galleryTracking}" target="_blank" style="display:inline-block; padding:14px 32px; font-family:Georgia,serif; font-size:13px; letter-spacing:1.5px; text-transform:uppercase; color:#F8F5F0; background-color:#3A6B52; text-decoration:none; font-weight:bold; border-radius:6px; mso-padding-alt:14px 32px;">gallery link</a>
</td></tr>
<tr><td align="center" style="text-align:center; padding-top:12px;">
<p style="margin:0; font-family:Georgia,serif; font-size:13px; line-height:1.6; color:rgba(245,240,232,0.65);">or <a href="${calendarTracking}" target="_blank" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.4);">calendar link</a></p>
</td></tr>
</table>`;
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
// Fires AFTER cold drip completes (all 4 cold emails sent)
// ═══════════════════════════════════════════════

function getNurtureEmail(category: CampaignCategory, step: number, name: string, contactId: string): { subject: string; preheader: string; innerHtml: string } {
  const firstName = extractFirstName(name);
  const cta = bookCallCTA(contactId, step, `nurture-${category}`);
  const ctaGrab = bookCallCTA(contactId, step, `nurture-${category}`, "Grab a Time");

  const TEMPLATES: Record<string, Array<{ subject: string; preheader: string; innerHtml: string }>> = {
    // ═══════════════════════════════════════════════
    // CORPORATE PLANNER NURTURE
    // ═══════════════════════════════════════════════
    corporate_planner: [
      {
        subject: "When the phones go face-down",
        preheader: "What happens when close-up magic lands in a corporate room.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">A recent corporate dinner. Sharp room, skeptical guests, not easily impressed.</p>
<p style="margin:0 0 18px;">Within 90 seconds of starting close-up magic at the tables, every phone in the room went face-down. Not because anyone asked. Because what was happening three feet away was more interesting than anything on the screen.</p>
<p style="margin:0 0 18px;">The conversations at dinner were different after that. People were looser, more connected. I have seen the same thing at Rivian, Rolls-Royce, and Morgan Stanley events. When something unexpected happens up close, the room resets.</p>
<p style="margin:0 0 18px;">Worth a quick conversation if you are planning anything where the energy in the room matters.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/why-cocktail-hour-entertainment-matters`, "Why Cocktail Hour Entertainment Changes Everything", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Your Q4 dates are going fast",
        preheader: "Holiday parties, galas, client dinners — best dates book early.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">My calendar is filling up for the fall. Holiday parties, year-end galas, and client dinners all tend to cluster between October and December, and the best dates go fast.</p>
<p style="margin:0 0 18px;">Rivian booked months in advance, which gave us time to tailor the experience to their audience and event flow. Even if your event is still a maybe — it is worth a 15-minute call to hold a date and talk through the format, audience, and style so there are no surprises.</p>
${ctaGrab}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/corporate-entertainment-trends-2026`, "Corporate Entertainment Trends Worth Knowing", contactId, step, `nurture-${category}`)}</p>
${signoff()}`),
      },
      {
        subject: "3 entertainment mistakes smart planners avoid",
        preheader: "After Morgan Stanley, Rivian, Rolls-Royce — the patterns are clear.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">After performing at hundreds of corporate events, I have noticed three things that trip up even experienced planners:</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">1. Wrong time slot.</strong> Transitions work 10x better than a standalone entertainment block. Cocktail hour, between courses, during a reception — those natural pauses are when magic hits hardest.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">2. Stage when it should be close-up.</strong> Under 200 guests, tables and small groups create connection. A stage creates distance. The intimacy is the whole point.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">3. Treating entertainment as decoration.</strong> The real value is not what happens during the performance — it is what happens after. Eight people who just saw something impossible together now have something to talk about.</p>
<p style="margin:0 0 18px;">I put together a guide called the ${trackedLink(`${SITE_URL}/hosts-playbook`, "Host's Playbook", contactId, step, `nurture-${category}`)} that covers more of this.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/entertainment-gap-planners-dont-know`, "The Entertainment Gap Planners Don't Know They Have", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Valet stand to Rolls-Royce",
        preheader: "The unlikely path to White Rabbit LA.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Before White Rabbit LA — I was in real estate. Before that — I was parking cars.</p>
<p style="margin:0 0 18px;">Magic was always on the side — at the valet stand, at open mics, anywhere someone would watch. What I learned parking cars for people arriving at luxury events: the experience starts before the front door.</p>
<p style="margin:0 0 18px;">Today I perform for Morgan Stanley, Rivian, and Rolls-Royce. I have performed at Soho House and the Jonathan Club, done walk-around magic for a wedding at Cipriani in New York, and headlined a larger private party in Boston. But the approach is the same: make every person feel like the most important one in the room.</p>
<p style="margin:0 0 18px;">If that is the kind of energy your next event needs, let's talk.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/how-to-choose-entertainment-for-luxury-event`, "How to Choose Entertainment for a Luxury Event", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // WEDDING PLANNER NURTURE
    // ═══════════════════════════════════════════════
    wedding_planner: [
      {
        subject: "The cocktail hour save in Coral Gables",
        preheader: "What happened when the couple disappeared for photos.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I performed at a wedding in Coral Gables recently. The couple was worried about cocktail hour — they would be off doing photos for an hour, their guests barely knew each other, and the energy could easily flatline.</p>
<p style="margin:0 0 18px;">I spent that hour doing close-up magic between groups of guests. Within minutes, strangers were laughing together, handing me their phones, trying to figure out how I knew what they were thinking. By the time the couple walked in for the reception, the room was electric.</p>
<p style="margin:0 0 18px;">The bride told me later that guests mentioned the magic more than anything else in their thank-you notes. I have seen the same thing happen at a Monterey wedding, at private estates, and everywhere in between.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/wedding-entertainment-beyond-the-dj`, "Wedding Entertainment Beyond the DJ", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Your couples don't know this exists",
        preheader: "Engagement season is here — and couples care about entertainment.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Engagement season is here. Couples care about entertainment more than ever, but most default to the same playbook: DJ and photo booth.</p>
<p style="margin:0 0 18px;">The reaction I get from every couple I meet is the same: "Wait — we can have THIS at our wedding?"</p>
<p style="margin:0 0 18px;">Close-up magic during cocktail hour. A parlor show between courses. Mentalism at the tables. It is the kind of entertainment that makes guests stop what they are doing and lean in. From Coral Gables to Monterey to LA — every couple says the same thing: they wish they had known sooner.</p>
${ctaGrab}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/why-cocktail-hour-entertainment-matters`, "Why Cocktail Hour Entertainment Changes Everything", contactId, step, `nurture-${category}`)}</p>
${signoff()}`),
      },
      {
        subject: "What guests actually remember (it's not the cake)",
        preheader: "The moments that get mentioned at brunch the next day.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Guests forget the centerpieces. They forget the linens. They forget the cake flavor. What they remember are the unexpected moments — the stories they tell at brunch the next morning.</p>
<p style="margin:0 0 18px;">Three things make wedding entertainment actually land:</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">1. Match the style to the venue.</strong> A garden wedding and a hotel ballroom need completely different energy.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">2. Time it right.</strong> Cocktail hour and transitions are the sweet spots — not during the toasts, not during first dance.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">3. Make it personal.</strong> The best moments happen when guests feel like the experience was made for them, not performed at them.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/how-to-vet-magician-high-end-event`, "How to Vet a Magician for a High-End Event", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "She said 'you made me belong'",
        preheader: "A moment from a Monterey wedding.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">At a wedding in Monterey, a woman pulled me aside after cocktail hour. She had flown in from out of state and barely knew anyone.</p>
<p style="margin:0 0 18px;">I had performed at her table — close-up magic, mind reading, the kind of thing that gets strangers talking to each other. By the time I moved on, the people around her were not strangers anymore. They became her dinner companions for the rest of the night.</p>
<p style="margin:0 0 18px;">She said, "You made me feel like I belonged."</p>
<p style="margin:0 0 18px;">Every couple worries about whether their people will mix. Entertainment does not just fill time — it solves for connection.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/why-event-planners-adding-magician-vendor-list`, "Why Event Planners Are Adding a Magician to Their Vendor List", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // COUNTRY CLUB NURTURE
    // ═══════════════════════════════════════════════
    country_club: [
      {
        subject: "What I noticed at the Jonathan Club",
        preheader: "Why members stay longer on entertainment nights.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I have performed at the Jonathan Club and Soho House multiple times now. One thing I notice every time: members at entertainment nights are more engaged, they bring guests, and they stay later.</p>
<p style="margin:0 0 18px;">Well-programmed entertainment gives members something they cannot get at home. That is the promise clubs make — and interactive magic delivers on it in a way that a wine dinner or speaker series cannot.</p>
<p style="margin:0 0 18px;">If your programming calendar has room for something different, I would love to chat about what this looks like for your club.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/golf-tournament-entertainment-ideas`, "Golf Tournament Entertainment Ideas", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Where private entertainment is heading",
        preheader: "The future of experiential entertainment is already here.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I spend my life inside the most elevated rooms in the country, and they are all moving in one direction — away from big stages and toward curated, intimate experiences guests feel up close, in their own hands. That demand is growing fast, and private clubs are positioned perfectly to lead it rather than follow.</p>
<p style="margin:0 0 18px;">Three formats that work especially well for clubs:</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Evening of Wonder</strong> — a 45-minute parlor show for 30 to 60 guests. Intimate, theatrical, unforgettable.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Roaming Cocktail Magic</strong> — close-up magic during receptions and social hours. No setup, no stage.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">NYE Mentalism</strong> — mind reading and predictions for your biggest night of the year.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Best Magic Experiences in Los Angeles", contactId, step, `nurture-${category}`)}</p>
${signoff()}`),
      },
      {
        subject: "The metric that predicts renewals",
        preheader: "Guest introductions per event — the number that matters most.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">There is one metric I think about after every club event: guest introductions per event. It predicts F&B revenue, future attendance, and ultimately, renewals.</p>
<p style="margin:0 0 18px;">Entertainment is the biggest driver of that number. Members do not invite friends to "another wine dinner." They invite friends to "you have to see this guy." From the Jonathan Club to Soho House, I see the same pattern: the events with interactive entertainment generate the most guest introductions by a wide margin.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/entertainment-gap-planners-dont-know`, "The Entertainment Gap Planners Don't Know They Have", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Why I only partner with a few clubs",
        preheader: "Recurring entertainment that belongs to your club.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Magic works best as a recurring element, not a one-off. The first visit, members are impressed. The return visit, they become evangelists — bringing friends, requesting dates, building it into their social calendar.</p>
<p style="margin:0 0 18px;">That is why I keep the partner list small. Seasonal partnerships — three to four events per year — with priority booking, preferred pricing, and market exclusivity. Your club gets an experience that belongs to you.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Best Magic Experiences in Los Angeles", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // PR AGENCY NURTURE
    // ═══════════════════════════════════════════════
    pr_agency: [
      {
        subject: "What YouTube booked me for",
        preheader: "The brief wasn't entertain — it was create content.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">YouTube hired me for a Brittany Broski event. The brief was not "entertain the guests." It was "create organic social content."</p>
<p style="margin:0 0 18px;">Roaming close-up magic is designed to be filmed. The reactions are genuine, the moments are shareable, and the organic content extended the reach of the event far beyond the room. Guests posted without being asked — because what they saw was too good not to share.</p>
<p style="margin:0 0 18px;">Magic as a PR tool. Not as filler — as strategy.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Best Magic Experiences in Los Angeles", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "The content gap at brand events",
        preheader: "Great food and speakers don't generate organic shares.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">The real audience at any brand event is not in the room — it is the people watching on social the next morning.</p>
<p style="margin:0 0 18px;">Great food does not generate organic shares. Neither do great speakers. What generates shares are impossible moments that people cannot help but capture. Experiential entertainment fills a content gap that most event teams do not even know they have.</p>
<p style="margin:0 0 18px;">I have seen this work at YouTube events, Rolls-Royce activations, and press dinners. The formula is the same: give people something they have never seen, and they do the marketing for you.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/surprise-clients-entertainment-they-didnt-know-they-wanted`, "Surprise Clients With Entertainment They Didn't Know They Wanted", contactId, step, `nurture-${category}`)}</p>
${signoff()}`),
      },
      {
        subject: "What consulting for Olivia Rodrigo taught me",
        preheader: "Big names don't want competing entertainment — they want elevation.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I consulted for Olivia Rodrigo's team on experiential elements for a project. What I learned: big names do not want competing entertainment. They want elevation. The magic has to feel like it belongs — an extension of the brand, not a distraction from it.</p>
<p style="margin:0 0 18px;">Same principle at Rolls-Royce. The brief is never "do your thing." It is "understand our brand and create moments that say it without words."</p>
<p style="margin:0 0 18px;">That is the difference between hiring a magician and hiring a creative partner.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/surprise-clients-entertainment-they-didnt-know-they-wanted`, "Surprise Clients With Entertainment They Didn't Know They Wanted", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "From parking cars to performing for YouTube",
        preheader: "The unlikely path to White Rabbit LA.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Before White Rabbit LA — real estate. Before that — parking cars. Magic was always on the side.</p>
<p style="margin:0 0 18px;">What I learned at the valet stand: you have three seconds to read the room and make someone feel seen. That skill transfers directly to brand events, press dinners, and activations. The audience changed. The approach did not.</p>
<p style="margin:0 0 18px;">Now I perform for YouTube, Olivia Rodrigo, and Rolls-Royce. If you want to explore what this looks like for your clients, I am happy to do a free 20-minute creative consultation.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/not-kids-birthday-party-modern-magic`, "Not Your Kid's Birthday Party: Modern Magic", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // NONPROFIT NURTURE
    // ═══════════════════════════════════════════════
    nonprofit: [
      {
        subject: "What happened at the Fosterall Gala",
        preheader: "Entertainment before the fundraising ask isn't luxury — it's a primer.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I performed at the Fosterall Gala recently. Thirty-minute parlor show between dinner and the paddle raise. The room shifted — wonder, laughter, surprise — and it unified everyone in a way that a speech alone cannot.</p>
<p style="margin:0 0 18px;">The energy was different when the ask came. People were open, connected, present. The gala chair told me afterward that entertainment before the fundraising ask is not a luxury — it is a primer.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/why-cocktail-hour-entertainment-matters`, "Why Cocktail Hour Entertainment Changes Everything", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "You're asking at the wrong time",
        preheader: "Most galas front-load the fun and back-load the ask.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Most galas front-load the fun and back-load the ask. By the time the paddle raise happens, people are full and tired. The energy has left the room.</p>
<p style="margin:0 0 18px;">The fix is simple: put powerful entertainment right before the ask.</p>
<p style="margin:0 0 18px;">The ideal timeline: cocktails with roaming close-up magic, dinner, a parlor show that brings the room together, then the paddle raise while the energy is at its peak, then dessert.</p>
<p style="margin:0 0 18px;">I saw this work at Fosterall. The sequence matters more than the budget.</p>
${ctaGrab}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/entertainment-gap-planners-dont-know`, "The Entertainment Gap Planners Don't Know They Have", contactId, step, `nurture-${category}`)}</p>
${signoff()}`),
      },
      {
        subject: "Your donors know why they're there",
        preheader: "Make them feel valued, not like ATMs.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Your donors know why they are there. They do not need to be reminded. What they need is to feel valued — not like ATMs.</p>
<p style="margin:0 0 18px;">Three principles that change gala energy:</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Lead with experience, not information.</strong> The emotional state of the room matters more than the slideshow.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Make it intimate, even if it is big.</strong> Close-up magic at tables creates one-on-one moments in a room of 200.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Give them a story to tell.</strong> "You won't believe what happened at the gala" is free marketing for next year's event.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/why-event-planners-adding-magician-vendor-list`, "Why Event Planners Are Adding a Magician to Their Vendor List", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Why I give nonprofits a different rate",
        preheader: "Entertainment is a fundraising tool, not a luxury.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I offer special pricing for 501(c)(3) organizations. Fosterall proved to me that entertainment at a gala is not a luxury line item — it is a fundraising tool that directly impacts giving.</p>
<p style="margin:0 0 18px;">What the nonprofit rate includes: a reduced performance fee, a complimentary pre-event consultation to design the ideal timeline, and a post-event debrief so you know exactly what worked.</p>
<p style="margin:0 0 18px;">I would rather help you raise more at a lower rate than sit on the sideline.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/how-to-choose-entertainment-for-luxury-event`, "How to Choose Entertainment for a Luxury Event", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // TALENT NURTURE
    // ═══════════════════════════════════════════════
    talent: [
      {
        subject: "Why Adam Ray called me",
        preheader: "Even top entertainment wants participation, not just watching.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I consulted for Adam Ray on experiential elements in live events. Even top-tier entertainment talent wants participation, not just watching. The audience has changed — they want to be part of the show.</p>
<p style="margin:0 0 18px;">The opportunity for agents: close-up magic fills gaps in event programming, creates organic social content, scales from 10 to 500 guests, and differentiates your roster from every other talent agency offering the same DJ and photo booth.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/how-to-vet-magician-high-end-event`, "How to Vet a Magician for a High-End Event", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "One booking, two entertainment needs",
        preheader: "Close-up during cocktails AND a parlor show during dinner.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is a format your clients might not know exists: a hybrid entertainer who does close-up magic during cocktails AND a parlor show during dinner. One booking covers two entertainment needs.</p>
<p style="margin:0 0 18px;">I have done this at YouTube events, Morgan Stanley dinners, and Soho House. It works for galas, private parties, brand activations, and weddings. The transition from roaming to stage creates a natural arc through the evening.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/why-your-event-needs-mc-not-just-entertainment`, "Why Your Event Needs an MC, Not Just Entertainment", contactId, step, `nurture-${category}`)}</p>
${signoff()}`),
      },
      {
        subject: "How to know if a magician is legit",
        preheader: "Agents ask me this all the time.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Agents ask me this all the time. Here is what separates a private event magician from a stage performer:</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Private event experience, not just stage.</strong> The skills are completely different. Reading a room of 30 VIPs requires a different toolkit than working a 2,000-seat theater.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Real-time adaptability.</strong> I have performed for Don Cheadle and for Wall Street traders in the same month. The material changes. The read changes. The approach changes.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Professional logistics.</strong> Insurance, on-time arrival, no rider, no AV needs. And unedited event footage — not just highlight reels.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/how-to-vet-magician-high-end-event`, "How to Vet a Magician for a High-End Event", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Zero-maintenance talent",
        preheader: "What agents say most about working with me.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">The thing agents tell me they appreciate most: zero maintenance. The performance is exceptional, the logistics are handled, and they get a thank-you call the next day.</p>
<p style="margin:0 0 18px;">From YouTube to galas to Soho House — the experience is consistent. What I offer agents: priority availability, agent commission, custom marketing materials for your clients, and direct access to me for event coordination.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/why-event-planners-adding-magician-vendor-list`, "Why Event Planners Are Adding a Magician to Their Vendor List", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // SPIRITS BRAND NURTURE
    // ═══════════════════════════════════════════════
    spirits: [
      {
        subject: "What Rolls-Royce taught me about brands",
        preheader: "Precision, elegance, impossible made effortless.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I performed at a Rolls-Royce event recently. The brief was simple: create moments that feel as crafted as our cars. Precision. Elegance. The impossible made effortless.</p>
<p style="margin:0 0 18px;">The same principle applies to spirits. Your liquid has a story — the terroir, the distiller's hand, the years in the barrel. Entertainment can bring that story to life in a way that goes beyond a tasting card. When the experience matches the craft, guests feel it.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/magic-for-spirits-brands-activations`, "Magic for Spirits Brand Activations", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Every brand has great liquid. Now what?",
        preheader: "Cut through with experiential entertainment integrated into the brand.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Every brand has great liquid. Every brand has beautiful bottles and a compelling origin story. The question is how you cut through.</p>
<p style="margin:0 0 18px;">Experiential entertainment — integrated into the brand, not bolted on — is the answer. A pour paired with a magic moment. Predictions that match tasting notes. A secret menu reveal that feels impossible. Integration, not interruption.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/magic-for-spirits-brands-activations`, "Magic for Spirits Brand Activations", contactId, step, `nurture-${category}`)}</p>
${signoff()}`),
      },
      {
        subject: "Your activation playbook is broken",
        preheader: "Booth, samples, swag, hope. There's a better way.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">The standard activation playbook: booth, samples, swag, hope someone remembers your name. Here is what works instead:</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Create a moment that travels.</strong> A 15-second trick featuring your bottle becomes a video that reaches people who were never in the room.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Turn passive into active.</strong> Guests stop sampling and start participating. They are involved, not observing.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Make the bartender the hero.</strong> A magic moment at the bar that makes your brand ambassador the most interesting person at the event.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Collect stories, not just leads.</strong> The ROI of "you won't believe what happened" travels further than any follow-up email.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/surprise-clients-entertainment-they-didnt-know-they-wanted`, "Surprise Clients With Entertainment They Didn't Know They Wanted", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "A branded entertainment play",
        preheader: "When entertainment is as intentional as the label design, guests feel it.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Here is what I am building with select spirits partners: a signature performance designed around your brand story. Something you can deploy across multiple activations, designed for organic social with the product in frame, and exclusive — no competitors get the same experience.</p>
<p style="margin:0 0 18px;">When the entertainment is as intentional as the label design, guests feel it. They do not just remember the event — they remember the brand that created it.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/magic-for-spirits-brands-activations`, "Magic for Spirits Brand Activations", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
    ],

    // ═══════════════════════════════════════════════
    // RESTAURANT NURTURE
    // ═══════════════════════════════════════════════
    restaurant: [
      {
        subject: "What Soho House gets right",
        preheader: "Someone who came for dinner stays two extra hours.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I have performed at Soho House multiple times. Here is what I notice every time: someone who came for dinner stays two extra hours. More time means more drinks, more desserts, more memories associated with your space.</p>
<p style="margin:0 0 18px;">The entertainment fits the space — close-up magic at the tables, matching the energy of the room. Intimate and elevated. No stage, no microphone, no disruption to service. Just an experience that makes guests tell their friends to come next time.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Best Magic Experiences in Los Angeles", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Your private dining room is underbooked",
        preheader: "Holiday season is the biggest opportunity.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">Holiday season is your biggest opportunity. Three packages that fill private dining rooms and drive revenue:</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Holiday Magic Dinner</strong> — prix fixe menu paired with table-side magic. A ticketed experience night that books out fast.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Corporate Buyouts</strong> — companies looking for team dinner entertainment. One call, one vendor, done.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Gift an Experience</strong> — certificates for a magic dinner night. Perfect for regulars looking for a unique gift.</p>
<p style="margin:0 0 18px;">This is the format I have built at Soho House. Happy to walk you through how it works.</p>
${ctaGrab}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/planning-private-party-los-angeles`, "Planning a Private Party in Los Angeles", contactId, step, `nurture-${category}`)}</p>
${signoff()}`),
      },
      {
        subject: "Entertainment as a revenue line",
        preheader: "Not vibes — revenue.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">This is not about vibes — it is about revenue.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Ticketed experience nights</strong> at $100 to $200 per head on slow nights. Turn your weakest night into your most profitable.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">PDR upsells</strong> that increase the average check by adding entertainment to private dining packages.</p>
<p style="margin:0 0 18px;"><strong style="color:rgba(245,240,232,0.9);">Social moments</strong> where guests tag your location. Organic marketing you cannot buy.</p>
<p style="margin:0 0 18px;">The most talked-about rooms in hospitality right now are not selling food alone — they are selling an experience guests cannot get anywhere else. That shift is real, and it is accelerating.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/best-magic-experiences-los-angeles`, "Best Magic Experiences in Los Angeles", contactId, step, `nurture-${category}`)}</p>
${signoffFull()}`),
      },
      {
        subject: "Why I keep the partner list small",
        preheader: "The experience belongs to your restaurant.",
        innerHtml: bodyCell(`<p style="margin:0 0 18px;">${firstName},</p>
<p style="margin:0 0 18px;">I will not work with competing restaurants in the same market. The experience belongs to you.</p>
<p style="margin:0 0 18px;">What a partnership looks like: monthly or bi-weekly magic nights, co-branded marketing, flexible pricing that scales with your covers, and market exclusivity. I built this at Soho House — the audience grows over time because the experience becomes part of your identity.</p>
${cta}
<p style="margin:18px 0 0;">${trackedLink(`${SITE_URL}/blog/planning-private-party-los-angeles`, "Planning a Private Party in Los Angeles", contactId, step, `nurture-${category}`)}</p>
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
    // Handle preview requests (admin UI, template rendering only, no sends/data)
    let body: Record<string, unknown> = {};
    if (req.method === "POST") {
      body = await req.json().catch(() => ({}));
      if (body.action === "preview") {
        const { category, step } = body as { category?: string; step?: number };
        if (!category || step === undefined) {
          return new Response(JSON.stringify({ error: "category and step required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const previewName = (body.previewName as string) || "Kevin";
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

    // Auth gate for the sending path. Accepted callers:
    //   - pg_cron job "nurture-drip-tue-wed-thu": x-cron-secret header
    //   - cron-runner: x-cron-secret header
    //   - admin UI: { adminPassword } in the body
    const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
    const adminPassword = Deno.env.get("ADMIN_PASSWORD") ?? "";
    const cronOk = cronSecret.length > 0 && req.headers.get("x-cron-secret") === cronSecret;
    const adminOk = adminPassword.length > 0 && body.adminPassword === adminPassword;
    if (!cronOk && !adminOk) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // Count nurture emails already sent today (Pacific time)
    const todayPacific = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);
    const todayStart = new Date(`${todayPacific}T00:00:00-08:00`).toISOString();
    const { count: sentTodayCount } = await supabase
      .from("cold_email_campaigns")
      .select("id", { count: "exact", head: true })
      .gte("nurture_last_sent_at", todayStart);
    const sentToday = sentTodayCount ?? 0;

    // Step 1: Auto-enroll completed cold campaigns that haven't started nurture yet
    // Must be completed AND at least 30 days since last cold email
    const { data: newNurtures, error: enrollErr } = await supabase
      .from("cold_email_campaigns")
      .select("id, last_email_sent_at")
      .eq("status", "completed")
      .eq("nurture_status", "pending");

    if (enrollErr) throw enrollErr;

    if (newNurtures && newNurtures.length > 0) {
      for (const campaign of newNurtures) {
        if (campaign.last_email_sent_at) {
          const daysSinceCompletion = (now.getTime() - new Date(campaign.last_email_sent_at).getTime()) / (1000 * 60 * 60 * 24);
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

      // Step 0: send immediately if just enrolled
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

      // Skip categories without templates yet
      const template = getNurtureEmail(campaign.campaign_category as CampaignCategory, step, campaign.name || "", campaign.id);
      if (!template.subject) { skipped++; continue; }

      // Daily send cap check
      if (sentToday + sent >= DAILY_SEND_CAP) {
        dailyCapReached = true;
        backlogged++;
        continue;
      }

      const html = wrapEmail(template.preheader, template.innerHtml, campaign.email, campaign.id, step);

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
