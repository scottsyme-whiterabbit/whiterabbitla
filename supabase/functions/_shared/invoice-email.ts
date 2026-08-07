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
  if (inv.event_date) rows.push(`<strong>Date:</strong> ${esc(inv.event_date)}`);
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
      ? `Your event is today, and the remaining balance of <strong>${money(balanceCents(inv))}</strong> is due.`
      : `We're ${daysOut} ${daysOut === 1 ? "day" : "days"} out. The remaining balance of <strong>${money(balanceCents(inv))}</strong> is due before the performance.`;
  const body = `<p>${esc(name)},</p>
  <p>${lead}</p>
  ${detailsBlock(inv)}
  <p>Paid to date: ${money(inv.amount_paid_cents || 0)}. Everything else is handled on my end.</p>`;
  return {
    subject: daysOut <= 0
      ? `Balance due today for ${inv.tier_name || "your evening"}`
      : `Balance due for ${inv.event_date || inv.tier_name || "your evening"}`,
    html: emailShell(body, payUrl(inv), "Pay balance"),
  };
}

/** Pre-event anticipation note. Non-transactional — no CTA, no amounts. Format-agnostic and time-of-day agnostic. */
export function anticipationEmail(inv: Invoice, daysOut: number) {
  const name = inv.client_name?.split(" ")[0] || "there";
  const when = inv.event_date ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:13px;color:#6c7a72;margin:22px 0;letter-spacing:.04em;">${esc(inv.event_date)}${inv.venue ? ` &nbsp;·&nbsp; ${esc(inv.venue)}` : ""}</div>` : "";

  if (daysOut >= 7) {
    const body = `<p>${esc(name)},</p>
    <p>Your event is a little under two weeks away now, and I couldn't be more excited for it.</p>
    <p>I wanted to reach out for no reason other than to say I'm genuinely looking forward to spending it with you and your guests. When I'm there, my whole focus is on the people in the room, making them feel looked after, surprised, and completely present. That's the part I love most.</p>
    ${when}
    <p>If anything has changed, whether the timing or the location or the plans, just reply here and I'll take care of it. Otherwise there's nothing to do but look forward to it. I certainly am.</p>
    <p style="margin-top:26px;">Scott</p>`;
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
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, reply_to: REPLY_TO }),
  });
  if (!res.ok) console.error("Resend failed", res.status, await res.text().catch(() => ""));
  return res.ok;
}
