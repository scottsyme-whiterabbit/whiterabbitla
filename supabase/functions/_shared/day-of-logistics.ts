// Pure day-of logistics rules for the booked-client "Two weeks to go" email.
// Reads deals columns only; never signed_agreements arrival text.

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

