// Find the Queen booking credit (the pop-up game, shown as "Find the Lady" in the CRM):
// pure rules plus the claim flow, with the database, the welcome email and the
// Telegram alert injected so the whole flow is testable.

export const QUEEN_SOURCE = "find-the-queen-popup";
/** Lead source used when Scott moves a claim into the pipeline by hand. */
export const PIPELINE_SOURCE = "find-the-lady";
export const CREDIT_CENTS = 25000;
export const MIN_PACKAGE_CENTS = 250000;
export const CODE_PREFIX = "LIGHTS-UP-";
export const SITE = "https://whiterabbitla.com";

export const OCCASIONS = {
  wedding: "Wedding",
  corporate: "Corporate event",
  private_party: "Private party",
  holiday_party: "Holiday party",
  other: "Something else",
} as const;
export type Occasion = keyof typeof OCCASIONS;

export const TIMINGS = {
  this_month: "This month",
  next_3_months: "Next 3 months",
  later_this_year: "Later this year",
  still_deciding: "Still deciding",
} as const;
export type Timing = keyof typeof TIMINGS;

export const occasionLabel = (v: unknown): string => (typeof v === "string" && v in OCCASIONS ? OCCASIONS[v as Occasion] : "");
export const timingLabel = (v: unknown): string => (typeof v === "string" && v in TIMINGS ? TIMINGS[v as Timing] : "");

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

/** The calendar quarter of the drawing, Los Angeles time, e.g. "2026 Q4". */
export function drawingQuarter(now: Date): string {
  const [y, m] = pacificToday(now).split("-").map(Number);
  return `${y} Q${Math.floor((m - 1) / 3) + 1}`;
}

/** Four random digits, e.g. LIGHTS-UP-0427. Rejection sampling keeps every number equally likely. */
export function generateCreditCode(randomBytes: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  for (let i = 0; i < 16; i++) {
    const [hi, lo] = randomBytes(2);
    const n = (hi << 8) | lo; // 0..65535
    if (n < 60000) return CODE_PREFIX + String(n % 10000).padStart(4, "0");
  }
  const [hi, lo] = randomBytes(2);
  return CODE_PREFIX + String(((hi << 8) | lo) % 10000).padStart(4, "0");
}

export function isCreditCode(v: unknown): boolean {
  return typeof v === "string" && /^LIGHTS-UP-[0-9]{4}$/.test(v);
}

/** "November 16, 2027" for a YYYY-MM-DD day. */
export function formatDay(isoDay: string): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" });
}

export interface QueenClaim {
  firstName: string;
  email: string;
  occasion: Occasion;
  timing: Timing;
  /** What the guest's own pick turned up. */
  foundQueen: boolean;
  /** Only the optional checkbox sets this; it never affects the code or the drawing. */
  marketingOptIn: boolean;
}

export type ClaimValidation = { ok: true; value: QueenClaim } | { ok: false; error: string } | { ok: false; bot: true };

const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[a-z]{2,}$/i;

export function validateClaim(body: unknown): ClaimValidation {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  // Hidden field that people never see; anything in it means a script filled the form.
  if (typeof b.website === "string" && b.website.trim() !== "") return { ok: false, bot: true };

  const firstName = typeof b.firstName === "string" ? b.firstName.trim().replace(/\s+/g, " ") : "";
  if (!firstName) return { ok: false, error: "Please add your first name." };
  if (firstName.length > 60 || /[<>{}\\/@]|https?:/i.test(firstName)) return { ok: false, error: "Please use just your first name." };

  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!email || email.length > 255 || !EMAIL_RE.test(email)) return { ok: false, error: "Please check your email address." };

  if (!occasionLabel(b.occasion)) return { ok: false, error: "Please choose your occasion." };
  if (!timingLabel(b.timing)) return { ok: false, error: "Please choose when the big night is." };

  return {
    ok: true,
    value: {
      firstName, email,
      occasion: b.occasion as Occasion,
      timing: b.timing as Timing,
      foundQueen: b.foundQueen === true,
      marketingOptIn: b.marketingOptIn === true,
    },
  };
}

export interface StoredCredit {
  id: string;
  code: string;
  expires_on: string;
  found_queen: boolean;
  drawing_entry: boolean;
  drawing_quarter: string | null;
}

export interface CreditRow {
  code: string;
  email: string;
  first_name: string;
  event_type: Occasion;
  event_timing: Timing;
  approx_event_date: null;
  found_queen: boolean;
  marketing_opt_in: boolean;
  credit_cents: number;
  min_package_cents: number;
  expires_on: string;
  source: typeof QUEEN_SOURCE;
  /** Entered in the quarterly drawing only when the guest found the Queen. */
  drawing_entry: boolean;
  drawing_quarter: string | null;
}

export interface ClaimStore {
  findActiveCredit(email: string): Promise<StoredCredit | null>;
  expireCredit(id: string): Promise<void>;
  insertCredit(row: CreditRow): Promise<{ status: "ok"; credit: StoredCredit } | { status: "duplicate_email" } | { status: "duplicate_code" }>;
  /** A returning guest who now found the Queen joins this quarter's drawing on the code they already hold. */
  enterDrawing(id: string, quarter: string): Promise<void>;
}

export interface NewCredit {
  creditId: string;
  code: string;
  expiresOn: string;
  firstName: string;
  email: string;
  occasion: Occasion;
  timing: Timing;
  foundQueen: boolean;
  quarter: string;
}

export interface ClaimDeps {
  store: ClaimStore;
  now: Date;
  randomBytes?: (n: number) => Uint8Array;
  /** Starts the welcome email and the Telegram alert for a newly issued code. Must not throw. */
  followUp: (credit: NewCredit) => unknown;
}

export interface ClaimResult {
  code: string;
  expiresOn: string;
  /** True when this email already held a code and it was handed back. */
  existing: boolean;
  drawingEntry: boolean;
}

/**
 * Claim flow. The credit row is written first, so a double submit or a second
 * visit with the same email returns the same code and never sends a second
 * email or a second alert. Claims never create pipeline deals; Scott moves a
 * claim into the pipeline by hand, or a later booking quiz links to it.
 */
export async function claimQueenCredit(claim: QueenClaim, deps: ClaimDeps): Promise<ClaimResult> {
  const { store, now } = deps;
  const today = pacificToday(now);
  const quarter = drawingQuarter(now);

  const handBack = async (c: StoredCredit): Promise<ClaimResult> => {
    let drawingEntry = c.drawing_entry && c.drawing_quarter === quarter;
    if (claim.foundQueen && !drawingEntry) {
      try {
        await store.enterDrawing(c.id, quarter);
        drawingEntry = true;
      } catch (err) {
        console.error("Find the Queen drawing entry failed:", err instanceof Error ? err.message : err);
      }
    }
    return { code: c.code, expiresOn: c.expires_on, existing: true, drawingEntry };
  };

  const current = await store.findActiveCredit(claim.email);
  if (current && current.expires_on >= today) return handBack(current);
  if (current) await store.expireCredit(current.id);

  const expiresOn = creditExpiry(now);
  let credit: StoredCredit | null = null;
  for (let attempt = 0; attempt < 12 && !credit; attempt++) {
    const res = await store.insertCredit({
      code: generateCreditCode(deps.randomBytes),
      email: claim.email,
      first_name: claim.firstName,
      event_type: claim.occasion,
      event_timing: claim.timing,
      approx_event_date: null,
      found_queen: claim.foundQueen,
      marketing_opt_in: claim.marketingOptIn,
      credit_cents: CREDIT_CENTS,
      min_package_cents: MIN_PACKAGE_CENTS,
      expires_on: expiresOn,
      source: QUEEN_SOURCE,
      drawing_entry: claim.foundQueen,
      drawing_quarter: claim.foundQueen ? quarter : null,
    });
    if (res.status === "ok") credit = res.credit;
    else if (res.status === "duplicate_email") {
      // A second submit landed at the same moment: hand back the code it created.
      const raced = await store.findActiveCredit(claim.email);
      if (raced) return handBack(raced);
    }
  }
  if (!credit) throw new Error("Could not issue a unique credit code");

  try {
    deps.followUp({
      creditId: credit.id, code: credit.code, expiresOn, firstName: claim.firstName, email: claim.email,
      occasion: claim.occasion, timing: claim.timing, foundQueen: claim.foundQueen, quarter,
    });
  } catch (err) {
    // The claim is saved either way; the guest still gets their code.
    console.error("Find the Queen follow up failed to start:", err instanceof Error ? err.message : err);
  }

  return { code: credit.code, expiresOn, existing: false, drawingEntry: claim.foundQueen };
}

/** Deal Scott creates with "Move to pipeline". Uses its own source so it shows in the New column. */
export function pipelineDealFromClaim(c: { email: string; first_name: string; code: string; expires_on: string; event_type: string | null; event_timing: string | null; found_queen: boolean }) {
  const eventTypeMap: Record<string, string> = { wedding: "wedding", corporate: "corporate", private_party: "private_party", holiday_party: "private_party", other: "other" };
  const notes = [
    `Find the Lady code ${c.code}, valid until ${formatDay(c.expires_on)}.`,
    `Occasion: ${occasionLabel(c.event_type) || "not given"}. Timing: ${timingLabel(c.event_timing) || "not given"}.`,
    `Found the Queen: ${c.found_queen ? "yes" : "no"}.`,
    "Moved from the Find the Lady list.",
  ].join("\n");
  return {
    contact_email: c.email,
    contact_name: c.first_name,
    event_type: c.event_type ? eventTypeMap[c.event_type] || "other" : null,
    stage: "new" as const,
    source: PIPELINE_SOURCE,
    notes,
  };
}

// ── Quarterly drawing ───────────────────────────────────────────────────────

export interface DrawingEntry {
  kind: "claim" | "alternate";
  id: string;
  name: string;
  email: string;
}

/**
 * Everyone eligible for a quarter: guests who found the Queen that quarter plus
 * free alternate entries. One entry per email address, whichever way it came in.
 */
export function drawingPool(
  claims: { id: string; first_name: string; email: string; drawing_entry: boolean; drawing_quarter: string | null; status: string }[],
  alternates: { id: string; first_name: string; email: string; quarter: string }[],
  quarter: string,
): DrawingEntry[] {
  const seen = new Set<string>();
  const out: DrawingEntry[] = [];
  const add = (e: DrawingEntry) => {
    const key = e.email.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(e);
  };
  for (const c of claims) {
    if (c.drawing_entry && c.drawing_quarter === quarter && c.status !== "void") add({ kind: "claim", id: c.id, name: c.first_name, email: c.email });
  }
  for (const a of alternates) if (a.quarter === quarter) add({ kind: "alternate", id: a.id, name: a.first_name, email: a.email });
  return out;
}

/** Uniform random index below n from a cryptographic source (rejection sampling, no bias). */
export function randomIndex(n: number, randomU32: () => number = () => crypto.getRandomValues(new Uint32Array(1))[0]): number {
  if (!Number.isInteger(n) || n <= 0) throw new Error("No entries to draw from");
  const limit = Math.floor(0x100000000 / n) * n;
  for (;;) {
    const r = randomU32();
    if (r < limit) return r % n;
  }
}

export function pickWinner(pool: DrawingEntry[], randomU32?: () => number): DrawingEntry {
  return pool[randomIndex(pool.length, randomU32)];
}

// ── Welcome email ───────────────────────────────────────────────────────────

export interface WelcomeEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
}

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

export const WELCOME_SUBJECT = "Your White Rabbit code";
export const SIGNATURE = ["Scott Syme", "Magician", "(424) 394-1850", "whiterabbitla.com"];
export const MAILING_ADDRESS = "7393 W. Manchester Ave #209, Los Angeles, CA 90045";

/** No prices or dollar amounts anywhere in this email. */
export function welcomeParagraphs(c: Pick<NewCredit, "firstName" | "code" | "expiresOn" | "foundQueen">): string[] {
  return [
    `Hi ${c.firstName},`,
    "Thank you for playing Find the Queen with White Rabbit.",
    `Your code: ${c.code}`,
    `It is good until ${formatDay(c.expiresOn)}. When you are ready to reserve your date, reply to this email or plan your evening at whiterabbitla.com/contact, and mention your code.`,
    c.foundQueen
      ? "You found the Queen, so you are entered in this quarter's drawing for a complimentary White Rabbit show. If your name is drawn, I will write to you at this address."
      : "The Queen got away this time, but you can still enter this quarter's drawing for a complimentary White Rabbit show for free. The Official Rules explain how.",
    `The terms of your code and the Official Rules are at ${SITE.replace("https://", "")}/official-rules.`,
  ];
}

export function buildWelcomeEmail(c: Pick<NewCredit, "firstName" | "code" | "expiresOn" | "email" | "foundQueen">): WelcomeEmail {
  const unsubscribeUrl = `${SITE}/unsubscribe?email=${encodeURIComponent(c.email)}`;
  const paras = welcomeParagraphs(c);
  const footer = [
    `Official Rules: ${SITE}/official-rules`,
    `Unsubscribe: ${unsubscribeUrl}`,
    `White Rabbit LA, ${MAILING_ADDRESS}`,
  ];
  const text = [...paras, SIGNATURE.join("\n"), footer.join("\n")].join("\n\n");

  const p = (s: string) => `<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:16px;line-height:1.65;color:#223D34;">${s}</p>`;
  const body = paras.map((s, i) => {
    if (i === 2) return `<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:22px;letter-spacing:2px;color:#223D34;">${esc(c.code)}</p>`;
    if (i === 3) return p(`It is good until ${esc(formatDay(c.expiresOn))}. When you are ready to reserve your date, reply to this email or <a href="${SITE}/contact" style="color:#223D34;">plan your evening</a>, and mention your code.`);
    if (i === 5) return p(`The terms of your code and the <a href="${SITE}/official-rules" style="color:#223D34;">Official Rules</a> are on our site.`);
    return p(esc(s));
  }).join("");
  const sig = `<p style="margin:24px 0 0;font-family:Georgia,serif;font-size:15px;line-height:1.5;color:#223D34;">${SIGNATURE.slice(0, 3).map(esc).join("<br>")}<br><a href="${SITE}" style="color:#223D34;">whiterabbitla.com</a></p>`;
  const foot = `<p style="margin:32px 0 0;font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#6b7a73;"><a href="${SITE}/official-rules" style="color:#6b7a73;">Official Rules</a> &middot; <a href="${esc(unsubscribeUrl)}" style="color:#6b7a73;">Unsubscribe</a><br>White Rabbit LA, ${esc(MAILING_ADDRESS)}</p>`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background:#F8F5F0;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5F0;padding:32px 16px;"><tr><td align="center"><table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;"><tr><td style="padding:8px 4px;">${body}${sig}${foot}</td></tr></table></td></tr></table></body></html>`;

  return { to: c.email, subject: WELCOME_SUBJECT, html, text, unsubscribeUrl };
}

export interface WelcomeStore {
  /** Atomically marks the credit's welcome email as sending; false if it was already claimed. */
  claimWelcome(creditId: string): Promise<boolean>;
  markWelcomeSent(creditId: string): Promise<void>;
  /** Rolls the claim back so a later retry can send it. */
  releaseWelcome(creditId: string): Promise<void>;
}

export type WelcomeStatus = "sent" | "already_sent" | `not_sent:${string}`;

/** Welcome email first (claimed, rolled back on failure), then the single Telegram alert. */
export async function welcomeThenAlert(
  credit: NewCredit,
  deps: {
    store: WelcomeStore;
    send: (email: WelcomeEmail) => Promise<{ sent: boolean; reason?: string }>;
    notify: (credit: NewCredit, welcome: WelcomeStatus) => Promise<unknown>;
  },
): Promise<WelcomeStatus> {
  let status: WelcomeStatus;
  try {
    if (!(await deps.store.claimWelcome(credit.creditId))) status = "already_sent";
    else {
      let result: { sent: boolean; reason?: string };
      try {
        result = await deps.send(buildWelcomeEmail(credit));
      } catch (err) {
        result = { sent: false, reason: err instanceof Error ? err.message : "send_exception" };
      }
      if (result.sent) {
        await deps.store.markWelcomeSent(credit.creditId);
        status = "sent";
      } else {
        await deps.store.releaseWelcome(credit.creditId);
        status = `not_sent:${result.reason || "unknown"}`;
      }
    }
  } catch (err) {
    status = `not_sent:${err instanceof Error ? err.message : "claim_failed"}`;
  }
  try {
    await deps.notify(credit, status);
  } catch { /* the alert never blocks anything */ }
  return status;
}
