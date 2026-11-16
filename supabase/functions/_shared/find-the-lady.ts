// Find the Lady booking credit: pure rules plus the claim flow, with the
// database and the Telegram alert injected so the whole flow is testable.

export const LADY_SOURCE = "Find the Lady";
export const CREDIT_CENTS = 25000;
export const MIN_PACKAGE_CENTS = 250000;
export const CODE_PREFIX = "WR-LADY-";
/** No 0/O or 1/I, so a code read aloud on the phone cannot be misheard. */
export const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const LADY_EVENT_TYPES = {
  wedding: "Wedding",
  corporate: "Corporate",
  private_party: "Private party",
  other: "Other",
} as const;
export type LadyEventType = keyof typeof LADY_EVENT_TYPES;

/** Today's date in Los Angeles as YYYY-MM-DD. */
export function pacificToday(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const v = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}`;
}

/** Same calendar day twelve months later (Feb 29 becomes Feb 28). */
export function addTwelveMonths(isoDay: string): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y + 1, m, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${y + 1}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Valid for 12 months from today, Los Angeles time. */
export function creditExpiry(now: Date): string {
  return addTwelveMonths(pacificToday(now));
}

export function generateCreditCode(randomBytes: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = randomBytes(4);
  let out = "";
  for (let i = 0; i < 4; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return CODE_PREFIX + out;
}

export function isCreditCode(v: unknown): boolean {
  return typeof v === "string" && new RegExp(`^${CODE_PREFIX}[${CODE_ALPHABET}]{4}$`).test(v);
}

/** "November 16, 2027" for a YYYY-MM-DD day. */
export function formatDay(isoDay: string): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
}

export interface LadyClaim {
  firstName: string;
  email: string;
  eventType: LadyEventType;
  approxDate: string | null;
  optIn: boolean;
  foundQueen: boolean;
}

export type ClaimValidation = { ok: true; value: LadyClaim } | { ok: false; error: string } | { ok: false; bot: true };

const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;

export function validateClaim(body: unknown, now: Date): ClaimValidation {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  // Hidden field that people never see; anything in it means a script filled the form.
  if (typeof b.website === "string" && b.website.trim() !== "") return { ok: false, bot: true };

  const firstName = typeof b.firstName === "string" ? b.firstName.trim().replace(/\s+/g, " ") : "";
  if (!firstName) return { ok: false, error: "Please add your first name." };
  if (firstName.length > 60 || /[<>{}\\/@]|https?:/i.test(firstName)) return { ok: false, error: "Please use just your first name." };

  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!email || email.length > 255 || !EMAIL_RE.test(email)) return { ok: false, error: "Please check your email address." };

  const eventType = typeof b.eventType === "string" ? b.eventType : "";
  if (!(eventType in LADY_EVENT_TYPES)) return { ok: false, error: "Please choose an event type." };

  let approxDate: string | null = null;
  const rawDate = typeof b.approxDate === "string" ? b.approxDate.trim() : "";
  if (rawDate) {
    const m = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const parsed = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
    if (!m || !parsed || parsed.getUTCMonth() !== +m[2] - 1 || parsed.getUTCDate() !== +m[3]) {
      return { ok: false, error: "Please check the event date." };
    }
    const today = pacificToday(now);
    const latest = `${Number(today.slice(0, 4)) + 5}${today.slice(4)}`;
    if (rawDate < today) return { ok: false, error: "Please choose a date that has not passed yet." };
    if (rawDate > latest) return { ok: false, error: "Please check the event date." };
    approxDate = rawDate;
  }

  return {
    ok: true,
    value: { firstName, email, eventType: eventType as LadyEventType, approxDate, optIn: b.optIn === true, foundQueen: b.foundQueen === true },
  };
}

export interface StoredCredit {
  id: string;
  code: string;
  expires_on: string;
  deal_id: string | null;
}

export interface CreditRow {
  code: string;
  email: string;
  first_name: string;
  event_type: LadyEventType;
  approx_event_date: string | null;
  found_queen: boolean;
  marketing_opt_in: boolean;
  credit_cents: number;
  min_package_cents: number;
  expires_on: string;
}

export interface LadyDealRow {
  contact_email: string;
  contact_name: string;
  event_type: LadyEventType;
  event_date: null;
  stage: "new";
  source: typeof LADY_SOURCE;
  notes: string;
}

export interface ClaimStore {
  /** The active credit for this email, if any (any expiry). */
  findActiveCredit(email: string): Promise<StoredCredit | null>;
  /** Mark a credit past its date as expired so a fresh one can be issued. */
  expireCredit(id: string): Promise<void>;
  /** Insert the credit. "duplicate_code" or "duplicate_email" on a unique clash. */
  insertCredit(row: CreditRow): Promise<{ status: "ok"; credit: StoredCredit } | { status: "duplicate_code" | "duplicate_email" }>;
  /** Most recent deal for this email that is still in play (not lost or completed). */
  findOpenDeal(email: string): Promise<{ id: string } | null>;
  createDeal(row: LadyDealRow): Promise<{ id: string }>;
  attachDeal(creditId: string, dealId: string): Promise<void>;
  logActivity(dealId: string, title: string, body: string, metadata: Record<string, unknown>): Promise<void>;
}

export interface LadyAlert {
  creditId: string;
  code: string;
  expiresOn: string;
  firstName: string;
  eventType: string;
  approxDate: string | null;
  foundQueen: boolean;
  optIn: boolean;
  dealId: string | null;
}

export interface ClaimDeps {
  store: ClaimStore;
  now: Date;
  randomBytes?: (n: number) => Uint8Array;
  /** Fires the single Telegram alert for a newly issued credit. Must not throw. */
  notify: (alert: LadyAlert) => unknown;
}

export interface ClaimResult {
  code: string;
  expiresOn: string;
  dealId: string | null;
  /** True when this email already held a credit and it was handed back. */
  existing: boolean;
}

export function dealNotes(claim: LadyClaim, code: string, expiresOn: string): string {
  return [
    `Find the Lady credit ${code}: $250 toward a White Rabbit package of $2,500 or more. Valid until ${formatDay(expiresOn)}.`,
    `Approximate event date: ${claim.approxDate ? formatDay(claim.approxDate) : "not given"}`,
    `Found the Queen: ${claim.foundQueen ? "yes" : "no"}`,
    `Occasional notes from White Rabbit: ${claim.optIn ? "yes, opted in" : "no"}`,
  ].join("\n");
}

/**
 * Claim flow. The credit row is written first, so a double submit or a second
 * visit with the same email returns the same code and never creates a second
 * lead or a second alert.
 */
export async function claimLadyCredit(claim: LadyClaim, deps: ClaimDeps): Promise<ClaimResult> {
  const { store, now } = deps;
  const today = pacificToday(now);

  const current = await store.findActiveCredit(claim.email);
  if (current && current.expires_on >= today) {
    return { code: current.code, expiresOn: current.expires_on, dealId: current.deal_id, existing: true };
  }
  if (current) await store.expireCredit(current.id);

  const expiresOn = creditExpiry(now);
  let credit: StoredCredit | null = null;
  for (let attempt = 0; attempt < 6 && !credit; attempt++) {
    const res = await store.insertCredit({
      code: generateCreditCode(deps.randomBytes),
      email: claim.email,
      first_name: claim.firstName,
      event_type: claim.eventType,
      approx_event_date: claim.approxDate,
      found_queen: claim.foundQueen,
      marketing_opt_in: claim.optIn,
      credit_cents: CREDIT_CENTS,
      min_package_cents: MIN_PACKAGE_CENTS,
      expires_on: expiresOn,
    });
    if (res.status === "ok") credit = res.credit;
    else if (res.status === "duplicate_email") {
      // A second submit landed at the same moment: hand back the code it created.
      const raced = await store.findActiveCredit(claim.email);
      if (raced) return { code: raced.code, expiresOn: raced.expires_on, dealId: raced.deal_id, existing: true };
    }
  }
  if (!credit) throw new Error("Could not issue a unique credit code");

  const notes = dealNotes(claim, credit.code, expiresOn);
  let dealId: string | null = null;
  try {
    const open = await store.findOpenDeal(claim.email);
    dealId = open ? open.id : (await store.createDeal({
      contact_email: claim.email,
      contact_name: claim.firstName,
      event_type: claim.eventType,
      event_date: null,
      stage: "new",
      source: LADY_SOURCE,
      notes,
    })).id;
    await store.attachDeal(credit.id, dealId);
    await store.logActivity(dealId, `Find the Lady credit ${credit.code}`, notes, {
      source: LADY_SOURCE, code: credit.code, expires_on: expiresOn, found_queen: claim.foundQueen,
      opt_in: claim.optIn, existing_deal: Boolean(open),
    });
  } catch (err) {
    // The credit is saved either way; the visitor still gets their code.
    console.error("Find the Lady lead step failed:", err instanceof Error ? err.message : err);
  }

  deps.notify({
    creditId: credit.id, code: credit.code, expiresOn, firstName: claim.firstName,
    eventType: LADY_EVENT_TYPES[claim.eventType], approxDate: claim.approxDate,
    foundQueen: claim.foundQueen, optIn: claim.optIn, dealId,
  });

  return { code: credit.code, expiresOn, dealId, existing: false };
}
