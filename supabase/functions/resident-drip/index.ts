import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-email-logo.png";
const SITE_URL = "https://whiterabbitla.com";
const APP_URL = "https://whiterabbitla.com";
const TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-click";
const OPEN_TRACK_URL = "https://pgjyzayvkyrftcksvncj.supabase.co/functions/v1/track-open";

const DRIP_SCHEDULE = [0, 3, 7, 14, 21]; // Day 0, 3, 7, 14, 21

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
<a href="${SITE_URL}/unsubscribe?email=${encodeURIComponent("{{EMAIL}}")}" style="color:rgba(245,240,232,0.3); text-decoration:underline;">Unsubscribe</a>
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
<a href="https://calendar.app.google/58WjggPt3RFAcJjq8" target="_blank" style="display:inline-block; padding:12px 32px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C9A3A8; text-decoration:none; font-weight:bold; border:1px solid #C9A3A8; border-radius:2px;">Book a Call</a>
</p>`;
}

function trackedLink(url: string, text: string, contactId: string, step: number): string {
  const trackingUrl = `${TRACK_URL}?cid=${contactId}&step=${step}&r=${encodeURIComponent(url)}`;
  return `<a href="${trackingUrl}" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);" target="_blank">${text}</a>`;
}

// ═══════════════════════════════════════════════
// RESIDENT DRIP TEMPLATES (5 emails)
// ═══════════════════════════════════════════════

const TEMPLATES: EmailTemplate[] = [
  // Email 1: Day 0 — The Resident Event Problem
  {
    subjectA: "Your resident events deserve better",
    subjectB: "The attendance problem nobody talks about",
    preheader: "Same wine and cheese. Same 15 people.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your community";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/why-resident-events-need-more-than-wine-and-cheese`, "See why it works →", contactId, step ?? 0)
        : `<a href="${SITE_URL}/blog/why-resident-events-need-more-than-wine-and-cheese" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">See why it works →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Quick question: how's attendance at ${buildingName}'s resident events? If it's the same group of regulars every time while the majority of residents stay upstairs, you're not alone. Every property manager I talk to hits the same wall.</p>
<p style="margin:0 0 18px;">The problem isn't the budget or the catering. It's that residents have seen the same format at every building they've ever lived in. Nothing on the flyer is worth getting off the couch for.</p>
<p style="margin:0 0 18px;">We've helped properties across Southern California break that pattern with something residents genuinely want to attend: a professional magic show. Not a children's entertainer. World-class close-up magic and mentalism that turns standard socials into the most talked-about events of the year.</p>
<p style="margin:0 0 18px;">${link}</p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Open to seeing how it fits ${buildingName}?</p>
${signoff(true)}
${ps("NetVendor approved. Fully insured. Turnkey setup. Zero coordination on your end.")}
</td></tr>`;
    },
  },
  // Email 2: Day 3 — The Easy Vendor Pitch
  {
    subjectA: "The easiest vendor decision you'll make this quarter",
    subjectB: "One vendor, zero headaches",
    preheader: "NetVendor approved. Fully insured. Done.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your building";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/easiest-vendor-decision-property-manager`, "See why managers keep rebooking →", contactId, step ?? 1)
        : `<a href="${SITE_URL}/blog/easiest-vendor-decision-property-manager" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">See why managers keep rebooking →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">I know you have a hundred things on your plate. The last thing you need is a vendor that requires handholding.</p>
<p style="margin:0 0 18px;">Here's how easy this is: you send a date, I confirm within 24 hours. I arrive with everything: professional curtains, lighting, sound, and a 45-minute show that transforms your clubhouse or rooftop into a private theater. Setup takes 30 minutes. Your team doesn't lift a finger. I'm already NetVendor approved and fully insured.</p>
<p style="margin:0 0 18px;">Compare that to the DJ who needs a two-hour sound check or the food truck that cancels because of weather. This is the easiest booking decision you'll make all quarter.</p>
<p style="margin:0 0 18px;">${link}</p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Worth a quick call to discuss ${buildingName}?</p>
${signoff(true)}
${ps("Trusted by Netflix, Disney, Morgan Stanley, and Rolls Royce. Magic Castle® member.")}
</td></tr>`;
    },
  },
  // Email 3: Day 7 — The Case Study
  {
    subjectA: "How one magic show changed resident engagement",
    subjectB: "Record attendance at a resident event",
    preheader: "They rebooked before the curtains came down.",
    body: (name, _company, _city, contactId, step) => {
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/how-one-magic-show-changed-resident-engagement`, "Read the full story →", contactId, step ?? 2)
        : `<a href="${SITE_URL}/blog/how-one-magic-show-changed-resident-engagement" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">Read the full story →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Quick story from a recent resident event:</p>
<p style="margin:0 0 18px;">The community manager had tried everything: wine nights, trivia, food trucks. Same 15 people every time. Then they booked a magic show.</p>
<p style="margin:0 0 18px;">Residents who had never attended a single event showed up because the flyer promised something they'd never been offered before. Neighbors who'd been nodding at each other in the elevator for years finally had a conversation. The manager rebooked before the curtains came down.</p>
<p style="margin:0 0 18px;">That's the pattern. Magic gives residents a reason to show up. The experience gives them a reason to stay. And the community that forms is the reason they renew their lease.</p>
<p style="margin:0 0 18px;">${link}</p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Want to see those numbers at your property?</p>
${signoff(true)}
${ps(`See what we do: <a href="${SITE_URL}/deck" style="color:#C9A3A8; text-decoration:none;">whiterabbitla.com/deck</a>`)}
</td></tr>`;
    },
  },
  // Email 4: Day 14 — The Format Breakdown
  {
    subjectA: "Resident event ideas that actually get RSVPs",
    subjectB: "What your residents haven't seen yet",
    preheader: "Competing with Netflix and the couch.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your building";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/resident-event-ideas-that-actually-get-rsvps`, "See event ideas that work →", contactId, step ?? 3)
        : `<a href="${SITE_URL}/blog/resident-event-ideas-that-actually-get-rsvps" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">See event ideas that work →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Let's be honest about the competition. Your resident events aren't competing with other buildings' events. They're competing with Netflix, DoorDash, and the most comfortable couch your residents have ever owned.</p>
<p style="margin:0 0 18px;">Here's the format that consistently wins:</p>
<p style="margin:0 0 18px;"><strong style="color:#F5F0E8;">Part 1:</strong> 30-45 minutes of walk-around magic during cocktails. I move through the crowd performing intimate close-up magic for small groups. This builds energy and gets people talking.</p>
<p style="margin:0 0 18px;"><strong style="color:#F5F0E8;">Part 2:</strong> A curated 45-minute seated show with professional staging, lighting, and sound. This is the climax that has residents gasping, laughing, and grabbing each other.</p>
<p style="margin:0 0 18px;">Residents leave feeling like they attended something extraordinary. And they show up next time because they know ${buildingName} delivers.</p>
<p style="margin:0 0 18px;">${link}</p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Want to talk about timing for your next event?</p>
${signoff(true)}
${ps("Full turnkey production in Southern California. Close-up magic and sound travel nationwide.")}
</td></tr>`;
    },
  },
  // Email 5: Day 21 — Soft Close
  {
    subjectA: "Quick question about your event calendar",
    subjectB: "Before your Q3 events are locked in",
    preheader: "One show. The rest takes care of itself.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your property";
      const link = contactId
        ? trackedLink(`${SITE_URL}/deck`, "View our lookbook →", contactId, step ?? 4)
        : `<a href="${SITE_URL}/deck" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">View our lookbook →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">If you're planning resident events for the upcoming quarter, here's something worth considering:</p>
<p style="margin:0 0 18px;">Properties that book a magic show once almost always rebook. The attendance spike is real. The resident feedback is overwhelmingly positive. And in a market where retention is everything, entertainment that actually builds community isn't a luxury. It's a competitive advantage for ${buildingName}.</p>
<p style="margin:0 0 18px;">I'm based in LA and available throughout Southern California with full production. I also travel nationwide with close-up magic, mentalism, and professional sound.</p>
<p style="margin:0 0 18px;">${link}</p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Open to a quick call about fit?</p>
${signoff(true)}
${ps(`NetVendor approved. Fully insured. Magic Castle® member. Or find your format: <a href="${APP_URL}/quiz" style="color:#C9A3A8; text-decoration:none;">whiterabbitla.com/quiz</a>`)}
</td></tr>`;
    },
  },
];

// ═══════════════════════════════════════════════
// RESIDENT PULSE — Twice-monthly newsletter
// 12 issues over 6 months
// ═══════════════════════════════════════════════

const PULSE_DATES = [
  "2026-03-01", "2026-03-15", "2026-04-01", "2026-04-15", "2026-05-01",
  "2026-05-15", "2026-06-01", "2026-06-15", "2026-07-01", "2026-07-15",
  "2026-08-01", "2026-08-15",
];

const PULSE_TEMPLATES: EmailTemplate[] = [
  // Issue 1 — Mar 1 — Spring event planning
  {
    subjectA: "Spring resident events that actually fill the room",
    subjectB: "Your Q2 events don't have to be boring",
    preheader: "The events your residents will actually attend.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your community";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/resident-event-ideas-that-actually-get-rsvps`, "Event ideas that get RSVPs →", contactId, step ?? 200)
        : `<a href="${SITE_URL}/blog/resident-event-ideas-that-actually-get-rsvps" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">Event ideas that get RSVPs →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Spring means new move-ins, lease renewals on the horizon, and the opportunity to set the tone for the rest of the year at ${buildingName}. The question is: what are you putting on the calendar that residents will actually show up for?</p>
<p style="margin:0 0 18px;">The formula that works: novelty + quality. An experience that feels like something they'd pay to attend somewhere else, delivered to their own building for free. That's what fills a room.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">If you're locking in Q2 events, I'd love to show you how a magic show fits the calendar. One vendor, one invoice, record attendance.</p>
${bookCallCTA()}
${signoff(true)}
${ps(`View our lookbook: <a href="${SITE_URL}/deck" style="color:#C9A3A8; text-decoration:none;">whiterabbitla.com/deck</a>`)}
</td></tr>`;
    },
  },
  // Issue 2 — Mar 15 — Move-in welcome events
  {
    subjectA: "The welcome event that makes new residents feel at home",
    subjectB: "First impressions matter (for buildings too)",
    preheader: "Make new move-ins fall in love with your community.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your building";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/how-one-magic-show-changed-resident-engagement`, "See the impact →", contactId, step ?? 201)
        : `<a href="${SITE_URL}/blog/how-one-magic-show-changed-resident-engagement" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">See the impact →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">New move-ins decide within the first 60 days whether they love their building or they're already browsing alternatives. A welcome event with real entertainment sends a clear message: ${buildingName} invests in its community.</p>
<p style="margin:0 0 18px;">Magic is uniquely effective for these events because it creates instant connection between strangers. New residents meet long-term residents over a shared moment of astonishment. The ice isn't just broken. It's gone.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">If you've got a welcome event coming up, this is the easiest way to make it unforgettable.</p>
${bookCallCTA()}
${signoff(true)}
${ps("NetVendor approved. Fully insured. 30-minute setup. Your team does nothing.")}
</td></tr>`;
    },
  },
  // Issue 3 — Apr 1 — Pool party season
  {
    subjectA: "Pool party season is here (with a twist)",
    subjectB: "The poolside entertainment nobody expects",
    preheader: "Upgrade your summer events.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your property";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/why-resident-events-need-more-than-wine-and-cheese`, "Why standard events fall flat →", contactId, step ?? 202)
        : `<a href="${SITE_URL}/blog/why-resident-events-need-more-than-wine-and-cheese" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">Why standard events fall flat →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Summer pool parties at ${buildingName}: residents show up, grab a drink, sit in their usual spot, and leave after 30 minutes. Sound familiar?</p>
<p style="margin:0 0 18px;">Here's what changes that: add a roaming magician to the mix. I move through the pool deck performing close-up magic for small groups. Suddenly residents who've been neighbors for months are laughing together over something impossible that just happened in their hands. The energy shifts from "I showed up" to "I don't want to leave."</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">Summer dates fill fast. If you're planning pool events, let's lock something in.</p>
${bookCallCTA()}
${signoff(true)}
${ps(`See what we do: <a href="${SITE_URL}/deck" style="color:#C9A3A8; text-decoration:none;">whiterabbitla.com/deck</a>`)}
</td></tr>`;
    },
  },
  // Issue 4 — Apr 15 — Retention angle
  {
    subjectA: "The retention tool hiding in your event budget",
    subjectB: "Why great resident events = higher renewals",
    preheader: "Retention starts with community.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your community";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/easiest-vendor-decision-property-manager`, "The easiest vendor decision →", contactId, step ?? 203)
        : `<a href="${SITE_URL}/blog/easiest-vendor-decision-property-manager" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">The easiest vendor decision →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Here's something the best property managers already know: residents don't renew leases because of granite countertops. They renew because they feel connected to their community. And the fastest way to build that connection? Events worth attending.</p>
<p style="margin:0 0 18px;">Properties that offer genuinely memorable experiences see higher retention, stronger satisfaction scores, and better word-of-mouth during prospect tours. A magic show isn't just entertainment for ${buildingName}. It's a retention investment.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">If retention is on your radar this quarter, let's talk about what one event can do.</p>
${bookCallCTA()}
${signoff(true)}
${ps(`Find your format: <a href="${APP_URL}/quiz" style="color:#C9A3A8; text-decoration:none;">Take the quiz</a>`)}
</td></tr>`;
    },
  },
  // Issue 5 — May 1 — Summer planning
  {
    subjectA: "Your summer events are being planned right now (are they?)",
    subjectB: "The summer event that books itself",
    preheader: "Summer dates fill fast.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your building";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/resident-event-ideas-that-actually-get-rsvps`, "Ideas that get RSVPs →", contactId, step ?? 204)
        : `<a href="${SITE_URL}/blog/resident-event-ideas-that-actually-get-rsvps" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">Ideas that get RSVPs →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">May means summer events at ${buildingName} should be getting locked in. If you're looking for something that goes beyond the standard BBQ and DJ combo, here's an idea:</p>
<p style="margin:0 0 18px;">Start with roaming magic during the cocktail portion (30-45 minutes). Then transition to a seated private show: curtains, lighting, curated soundtrack, 45 minutes of sophisticated magic and mentalism. The first part builds energy. The second brings the house down.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">Summer dates fill quickly. If you've got a date in mind, let's lock it in now.</p>
${bookCallCTA()}
${signoff(true)}
${ps(`View our lookbook: <a href="${SITE_URL}/deck" style="color:#C9A3A8; text-decoration:none;">whiterabbitla.com/deck</a>`)}
</td></tr>`;
    },
  },
  // Issue 6 — May 15 — Prospect tour angle
  {
    subjectA: "The resident event that sells units",
    subjectB: "What prospects ask about during tours",
    preheader: "Your events are a selling tool.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your property";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/how-one-magic-show-changed-resident-engagement`, "See the engagement impact →", contactId, step ?? 205)
        : `<a href="${SITE_URL}/blog/how-one-magic-show-changed-resident-engagement" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">See the engagement impact →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Here's something I hear from property managers after their first event with us: prospects on building tours are now asking about resident events. They saw photos. They heard from a friend who lives there. They want to know: "Does this building actually do cool stuff?"</p>
<p style="margin:0 0 18px;">That's the power of offering something genuinely memorable at ${buildingName}. It doesn't just serve current residents. It becomes a selling point that differentiates your property from every other building in the market.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">If you want your events to work double duty as marketing, let's talk.</p>
${bookCallCTA()}
${signoff(true)}
${ps("NetVendor approved. Fully insured. Trusted by Fortune 500 companies.")}
</td></tr>`;
    },
  },
  // Issue 7 — Jun 1 — Holiday party early booking
  {
    subjectA: "It's not too early to book your holiday party entertainment",
    subjectB: "The holiday party that residents actually attend",
    preheader: "December dates fill in summer.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your building";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/easiest-vendor-decision-property-manager`, "The easiest vendor decision →", contactId, step ?? 206)
        : `<a href="${SITE_URL}/blog/easiest-vendor-decision-property-manager" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">The easiest vendor decision →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">I know June feels early to think about holidays, but here's the reality: December dates book months in advance. The properties that lock in their holiday entertainment now get their pick of dates. The ones that wait until October are scrambling.</p>
<p style="margin:0 0 18px;">A holiday magic show at ${buildingName} is the kind of event that becomes a building tradition. Residents look forward to it. They bring friends. They talk about it on the building's group chat. And it positions your property as a place that genuinely invests in community.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">Want to lock in a December date while the calendar is still open?</p>
${bookCallCTA()}
${signoff(true)}
${ps(`See what we do: <a href="${SITE_URL}/deck" style="color:#C9A3A8; text-decoration:none;">whiterabbitla.com/deck</a>`)}
</td></tr>`;
    },
  },
  // Issue 8 — Jun 15 — Poster/flyer angle
  {
    subjectA: "We can help make the flyer too",
    subjectB: "The resident event flyer that actually works",
    preheader: "Great events need great promotion.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your property";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/why-resident-events-need-more-than-wine-and-cheese`, "Why standard events fall flat →", contactId, step ?? 207)
        : `<a href="${SITE_URL}/blog/why-resident-events-need-more-than-wine-and-cheese" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">Why standard events fall flat →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Here's something I offer that most vendors don't: I can help you create the event poster. A professional, eye-catching flyer that makes residents stop scrolling and actually RSVP.</p>
<p style="margin:0 0 18px;">When a magic show is advertised properly at ${buildingName}, attendance spikes. Residents see "Private Magic Show" on the flyer and think: "That's different. I want to be there." It's the novelty factor that wine and cheese nights can't compete with.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">If you've got an event coming up, I'll handle the entertainment and help with the promotion. Easy.</p>
${bookCallCTA()}
${signoff(true)}
${ps("One vendor. Entertainment + event poster. Zero coordination headaches.")}
</td></tr>`;
    },
  },
  // Issue 9 — Jul 1 — Summer recap / social proof
  {
    subjectA: "What managers are saying after their first show",
    subjectB: "The feedback we keep hearing",
    preheader: "Record attendance. Immediate rebook.",
    body: (name, _company, _city, contactId, step) => {
      const link = contactId
        ? trackedLink(`${SITE_URL}/reviews`, "See more reviews →", contactId, step ?? 208)
        : `<a href="${SITE_URL}/reviews" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">See more reviews →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">Here's what property managers consistently tell us after booking their first magic show:</p>
<p style="margin:0 0 18px;"><em style="color:#C9A3A8;">"Highest attendance we've ever had at a resident event."</em></p>
<p style="margin:0 0 18px;"><em style="color:#C9A3A8;">"Residents who never come to anything were there."</em></p>
<p style="margin:0 0 18px;"><em style="color:#C9A3A8;">"We rebooked on the spot."</em></p>
<p style="margin:0 0 18px;">The pattern is the same every time: magic gives residents a reason to show up. The experience gives them a reason to stay. The community that forms is the reason they renew.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">If you've been on the fence, one show is all it takes to see why managers keep coming back.</p>
${bookCallCTA()}
${signoff(true)}
${ps(`View our lookbook: <a href="${SITE_URL}/deck" style="color:#C9A3A8; text-decoration:none;">whiterabbitla.com/deck</a>`)}
</td></tr>`;
    },
  },
  // Issue 10 — Jul 15 — Fall planning
  {
    subjectA: "Fall resident events that build community",
    subjectB: "Q4 is coming. What's on your calendar?",
    preheader: "The busiest season starts with planning.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your building";
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/resident-event-ideas-that-actually-get-rsvps`, "Ideas that drive attendance →", contactId, step ?? 209)
        : `<a href="${SITE_URL}/blog/resident-event-ideas-that-actually-get-rsvps" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">Ideas that drive attendance →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">${name},</p>
<p style="margin:0 0 18px;">Fall is when resident events matter most. Lease renewals are on the horizon, new move-ins are settling in, and the holiday season creates natural opportunities to bring ${buildingName}'s community together.</p>
<p style="margin:0 0 18px;">Here are three formats that work beautifully in Q4:</p>
<p style="margin:0 0 18px;"><strong style="color:#F5F0E8;">Halloween magic night:</strong> Mentalism and mind reading take on a genuinely eerie quality in October. Sophisticated dark wonder, not jump scares.</p>
<p style="margin:0 0 18px;"><strong style="color:#F5F0E8;">Holiday magic show:</strong> The annual event residents look forward to and invite friends to attend. This is the one that becomes a building tradition.</p>
<p style="margin:0 0 18px;"><strong style="color:#F5F0E8;">New Year's Eve private show:</strong> Ring in the new year with something extraordinary. Magic at midnight is unforgettable.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">Fall and holiday dates are my busiest season. If any of these sound right for ${buildingName}, let's get you on the calendar now.</p>
${bookCallCTA()}
${signoff(true)}
${ps(`NetVendor approved. Fully insured. <a href="${SITE_URL}/deck" style="color:#C9A3A8; text-decoration:none;">View our lookbook</a>`)}
</td></tr>`;
    },
  },
  // Issue 11 — Aug 1 — Multi-property angle
  {
    subjectA: "Managing multiple properties? One vendor for all of them",
    subjectB: "Scale your resident events without scaling the work",
    preheader: "One vendor, every property.",
    body: (name, _company, _city, contactId, step) => {
      const link = contactId
        ? trackedLink(`${SITE_URL}/blog/easiest-vendor-decision-property-manager`, "See why managers trust us →", contactId, step ?? 210)
        : `<a href="${SITE_URL}/blog/easiest-vendor-decision-property-manager" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">See why managers trust us →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">If you manage multiple properties, you know the challenge: finding reliable vendors you can replicate across communities. Entertainment that works at one building should work at all of them.</p>
<p style="margin:0 0 18px;">White Rabbit is designed for exactly this. Same professional experience, same turnkey setup, same consistent quality at every property. Several management companies have started rotating us across their portfolio, giving each building a magic show once or twice a year.</p>
<p style="margin:0 0 18px;">The logistics are simple: one point of contact, one invoice per event, and I bring everything. Your regional team doesn't need to source local vendors. They just need to pick a date.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;">If you're looking for an entertainment partner that scales across your portfolio, let's talk.</p>
${bookCallCTA()}
${signoff(true)}
${ps("Available throughout Southern California with full production. Nationwide with close-up magic and sound.")}
</td></tr>`;
    },
  },
  // Issue 12 — Aug 15 — Last touch / evergreen
  {
    subjectA: "One last idea for your events calendar",
    subjectB: "The vendor you'll wish you booked sooner",
    preheader: "You know where to find me.",
    body: (name, company, _city, contactId, step) => {
      const buildingName = company || "your property";
      const link = contactId
        ? trackedLink(`${SITE_URL}/deck`, "View our lookbook →", contactId, step ?? 211)
        : `<a href="${SITE_URL}/deck" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">View our lookbook →</a>`;
      return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">I've shared a lot over the past few months, and I appreciate you reading. Here's the short version of everything I've said:</p>
<p style="margin:0 0 18px;">Your residents deserve events worth attending. Magic shows consistently deliver the highest attendance, the best feedback, and the most rebookings of any entertainment category. It's turnkey, it's professional, and it makes ${buildingName} the kind of place people are proud to live.</p>
<p style="margin:0 0 18px;">Whenever you're ready to try it, I'm a phone call away.</p>
<p style="margin:0 0 18px;">${link}</p>
<p style="margin:0 0 18px;"><a href="mailto:events@whiterabbitla.com?subject=Resident%20event%20inquiry" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">Reply here</a> · <a href="tel:+14243941850" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">(424) 394-1850</a></p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Wishing you great events ahead.</p>
${signoff(true)}
</td></tr>`;
    },
  },
];

// ═══════════════════════════════════════════════
// BREAKUP EMAIL (for non-engagers)
// ═══════════════════════════════════════════════

const BREAKUP_TEMPLATE: EmailTemplate = {
  subjectA: "Closing the loop",
  subjectB: "Timing is everything",
  preheader: "Last one from me.",
  body: (name, _company, _city) => {
    return `<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0 0 18px;">Hey ${name},</p>
<p style="margin:0 0 18px;">I've sent a few notes and I get it. Timing matters more than anything.</p>
<p style="margin:0 0 18px;">I'll stop filling your inbox. But if you ever need entertainment for a resident event that will actually get people talking, I'm a phone call away.</p>
<p style="margin:0 0 18px;"><a href="mailto:events@whiterabbitla.com" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">events@whiterabbitla.com</a> · <a href="tel:+14243941850" style="color:#C9A3A8; text-decoration:none; border-bottom:1px solid rgba(201,163,168,0.3);">(424) 394-1850</a></p>
${bookCallCTA()}
<p style="margin:18px 0 18px;">Wishing you great events ahead.</p>
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

    // ── Action: enroll ── Import contacts into resident drip
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
          if (existing.drip_campaign !== "resident") {
            await supabase
              .from("newsletter_contacts")
              .update({
                drip_campaign: "resident",
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
            source: "resident-drip",
            subscribed: true,
            drip_step: 0,
            drip_campaign: "resident",
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

      // ── Process RESIDENT drip contacts ──
      const { data: residentContacts } = await supabase
        .from("newsletter_contacts")
        .select("*")
        .eq("drip_campaign", "resident")
        .eq("subscribed", true)
        .lt("drip_step", 5);

      if (residentContacts?.length) {
        for (const contact of residentContacts) {
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
                reply_to: "events@whiterabbitla.com",
                subject,
                html,
                headers: {
                  "List-Unsubscribe": `<${SITE_URL}/unsubscribe?email=${encodeURIComponent(contact.email)}>, <mailto:events@whiterabbitla.com?subject=Unsubscribe>`,
                  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                },
              }),
            });
            if (res.ok) {
              sent++;
              await supabase.from("newsletter_contacts").update({ drip_step: step + 1, last_emailed_at: now.toISOString() }).eq("id", contact.id);
              await supabase.from("newsletter_send_log").insert({
                campaign_id: `resident-step-${step}`,
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

      // ── Branch completed resident contacts ──
      const { data: completedContacts } = await supabase
        .from("newsletter_contacts")
        .select("*")
        .eq("drip_campaign", "resident")
        .eq("subscribed", true)
        .eq("drip_step", 5);

      if (completedContacts?.length) {
        for (const contact of completedContacts) {
          if (contact.engagement_status === "hot") {
            await supabase.from("newsletter_contacts").update({
              drip_campaign: "resident-done",
            }).eq("id", contact.id);
          } else if (contact.engagement_status === "warm") {
            // Move warm leads to pulse
            await supabase.from("newsletter_contacts").update({
              drip_campaign: "resident-pulse",
              drip_step: 0,
              drip_started_at: now.toISOString(),
            }).eq("id", contact.id);
          } else {
            // Non-engagers: send breakup at day 28
            const startedAt = new Date(contact.drip_started_at);
            const daysSinceStart = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceStart >= 28) {
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
                    reply_to: "events@whiterabbitla.com",
                    subject: breakupSubject,
                    html,
                    headers: {
                      "List-Unsubscribe": `<${SITE_URL}/unsubscribe?email=${encodeURIComponent(contact.email)}>, <mailto:events@whiterabbitla.com?subject=Unsubscribe>`,
                      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                    },
                  }),
                });
                if (res.ok) {
                  sent++;
                  await supabase.from("newsletter_contacts").update({
                    drip_campaign: "resident-done",
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

      // ── Process PULSE contacts ── Send on 1st and 15th of month
      const day = now.getDate();
      const isPulseDay = (day === 1 || day === 15);

      if (isPulseDay) {
        const todayStr = now.toISOString().split("T")[0];
        const pulseIndex = PULSE_DATES.indexOf(todayStr);

        if (pulseIndex >= 0) {
          const { data: pulseContacts } = await supabase
            .from("newsletter_contacts")
            .select("*")
            .eq("drip_campaign", "resident-pulse")
            .eq("subscribed", true)
            .lte("drip_step", pulseIndex);

          if (pulseContacts?.length) {
            for (const contact of pulseContacts) {
              if (contact.drip_step > pulseIndex) continue;

              const template = PULSE_TEMPLATES[pulseIndex];
              const pulseVariant = pickVariant();
              const pulseSubject = getSubject(template, pulseVariant);
              const firstName = contact.name?.split(" ")[0] || "there";
              const bodyInner = template.body(firstName, contact.company || "", contact.city || "");
              const html = wrapEmail(template.preheader, bodyInner, contact.email, contact.id, 200 + pulseIndex);

              try {
                const res = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
                  body: JSON.stringify({
                    from: "Scott Syme | White Rabbit LA <scott.syme@whiterabbitla.com>",
                    to: [contact.email],
                    reply_to: "events@whiterabbitla.com",
                    subject: pulseSubject,
                    html,
                    headers: {
                      "List-Unsubscribe": `<${SITE_URL}/unsubscribe?email=${encodeURIComponent(contact.email)}>, <mailto:events@whiterabbitla.com?subject=Unsubscribe>`,
                      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                    },
                  }),
                });
                if (res.ok) {
                  sent++;
                  await supabase.from("newsletter_contacts").update({
                    drip_step: pulseIndex + 1,
                    last_emailed_at: now.toISOString(),
                  }).eq("id", contact.id);
                  await supabase.from("newsletter_send_log").insert({
                    campaign_id: `resident-pulse-${pulseIndex}`,
                    contact_id: contact.id,
                    ab_variant: pulseVariant,
                  });
                }
              } catch (_e) { /* skip */ }
              await new Promise(r => setTimeout(r, 200));
            }
          }
        }
      }

      // ── Move resident-done contacts into pulse ──
      const { data: doneContacts } = await supabase
        .from("newsletter_contacts")
        .select("id")
        .eq("drip_campaign", "resident-done")
        .eq("subscribed", true);

      if (doneContacts?.length) {
        for (const contact of doneContacts) {
          await supabase.from("newsletter_contacts").update({
            drip_campaign: "resident-pulse",
            drip_step: 0,
            drip_started_at: now.toISOString(),
          }).eq("id", contact.id);
        }
      }

      return new Response(JSON.stringify({ processed: (residentContacts?.length || 0) + (completedContacts?.length || 0), sent, errors: errors.length ? errors : undefined }), {
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
      const campaign = reqBody.campaign || "resident";

      if (campaign === "resident-pulse") {
        if (stepNum < 0 || stepNum >= PULSE_TEMPLATES.length) {
          return new Response(JSON.stringify({ error: `Invalid step (0-${PULSE_TEMPLATES.length - 1})` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const template = PULSE_TEMPLATES[stepNum];
        const innerHtml = template.body("Jordan", "Greystar Luxury Living", "Los Angeles");
        const html = wrapEmail(template.preheader, innerHtml, "preview@example.com");
        return new Response(JSON.stringify({ subjectA: template.subjectA, subjectB: template.subjectB, preheader: template.preheader, body_html: html, date: PULSE_DATES[stepNum], campaign: "resident-pulse" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (campaign === "breakup") {
        const innerHtml = BREAKUP_TEMPLATE.body("Jordan", "Greystar Luxury Living", "Los Angeles");
        const html = wrapEmail(BREAKUP_TEMPLATE.preheader, innerHtml, "preview@example.com");
        return new Response(JSON.stringify({ subjectA: BREAKUP_TEMPLATE.subjectA, subjectB: BREAKUP_TEMPLATE.subjectB, preheader: BREAKUP_TEMPLATE.preheader, body_html: html, day: 28, campaign: "breakup" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (stepNum < 0 || stepNum >= TEMPLATES.length) {
        return new Response(JSON.stringify({ error: "Invalid step (0-4)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const template = TEMPLATES[stepNum];
      const innerHtml = template.body("Jordan", "Greystar Luxury Living", "Los Angeles");
      const html = wrapEmail(template.preheader, innerHtml, "preview@example.com");
      return new Response(JSON.stringify({ subjectA: template.subjectA, subjectB: template.subjectB, preheader: template.preheader, body_html: html, day: DRIP_SCHEDULE[stepNum] }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Action: stats ── Get resident drip stats
    if (action === "stats") {
      if (adminPassword !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: contacts } = await supabase
        .from("newsletter_contacts")
        .select("drip_step, subscribed, drip_campaign, engagement_status, reply_detected")
        .in("drip_campaign", ["resident", "resident-done", "resident-pulse"]);

      const total = contacts?.length || 0;
      const active = contacts?.filter(c => c.subscribed).length || 0;
      const unsubscribed = contacts?.filter(c => !c.subscribed).length || 0;
      const residentActive = contacts?.filter(c => c.drip_campaign === "resident" && c.subscribed).length || 0;
      const completed = contacts?.filter(c => c.drip_campaign === "resident-done").length || 0;
      const pulseActive = contacts?.filter(c => c.drip_campaign === "resident-pulse" && c.subscribed).length || 0;
      const warm = contacts?.filter(c => c.engagement_status === "warm" || c.engagement_status === "hot").length || 0;
      const hot = contacts?.filter(c => c.engagement_status === "hot" || c.reply_detected).length || 0;

      const stepCounts = [0, 0, 0, 0, 0];
      contacts?.forEach(c => {
        if (c.drip_campaign === "resident" && c.drip_step >= 0 && c.drip_step < 5 && c.subscribed) {
          stepCounts[c.drip_step]++;
        }
      });

      // Get contact IDs for this campaign
      const contactIds = (contacts || []).map((c: any) => c.id).filter(Boolean);

      // Opens stats
      let opensTotal = 0, opensUnique = 0, opensPerStep = [0, 0, 0, 0, 0];
      if (contactIds.length) {
        // We need full contact list with IDs
        const { data: fullContacts } = await supabase
          .from("newsletter_contacts")
          .select("id")
          .in("drip_campaign", ["resident", "resident-done", "resident-pulse"]);
        const ids = (fullContacts || []).map((c: any) => c.id);
        
        if (ids.length) {
          const { data: opens } = await supabase
            .from("newsletter_opens")
            .select("contact_id, drip_step")
            .in("contact_id", ids);
          opensTotal = opens?.length || 0;
          opensUnique = new Set(opens?.map((o: any) => o.contact_id)).size;
          opens?.forEach((o: any) => {
            if (o.drip_step >= 0 && o.drip_step < 5) opensPerStep[o.drip_step]++;
          });
        }
      }

      // Clicks stats
      let clicksTotal = 0, clicksUnique = 0;
      if (contactIds.length) {
        const { data: fullContacts } = await supabase
          .from("newsletter_contacts")
          .select("id")
          .in("drip_campaign", ["resident", "resident-done", "resident-pulse"]);
        const ids = (fullContacts || []).map((c: any) => c.id);
        if (ids.length) {
          const { data: clicks } = await supabase
            .from("newsletter_clicks")
            .select("contact_id")
            .in("contact_id", ids);
          clicksTotal = clicks?.length || 0;
          clicksUnique = new Set(clicks?.map((c: any) => c.contact_id)).size;
        }
      }

      // Total emails sent
      const { count: totalSent } = await supabase
        .from("newsletter_send_log")
        .select("*", { count: "exact", head: true })
        .like("campaign_id", "resident%");

      const openRate = (totalSent && totalSent > 0) ? Math.round((opensUnique / totalSent) * 100) : 0;

      return new Response(JSON.stringify({
        total, active, unsubscribed, completed, stepCounts,
        residentActive, pulseActive,
        engagement: { warm, hot, cold: total - warm - hot },
        opens: { total: opensTotal, uniqueContacts: opensUnique, rate: openRate, perStep: opensPerStep },
        clicks: { total: clicksTotal, uniqueContacts: clicksUnique },
        totalSent: totalSent || 0,
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
      const campaign = reqBody.campaign || "resident";

      let template: EmailTemplate;
      let subjectPrefix = "[TEST] ";

      if (campaign === "resident-pulse") {
        if (stepNum < 0 || stepNum >= PULSE_TEMPLATES.length) {
          return new Response(JSON.stringify({ error: `Invalid step (0-${PULSE_TEMPLATES.length - 1})` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        template = PULSE_TEMPLATES[stepNum];
        subjectPrefix = "[TEST PULSE] ";
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
      const innerHtml = template.body("Jordan", "Greystar Luxury Living", "Los Angeles");
      const html = wrapEmail(template.preheader, innerHtml, toEmail);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "Scott Syme | White Rabbit LA <scott.syme@whiterabbitla.com>",
          to: [toEmail],
          reply_to: "events@whiterabbitla.com",
          subject: `${subjectPrefix}${getSubject(template, testVariant)}`,
          html,
          headers: {
            "List-Unsubscribe": `<${SITE_URL}/unsubscribe?email=${encodeURIComponent(toEmail)}>, <mailto:events@whiterabbitla.com?subject=Unsubscribe>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
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

    // ── Action: get_contact_activity ── Get clicks/opens for a contact
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

    // ── Action: get_contacts ── List resident contacts
    if (action === "get_contacts") {
      if (adminPassword !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: contacts } = await supabase
        .from("newsletter_contacts")
        .select("id, email, name, company, city, drip_step, drip_campaign, engagement_status, subscribed, reply_detected, last_emailed_at, created_at")
        .in("drip_campaign", ["resident", "resident-done", "resident-pulse"])
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ contacts: contacts || [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("resident-drip error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
