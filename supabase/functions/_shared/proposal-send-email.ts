/**
 * The proposal email (proposals-api `action === "send"`), as pure functions.
 *
 * This one module is used by BOTH the proposals-api send action (what actually
 * goes out) and the admin send preview (src/lib/proposalSendEmail.ts re-exports
 * it), so the preview can never drift from the real email. Do not reword
 * anything here without Scott's approval. src/test/proposalSendEmail.test.ts
 * covers the wording and checks that the send action still uses this module.
 */
import { formatEventDate, parseEventDate, todayPacific, type EventDate } from "./event-date.ts";

const TZ = "America/Los_Angeles";

export const PROPOSAL_SEND_LOGO_URL =
  "https://pgjyzayvkyrftcksvncj.supabase.co/storage/v1/object/public/email-assets/wr-email-logo.png";

/** Every proposal link in the email points here, whatever host the browser used. */
export const PROPOSAL_PUBLIC_ORIGIN = "https://whiterabbitla.com";

/** Subject the server uses when the posted subject is blank. */
export const PROPOSAL_SEND_FALLBACK_SUBJECT = "Your White Rabbit LA Proposal";

export const effectiveProposalSubject = (subject: string | null | undefined) =>
  subject || PROPOSAL_SEND_FALLBACK_SUBJECT;

/** https://whiterabbitla.com/proposal/{slug} */
export function proposalPublicLink(slug: string): string {
  return `${PROPOSAL_PUBLIC_ORIGIN}/proposal/${encodeURIComponent(slug.trim())}`;
}

/**
 * Older editors post a full link built from window.location.origin. Keep only
 * a `/proposal/{slug}` path and force the whiterabbitla.com host; anything else
 * returns null.
 */
export function proposalLinkFromPosted(link: unknown): string | null {
  if (typeof link !== "string" || !link.trim()) return null;
  let path: string;
  try {
    path = new URL(link.trim(), PROPOSAL_PUBLIC_ORIGIN).pathname;
  } catch {
    return null;
  }
  const m = path.match(/^\/proposal\/([A-Za-z0-9][A-Za-z0-9_-]*)\/?$/);
  return m ? proposalPublicLink(m[1]) : null;
}

const addDays = (d: EventDate, days: number): EventDate => {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + days, 12));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
};

const iso = (d: EventDate) =>
  `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;

/** The hold the send action stores when none is set: today in Los Angeles plus seven days. */
export function defaultHoldUntilIso(now: Date = new Date()): string {
  return iso(addDays(todayPacific(now), 7));
}

/** "December 1": long month, numeric day, no weekday or year. */
export function formatHoldDate(holdIso: string): string {
  const d = parseEventDate(holdIso) as EventDate;
  const at = new Date(Date.UTC(d.year, d.month - 1, d.day, 12));
  return at.toLocaleDateString("en-US", { timeZone: TZ, month: "long", day: "numeric" });
}

/** The hold date the email names: the stored hold when it reads as a date, otherwise the one send will store. */
export function effectiveHoldUntilIso(holdUntil: string | null | undefined, now: Date = new Date()): string {
  const d = holdUntil ? parseEventDate(String(holdUntil), now) : null;
  return d ? iso(d) : defaultHoldUntilIso(now);
}

export interface ProposalSendContext {
  eventType?: string | null;
  eventDate?: string | null;
  holdUntil?: string | null;
  now?: Date;
}

/** The default personal message (the paragraphs between the greeting and the button). */
export function buildProposalSendMessage(ctx: ProposalSendContext = {}): string {
  const now = ctx.now ?? new Date();
  const event = (ctx.eventType || "").trim().toLowerCase() || "event";
  const parsed = parseEventDate(ctx.eventDate ?? "", now);
  const forWhat = parsed ? formatEventDate(parsed) : "you";
  const hold = formatHoldDate(effectiveHoldUntilIso(ctx.holdUntil, now));
  return [
    `Thank you so much for thinking of White Rabbit for your ${event}! I've put together a proposal for ${forWhat}. Feel free to share it with anyone helping you plan.`,
    `Your date is held for seven days, through ${hold}. If you'd like to talk anything through, I'm happy to hop on a call.`,
    "Please let me know if there is anything I can do for you.",
    "Best,\n-Scott",
  ].join("\n\n");
}

/** The default message older editors still post. */
export const LEGACY_PROPOSAL_SEND_MESSAGE =
  "Here's the proposal we discussed. Take your time with it, call me anytime.\n\nBest,\n-Scott";

/** True for the old default, with or without "Best, -Scott", in any spacing. */
export function isLegacyDefaultProposalMessage(message: string | null | undefined): boolean {
  const s = (message || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return /^here's the proposal we discussed\. take your time with it, call me anytime\.(?: best,? -scott)?$/.test(s);
}

/** The message that actually goes out: blank or the old default becomes the new default; custom text is kept. */
export function resolveProposalSendMessage(
  message: string | null | undefined,
  ctx: ProposalSendContext = {},
): string {
  const trimmed = (message || "").trim();
  if (!trimmed || isLegacyDefaultProposalMessage(trimmed)) return buildProposalSendMessage(ctx);
  return trimmed;
}

export const proposalSendGreeting = (firstName: string | null | undefined) => {
  const name = (firstName || "").toString().trim();
  return `Hi${name ? ` ${name}` : ""},`;
};

export interface ProposalSendRenderInput {
  firstName?: string | null;
  /** Final message, already resolved with resolveProposalSendMessage. */
  message: string;
  link: string;
}

export function renderProposalSendEmailHtml(input: ProposalSendRenderInput): string {
  const LOGO_URL = PROPOSAL_SEND_LOGO_URL;
  const link = input.link;
  const safeGreeting = proposalSendGreeting(input.firstName).replace(/</g, "&lt;");
  const safeMessageHtml = input.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

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
<div style="display:none; max-height:0; overflow:hidden; font-size:1px; line-height:1px; color:#335747;">Your White Rabbit LA proposal is ready to view.</div>
<center style="width:100%; background-color:#335747;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#335747;">
<tr><td style="padding: 30px 0;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" align="center" class="email-container" style="max-width:560px; margin:auto; background-color:#223D34; border-radius:4px;">

<tr><td style="padding: 40px 40px 24px; text-align:center;" class="padding-mobile">
<img src="${LOGO_URL}" alt="White Rabbit" width="90" style="width:90px; height:auto; display:block; margin:0 auto;" />
</td></tr>

<tr><td style="padding: 0 40px 20px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0;">${safeGreeting}</p>
</td></tr>

<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:15px; line-height:1.8; color:rgba(245,240,232,0.75);" class="padding-mobile">
<p style="margin:0;">${safeMessageHtml}</p>
</td></tr>

<tr><td style="padding: 0 40px 32px; text-align:center;" class="padding-mobile">
<a href="${link}" target="_blank" style="display:inline-block; padding:14px 36px; font-family:Georgia,serif; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#C9A3A8; text-decoration:none; font-weight:bold; border:1px solid #C9A3A8; border-radius:2px;">View Your Proposal</a>
</td></tr>

<tr><td style="padding: 0 40px 28px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:12px; color:rgba(245,240,232,0.4);">Or open in your browser:<br/><a href="${link}" style="color:rgba(201,163,168,0.7); word-break:break-all; text-decoration:none;">${link}</a></p>
</td></tr>

<tr><td style="padding: 0 40px;" class="padding-mobile">
<hr style="border:none; border-top:1px solid rgba(201,163,168,0.15); margin:0 0 24px;" />
</td></tr>

<tr><td style="padding: 0 40px 28px; font-family:Georgia,serif; font-size:13px; line-height:1.7; color:rgba(245,240,232,0.55);" class="padding-mobile">
<p style="margin:0;">
<span style="color:rgba(245,240,232,0.85);">Scott Syme</span><br/>
White Rabbit LA, Luxury Magic &amp; Entertainment<br/>
<a href="tel:+14243941850" style="color:rgba(201,163,168,0.85); text-decoration:none;">(424) 394-1850</a><br/>
<a href="mailto:scott.syme@whiterabbitla.com" style="color:rgba(201,163,168,0.85); text-decoration:none;">scott.syme@whiterabbitla.com</a> · <a href="https://whiterabbitla.com" style="color:rgba(201,163,168,0.85); text-decoration:none;">whiterabbitla.com</a>
</p>
</td></tr>

<tr><td style="padding: 0 40px 12px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:12px; color:rgba(245,240,232,0.4);">
White Rabbit · Los Angeles<br/>
7393 W. Manchester Ave #209, Los Angeles, CA 90045
</p>
</td></tr>
<tr><td style="padding: 0 40px 32px; text-align:center;" class="padding-mobile">
<p style="margin:0; font-family:Georgia,serif; font-size:11px; color:rgba(245,240,232,0.25);">
You're receiving this because you requested a proposal from White Rabbit LA.
</p>
</td></tr>

</table>
</td></tr></table>
</center>
</body></html>`;
}

export function renderProposalSendEmailText(input: ProposalSendRenderInput): string {
  return `${proposalSendGreeting(input.firstName)}

${input.message}

Scott Syme
White Rabbit LA, Luxury Magic & Entertainment
(424) 394-1850
scott.syme@whiterabbitla.com · https://whiterabbitla.com

View your proposal: ${input.link}

White Rabbit LA · 7393 W. Manchester Ave #209, Los Angeles, CA 90045`;
}
