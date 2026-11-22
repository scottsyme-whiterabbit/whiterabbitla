export const PUBLIC_PROPOSAL_FIELDS = [
  "id", "slug", "first_name", "last_name", "recipient_email", "event_type", "event_date", "venue",
  "letter_intro", "intro_paragraph", "hero_image", "timeline", "tiers", "faqs", "gallery_photos",
  "reviews", "closing_quote", "sent_at", "created_at", "special_terms", "omit_photography",
] as const;

function pick(row: Record<string, unknown>, fields: readonly string[]) {
  return Object.fromEntries(fields.filter(key => key in row).map(key => [key, row[key]]));
}

export function publicProposal(row: Record<string, unknown>) {
  const result = pick(row, PUBLIC_PROPOSAL_FIELDS);
  // JSON columns must not carry extra internal fields either.
  for (const [key, fields] of [
    ["tiers", ["name", "tagline", "items", "price", "href", "cta", "recommended"]],
    ["timeline", ["time", "desc"]], ["faqs", ["q", "a"]], ["reviews", ["text", "name", "role"]],
  ] as const) {
    if (Array.isArray(result[key])) {
      result[key] = result[key].map(item => item && typeof item === "object" ? pick(item, fields) : item);
    }
  }
  return result;
}

export function publicSignResponse(row: Record<string, unknown>) {
  return pick(row, ["pay_token", "total_cents", "deposit_cents", "pay_url"]);
}
const RESERVATION_START_TIME = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const INACTIVE_STATUSES = ["void", "cancelled", "canceled"];

// Signed state for the public proposal page. Exactly three fields, so no
// email, IP, agreement text, pay token or amount can leak through it.
export function publicReservation(
  agreement: Record<string, unknown> | null | undefined,
  invoices: Array<Record<string, unknown>> | null | undefined,
) {
  if (!agreement) return null;
  const start = typeof agreement.event_start_time === "string" ? agreement.event_start_time.trim().slice(0, 5) : "";
  const depositPaid = (invoices || []).some((inv) => {
    const status = typeof inv?.status === "string" ? inv.status : "";
    if (INACTIVE_STATUSES.includes(status)) return false;
    return status === "deposit_paid" || status === "paid" || !!inv?.deposit_paid_at;
  });
  return {
    tier_name: typeof agreement.tier_name === "string" ? agreement.tier_name : "",
    start_time: RESERVATION_START_TIME.test(start) ? start : null,
    deposit_paid: depositPaid,
  };
}
