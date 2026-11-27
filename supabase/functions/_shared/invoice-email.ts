import { gatedSend } from "./send-gate.ts";
import { eventDateForClient } from "./event-date.ts";
// Shared helpers for White Rabbit LA event invoices: money math, brand-styled
// email templates, and Resend delivery.

export const SITE_URL = "https://whiterabbitla.com";
export const FROM = "Scott Syme <scott.syme@whiterabbitla.com>";
export const REPLY_TO = "scott.syme@whiterabbitla.com";

export type Invoice = {
  id: string;
  pay_token: string;
  client_name: string | null;
  client_email: string | null;
  event_type: string | null;
  event_date: string | null;
  venue: string | null;
  tier_name: string | null;
  total_cents: number;
  deposit_percent: number;
  amount_paid_cents: number;
  status: string;
};

export const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const depositCents = (inv: Invoice) =>
  Math.round((inv.total_cents * inv.deposit_percent) / 100);

export const balanceCents = (inv: Invoice) =>
  Math.max(inv.total_cents - (inv.amount_paid_cents || 0), 0);

export const payUrl = (inv: Invoice) => `${SITE_URL}/pay/${inv.pay_token}`;

/** Parse a price string like "$2,500" or "2500" into cents. Returns null when unusable. */
export function parsePriceToCents(raw: unknown): number | null {
  if (typeof raw === "number" && isFinite(raw)) return Math.round(raw * 100);
  if (typeof raw !== "string") return null;
  const match = raw.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function emailShell(bodyHtml: string, ctaUrl?: string | null, ctaLabel?: string | null) {
  const cta = ctaUrl
    ? `<div style="text-align:center;margin:34px 0 30px;">
      <a href="${ctaUrl}" style="display:inline-block;background:#C9A3A8;color:#223D34;text-decoration:none;padding:15px 34px;border-radius:2px;font-family:Montserrat,Arial,sans-serif;font-size:13px;letter-spacing:.16em;text-transform:uppercase;">${esc(ctaLabel)}</a>
    </div>`
    : "";
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8F5F0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;font-family:Georgia,'Times New Roman',serif;color:#223D34;font-size:16px;line-height:1.7;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="https://whiterabbitla.com/email-logo.png" alt="White Rabbit LA" width="46" height="64" style="display:inline-block;width:46px;height:64px;border:0;outline:none;text-decoration:none;" />
      <div style="letter-spacing:.28em;font-size:12px;color:#D4A843;text-transform:uppercase;margin-top:12px;">White Rabbit LA</div>
    </div>
    ${bodyHtml}
    ${cta}
    <div style="border-top:1px solid #e3ddd3;padding-top:18px;font-family:Montserrat,Arial,sans-serif;font-size:12px;color:#6c7a72;line-height:1.6;">
      Scott Syme · White Rabbit LA<br/>
      (424) 394-1850 · <a href="mailto:${REPLY_TO}" style="color:#6c7a72;">${REPLY_TO}</a>
    </div>
  </div></body></html>`;
}

function detailsBlock(inv: Invoice) {
  const rows: string[] = [];
  if (inv.tier_name) rows.push(`<strong>Experience:</strong> ${esc(inv.tier_name)}`);
  if (inv.event_type) rows.push(`<strong>Occasion:</strong> ${esc(inv.event_type)}`);
  const shownDate = eventDateForClient(inv.event_date);
  if (shownDate) rows.push(`<strong>Date:</strong> ${esc(shownDate)}`);
  if (inv.venue) rows.push(`<strong>Venue:</strong> ${esc(inv.venue)}`);
  rows.push(`<strong>Total:</strong> ${money(inv.total_cents)}`);
  return `<div style="background:#ffffff;border:1px solid #e3ddd3;padding:20px 22px;margin:24px 0;font-family:Montserrat,Arial,sans-serif;font-size:14px;line-height:1.9;">
    ${rows.join("<br/>")}
  </div>`;
}

/** The first invoice email, sent alongside the signed agreement. */
export function invoiceEmail(inv: Invoice) {
  const name = inv.client_name?.split(" ")[0] || "there";
  const body = `<p>${esc(name)},</p>
  <p>Your agreement is signed and your date is being held. Below is the invoice. You can secure it with the ${inv.deposit_percent}% deposit of <strong>${money(depositCents(inv))}</strong>, or settle the full <strong>${money(inv.total_cents)}</strong> now and be done with it.</p>
  ${detailsBlock(inv)}
  <p>Payment takes about a minute. Once it lands, the date is locked and I take it from there.</p>`;
  return {
    subject: `Invoice for ${inv.tier_name || "your White Rabbit LA evening"}`,
    html: emailShell(body, payUrl(inv), "View & pay invoice"),
  };
}

/** Daily reminder while nothing has been paid. Four of these go out. */
export function reminderEmail(inv: Invoice, n: number) {
  const name = inv.client_name?.split(" ")[0] || "there";
  const lines = [
    `Just making sure the invoice reached you. The date is held until the deposit lands.`,
    `Following up on the invoice for your evening. Either the ${inv.deposit_percent}% deposit or payment in full will lock the date.`,
    `Your date is still being held, though I can only hold it so long. The invoice is one click away.`,
    `Last note from me on this one. If the timing has changed, tell me and I'll release the date with no hard feelings.`,
  ];
  const body = `<p>${esc(name)},</p>
  <p>${esc(lines[Math.min(n - 1, lines.length - 1)])}</p>
  ${detailsBlock(inv)}
  <p>Deposit: <strong>${money(depositCents(inv))}</strong> &nbsp;·&nbsp; Pay in full: <strong>${money(inv.total_cents)}</strong></p>`;
  return {
    subject: n >= 4
      ? `Closing the loop on ${inv.tier_name || "your evening"}`
      : `Reminder: invoice for ${inv.tier_name || "your evening"}`,
    html: emailShell(body, payUrl(inv), "Pay invoice"),
  };
}

/** Balance reminder before the event, for clients who paid the deposit only. */
export function balanceReminderEmail(inv: Invoice, daysOut: number) {
  const name = inv.client_name?.split(" ")[0] || "there";
  const lead =
    daysOut <= 0
      ? `A gentle reminder that the remaining balance of <strong>${money(balanceCents(inv))}</strong> is due before this evening's performance.`
      : `We're ${daysOut} ${daysOut === 1 ? "day" : "days"} out. The remaining balance of <strong>${money(balanceCents(inv))}</strong> is due before the performance.`;
  const body = `<p>${esc(name)},</p>
  <p>${lead}</p>
  ${detailsBlock(inv)}
  <p>Paid to date: ${money(inv.amount_paid_cents || 0)}. Everything else is handled on my end.</p>`;
  return {
    subject: daysOut <= 0
      ? `A gentle reminder for this evening`
      : `Balance due for ${eventDateForClient(inv.event_date) || inv.tier_name || "your evening"}`,
    html: emailShell(body, payUrl(inv), "Pay balance"),
  };
}

/** Pre-event anticipation note. Non-transactional — no CTA, no amounts. Format-agnostic and time-of-day agnostic. */
/** Day-of logistics from the linked deal (deals columns only). */
export type DealLogistics = {
  arrival_time?: string | null;
  on_site_contact_name?: string | null;
  on_site_contact_phone?: string | null;
  parking_access?: string | null;
  venue_address?: string | null;
  /** invoice.venue or deal.location */
  venueName?: string | null;
};

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** deals.arrival_time as "5:45 PM", or null when not a confirmed clock time. */
export function clockArrival(v: unknown): string | null {
  const s = clean(v);
  if (!s) return null;
  if (/^(tba|tbd)$/i.test(s) || /30 minutes before show time/i.test(s)) return null;
  let m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) {
    const h = Number(m[1]), min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
  }
  m = s.match(/^(\d{1,2}):(\d{2})\s*([ap])\.?m\.?$/i);
  if (m) {
    const h = Number(m[1]), min = Number(m[2]);
    if (h < 1 || h > 12 || min > 59) return null;
    return `${h}:${m[2]} ${m[3].toUpperCase()}M`;
  }
  return null;
}

const VENUE_WORDS = /\b(the|hotel|resort|restaurant|club|dining|cafe|theatre|theater|hall|center|centre|venue|garden|loews|hilton|marriott|tiki|evergreen)\b/i;
const hasStreetNumber = (s: string) => /\b\d+[a-z]?\s+[A-Za-z]/i.test(s);

/** True when a venue string is only a city (or empty / TBD) and needs a real address. */
export function isCityOnlyVenue(v: unknown): boolean {
  const s = clean(v);
  if (!s) return true;
  if (/\btbd\b/i.test(s)) return true;
  if (hasStreetNumber(s)) return false;
  if (VENUE_WORDS.test(s)) return false;
  if (/^[A-Za-z .'-]+,\s*[A-Za-z .]+$/.test(s)) return true;
  const words = s.split(/\s+/).filter(Boolean);
  return words.length <= 3;
}

/** The venue we can confirm back to the client, or null when we must ask. */
export function confirmableVenue(l: DealLogistics | null | undefined): string | null {
  const addr = clean(l?.venue_address);
  if (addr) return addr;
  const name = clean(l?.venueName);
  if (name && !isCityOnlyVenue(name)) return name;
  return null;
}

/** Plain-text logistics paragraph for the "Two weeks to go" email. */
export function twoWeeksLogisticsText(l: DealLogistics | null | undefined): string {
  const arrival = clockArrival(l?.arrival_time);
  const contact = clean(l?.on_site_contact_name);
  const phone = clean(l?.on_site_contact_phone);
  const venue = confirmableVenue(l);
  const parking = clean(l?.parking_access);

  if (!arrival && !contact && !venue && !parking) {
    return "To make the evening seamless, could you send me a few details: what time I should arrive, who my contact on site will be (name and phone), the full venue address, and any notes on parking or load-in?";
  }

  const known: string[] = [];
  if (arrival) known.push(`I'll plan to arrive at ${arrival}.`);
  if (contact) known.push(`${contact} will be my contact on site${phone ? `, and I have ${phone} if I need to reach them` : ""}.`);
  if (venue) known.push(`I'll head to ${venue}.`);
  if (parking) known.push(`For parking and load-in, I'll use ${parking}.`);

  if (arrival && contact && venue && parking) {
    return `${known.join(" ")} Please reply only if anything has changed.`;
  }

  const asks: string[] = [];
  if (!arrival) asks.push("what time I should arrive");
  if (!contact) asks.push("who my contact on site will be that evening (name and phone)");
  if (!venue) asks.push("the full venue address");
  const askParking = !parking;
  const join = (a: string[]) =>
    a.length === 1 ? a[0] : `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`;

  let ask: string;
  if (askParking && asks.length && venue && hasStreetNumber(venue)) {
    ask = `Could you send me ${join(asks)}? Any notes on parking or load-in would also help.`;
  } else {
    if (askParking) asks.push("any notes on parking or load-in");
    ask = `Could you send me ${join(asks)}?`;
  }
  return `${known.join(" ")} ${ask}`;
}

export function anticipationEmail(inv: Invoice, daysOut: number, logistics?: DealLogistics | null) {
  const name = inv.client_name?.split(" ")[0] || "there";
  const whenDate = eventDateForClient(inv.event_date);
  const when = whenDate ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;color:#6c7a72;margin:22px 0;letter-spacing:.04em;">${esc(whenDate)}${inv.venue ? ` &nbsp;·&nbsp; ${esc(inv.venue)}` : ""}</div>` : "";

  if (daysOut >= 7) {
    const l: DealLogistics = { ...(logistics || {}), venueName: logistics?.venueName ?? inv.venue };
    const venue = confirmableVenue(l);
    const twoWeeksWhen = whenDate
      ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;color:#6c7a72;margin:22px 0;letter-spacing:.04em;">${esc(whenDate)}${venue ? ` &nbsp;·&nbsp; ${esc(venue)}` : ""}</div>`
      : "";
    const body = `<p>Hi ${esc(name)},</p>
    <p>Your event is a little under two weeks away now, and I couldn't be more excited for it!</p>
    <p>I'm looking forward to being there with you and your guests. When I'm in the room, my whole focus is on making people feel looked after, surprised, and completely present.</p>
    ${twoWeeksWhen}
    <p>${esc(twoWeeksLogisticsText(l))}</p>
    <p>Please let me know if there is anything I can do for you.</p>`;
    return {
      subject: `Two weeks to go`,
      html: emailShell(body),
    };
  }

  const body = `<p>${esc(name)},</p>
  <p>Tomorrow's the day, and I'm looking forward to it.</p>
  <p>I'll arrive early and get everything set before your guests do, so that by the time you're all together the room is ready and so am I. All you have to do is enjoy it.</p>
  ${when}
  <p>Nothing is needed from you between now and then. Rest easy, I have every detail handled. See you tomorrow.</p>
  <p style="margin-top:26px;">Scott</p>`;
  return {
    subject: `See you tomorrow`,
    html: emailShell(body),
  };
}



/** Receipt after a payment clears. */
export function receiptEmail(inv: Invoice, paidCents: number, fullyPaid: boolean) {
  const name = inv.client_name?.split(" ")[0] || "there";
  const body = `<p>${esc(name)},</p>
  <p>Received, and thank you. ${money(paidCents)} is in${fullyPaid ? " and you are paid in full." : `, leaving a balance of <strong>${money(balanceCents(inv))}</strong> due before the event.`}</p>
  ${detailsBlock(inv)}
  <p>Your date is confirmed. I'll be in touch closer to the evening with timing.</p>`;
  return {
    subject: fullyPaid ? `Paid in full. Thank you.` : `Deposit received, your date is confirmed`,
    html: emailShell(body, payUrl(inv), "View invoice"),
  };
}

/** Sent to the client when a bank payment does not go through. */
export function paymentFailedEmail(inv: Invoice) {
  const name = inv.client_name?.split(" ")[0] || "there";
  const body = `<p>${esc(name)},</p>
  <p>A quick note: your bank payment did not go through. Nothing is wrong on your end that a second attempt will not fix, and your invoice is open again whenever you are ready.</p>
  ${detailsBlock(inv)}
  <p>If anything looks off, reply here and I'll sort it out with you.</p>`;
  return {
    subject: `Your payment did not go through`,
    html: emailShell(body, payUrl(inv), "Try payment again"),
  };
}


export async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key || !to) return false;
  const result = await gatedSend({ to, subject, label: "invoice-email" }, (to, subject) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, reply_to: REPLY_TO }),
  }));
  return result.sent;
}
