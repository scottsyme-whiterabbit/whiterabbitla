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