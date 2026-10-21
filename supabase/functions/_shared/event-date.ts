// Event dates arrive as free text (contact_inquiries.date, proposals.event_date,
// signed_agreements.event_date). Never feed them to new Date() directly:
// "2026-12-05" becomes UTC midnight and prints as the day before in Los Angeles.
// parseEventDate returns a calendar date (no time zone) or null.

export type EventDate = { year: number; month: number; day: number };

const TZ = "America/Los_Angeles";
const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function valid(year: number, month: number, day: number): EventDate | null {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (month < 1 || month > 12 || day < 1) return null;
  const dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > dim) return null;
  return { year, month, day };
}

/** Today's calendar date in Los Angeles. */
export function todayPacific(now: Date = new Date()): EventDate {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [y, m, d] = p.split("-").map(Number);
  return { year: y, month: m, day: d };
}

const cmp = (a: EventDate, b: EventDate) => a.year - b.year || a.month - b.month || a.day - b.day;

/** Parse a free-text event date. Returns null when it cannot be read with confidence. */
export function parseEventDate(raw: unknown, now: Date = new Date()): EventDate | null {
  if (raw instanceof Date) {
    if (!isFinite(raw.getTime())) return null;
    return { year: raw.getUTCFullYear(), month: raw.getUTCMonth() + 1, day: raw.getUTCDate() };
  }
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;

  // ISO YYYY-MM-DD (optionally followed by a time, which is ignored).
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/);
  if (m) return valid(+m[1], +m[2], +m[3]);

  // MMDDYYYY
  m = s.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (m) return valid(+m[3], +m[1], +m[2]);

  // M/D/YYYY, MM-DD-YY, M.D.YY
  m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2}|\d{4})$/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return valid(y, +m[1], +m[2]);
  }

  // Written forms: "Saturday, December 5th", "December 5, 2026", "Dec 5 2026", "5 December 2026".
  const t = s.toLowerCase()
    .replace(/\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(day|nesday|rsday|urday|sday)?\b\.?,?/g, " ")
    .replace(/(\d+)(st|nd|rd|th)\b/g, "$1")
    .replace(/[,.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  let month: number | undefined, day: number | undefined, year: number | undefined;
  m = t.match(/^([a-z]+) (\d{1,2})(?: (\d{4}))?$/);
  if (m && MONTHS[m[1]]) { month = MONTHS[m[1]]; day = +m[2]; year = m[3] ? +m[3] : undefined; }
  else {
    m = t.match(/^(\d{1,2}) ([a-z]+)(?: (\d{4}))?$/);
    if (m && MONTHS[m[2]]) { month = MONTHS[m[2]]; day = +m[1]; year = m[3] ? +m[3] : undefined; }
  }
  if (!month || !day) return null;
  if (year === undefined) {
    // No year given: the next occurrence on or after today in Los Angeles.
    const today = todayPacific(now);
    year = today.year;
    const candidate = valid(year, month, day);
    if (!candidate) return valid(year + 1, month, day);
    if (cmp(candidate, today) < 0) year += 1;
  }
  return valid(year, month, day);
}

/** "Saturday, December 5". The weekday is computed for the calendar date itself. */
export function formatEventDate(d: EventDate): string {
  // Noon UTC on that date is the same calendar day in Los Angeles.
  const at = new Date(Date.UTC(d.year, d.month - 1, d.day, 12));
  return at.toLocaleDateString("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });
}

/** ISO YYYY-MM-DD for storing in a date column. */
export function eventDateIso(d: EventDate): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

/** Scott-facing: formatted date, or "date unclear". */
export function eventDateForAlert(raw: unknown): string {
  const d = parseEventDate(raw);
  return d ? formatEventDate(d) : "date unclear";
}

/** Client-facing: formatted date, or "" so the caller can omit the phrase. */
export function eventDateForClient(raw: unknown): string {
  const d = parseEventDate(raw);
  return d ? formatEventDate(d) : "";
}

export function isFutureEventDate(raw: unknown, now: Date = new Date()): boolean {
  const d = parseEventDate(raw, now);
  return !!d && cmp(d, todayPacific(now)) >= 0;
}
